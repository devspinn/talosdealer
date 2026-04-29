import * as cheerio from 'cheerio'
import type { DealerInfo, RawListing, ScrapedData, HeroSlide, ScrapedTestimonial } from './types.js'
import { extractListing } from './extract.js'
import {
  detectSiteVersion,
  classicStrategy,
  ariStrategy,
  bigsplashStrategy,
  type ScrapeStrategy,
  type SiteVersion,
} from './strategies/index.js'
import { crawlWooCommerce } from './woocommerce.js'
import { fetchPage, evaluateInPage, closeBrowser } from './browser.js'


function getStrategy(version: 'classic' | 'ari' | 'bigsplash'): ScrapeStrategy {
  if (version === 'ari') return ariStrategy
  if (version === 'bigsplash') return bigsplashStrategy
  return classicStrategy
}

/**
 * Crawl a dealer website, discover inventory listings, and extract data.
 */
export async function crawl(
  baseUrl: string,
  onProgress?: (msg: string) => void,
): Promise<ScrapedData> {
  const log = onProgress ?? (() => {})
  const origin = new URL(baseUrl).origin

  // Step 1: Fetch the homepage/base URL
  log('Fetching homepage...')
  const homepageHtml = await fetchPage(baseUrl)

  // Step 2: Detect site version
  const $ = cheerio.load(homepageHtml)
  const version = detectSiteVersion($, homepageHtml, baseUrl)
  log(`Detected site version: ${version}`)

  // WooCommerce uses a completely different crawl path (JSON API, not HTML scraping)
  if (version === 'woocommerce') {
    return crawlWooCommerce(origin, homepageHtml, baseUrl, log)
  }

  const strategy = getStrategy(version)

  // Step 3: Extract dealer info from the homepage
  log('Extracting dealer info...')
  const dealer = extractDealerInfo(homepageHtml, baseUrl)

  // Step 4: Discover inventory page URLs
  log('Discovering inventory pages...')
  let inventoryUrls = strategy.discoverInventoryPages(
    cheerio.load(homepageHtml),
    origin,
  )

  if (inventoryUrls.length === 0) {
    // Try common paths as fallback
    log('No inventory links found in nav, probing common paths...')
    inventoryUrls = await probeCommonPaths(origin, log)
  }

  if (inventoryUrls.length === 0) {
    log('No inventory pages found. Trying base URL as inventory page...')
    inventoryUrls = [baseUrl]
  }

  log(`Found ${inventoryUrls.length} inventory page(s)`)

  // Step 5: Try the fast path — DealerSpike v6 loads all inventory as a JS array
  let listings: RawListing[] = []

  if (version === 'classic') {
    const invPageUrl = inventoryUrls[0] ?? `${origin}/default.asp?page=xAllInventory`
    log(`Loading inventory page: ${invPageUrl}`)
    await fetchPage(invPageUrl)

    const inlineVehicles = await extractInlineVehicles(origin)
    if (inlineVehicles.length > 0) {
      log(`Found ${inlineVehicles.length} vehicles via inline JS data (fast path)`)
      listings = inlineVehicles
    }
  }

  // Fallback: crawl individual detail pages if fast path didn't work
  if (listings.length === 0) {
    const detailUrls = new Set<string>()
    const globalVisitedPages = new Set<string>()

    for (const invUrl of inventoryUrls) {
      if (globalVisitedPages.has(invUrl)) continue
      log(`Crawling inventory page: ${invUrl}`)
      try {
        await crawlInventoryPage(invUrl, origin, detailUrls, strategy, log, globalVisitedPages)
      } catch (err) {
        log(`Warning: Failed to crawl ${invUrl}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    log(`Found ${detailUrls.size} unique listing detail pages`)

    let i = 0
    for (const detailUrl of detailUrls) {
      i++
      log(`Extracting listing ${i}/${detailUrls.size}: ${detailUrl}`)
      try {
        const html = await fetchPage(detailUrl)
        const listing = extractListing(html, detailUrl, version)
        listings.push(listing)
      } catch (err) {
        log(`Warning: Failed to extract ${detailUrl}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  log(`Successfully extracted ${listings.length} listings`)

  return { dealer, listings }
}

/**
 * Probe common inventory paths when nav-based discovery fails.
 */
async function probeCommonPaths(
  origin: string,
  log: (msg: string) => void,
): Promise<string[]> {
  const commonPaths = [
    '/inventory',
    '/search/inventory',
    '/all-inventory',
    '/new-inventory',
    '/used-inventory',
    '/--inventory',
    '/default.asp',
    '/inventory.asp',
    '/units',
    '/showroom',
  ]

  const found: string[] = []

  for (const path of commonPaths) {
    const testUrl = `${origin}${path}`
    try {
      await fetchPage(testUrl)
      found.push(testUrl)
      log(`Found inventory page: ${testUrl}`)
    } catch {
      // Not found, skip
    }
  }

  return found
}

/**
 * Extract dealer info from the homepage HTML.
 */
export function extractDealerInfo(html: string, sourceUrl: string): DealerInfo {
  const $ = cheerio.load(html)
  const origin = new URL(sourceUrl).origin

  // Name: Try various common locations
  const titleText = $('title').text().trim()
  const titleParts = titleText.split(/[|\-–]/).map((p) => p.trim()).filter(Boolean)
  // Prefer the shortest title segment that still looks like a business name — sites
  // often lead with SEO keyword stuffing and bury the actual name further along.
  const titleName = titleParts
    .filter((p) => p.length >= 4 && p.length < 80 && /[A-Za-z]/.test(p))
    .sort((a, b) => a.length - b.length)[0]

  const ldName = extractLdJsonName($)

  const name =
    $('meta[property="og:site_name"]').attr('content')?.trim() ||
    $('.dealer-name, .site-name, .company-name, [class*="dealer-name"]').first().text().trim() ||
    (ldName && ldName.length < 100 ? ldName : null) ||
    $('header .logo img').attr('alt')?.trim() ||
    titleName ||
    'Unknown Dealer'

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const logo = findDealerLogo($, origin)

  const phoneEl = $('a[href^="tel:"]').first()
  const phone = phoneEl.attr('href')?.replace('tel:', '').trim() || phoneEl.text().trim() || findPhone($)

  const emailEl = $('a[href^="mailto:"]').first()
  const email = emailEl.attr('href')?.replace('mailto:', '').trim() || undefined

  const addressInfo = extractAddress($)

  const heroImage = resolveUrl(
    $('meta[property="og:image"]').attr('content') ||
      $('.hero img, .banner img, [class*="hero"] img').first().attr('src'),
    origin,
  )

  const heroSlides = extractHeroCarousel($, origin, name)
  const testimonials = extractTestimonials($)

  return {
    name,
    slug,
    logo: logo || undefined,
    phone: phone || undefined,
    email: email || undefined,
    address: addressInfo.address || undefined,
    city: addressInfo.city || undefined,
    state: addressInfo.state || undefined,
    zip: addressInfo.zip || undefined,
    heroImage: heroImage || undefined,
    heroSlides: heroSlides.length > 0 ? heroSlides : undefined,
    testimonials: testimonials.length > 0 ? testimonials : undefined,
    sourceUrl,
  }
}

/**
 * Extract hero carousel slides from DealerSpike homepage.
 * Slides use background-image on .item divs inside .carousel-slideshow.
 * Filters out slides whose title is just the generic dealer description.
 */
function extractHeroCarousel(
  $: cheerio.CheerioAPI,
  origin: string,
  dealerName: string,
): HeroSlide[] {
  const slides: HeroSlide[] = []

  $('.carousel-slideshow .carousel-inner .item').each((_, el) => {
    const style = $(el).attr('style') || ''
    const bgMatch = style.match(/background-image:\s*url\(([^)]+)\)/i)
    if (!bgMatch) return

    const imageUrl = resolveUrl(decodeURIComponent(bgMatch[1].replace(/['"]/g, '')), origin)
    if (!imageUrl) return

    const anchor = $(el).find('a.ds-slide')
    const rawTitle = (anchor.attr('title') || '').trim()
    const href = anchor.attr('href') || undefined
    const ctaLink = href ? resolveUrl(href, origin) || undefined : undefined

    // Skip slides whose title is just the generic dealer description (contains dealer name + long boilerplate)
    const isGeneric = rawTitle.length > 120 && rawTitle.toLowerCase().includes(dealerName.toLowerCase())
    const title = isGeneric ? '' : rawTitle

    slides.push({
      image: imageUrl,
      title: title || dealerName,
      subtitle: '',
      ctaLink,
    })
  })

  return slides
}

/**
 * Extract testimonials from DealerSpike homepage testimonial slider.
 */
function extractTestimonials($: cheerio.CheerioAPI): ScrapedTestimonial[] {
  const testimonials: ScrapedTestimonial[] = []

  $('#testimonialSlider .slider__item').each((_, el) => {
    const text = $(el).find('.testimonial-text').text().trim()
    const name = $(el).find('.testimonial-name').text().trim()
    if (!text || !name) return

    testimonials.push({
      reviewerName: name,
      text,
      source: 'DealerSpike',
    })
  })

  return testimonials
}

/** Find the actual dealer logo, skipping platform/template logos. */
function findDealerLogo($: cheerio.CheerioAPI, origin: string): string | undefined {
  const candidates = $(
    'header .logo img, .site-logo img, [class*="logo"] img, .navbar-brand img, header img[src*="logo"]',
  )

  for (let i = 0; i < candidates.length; i++) {
    const src = resolveUrl($(candidates[i]).attr('src'), origin)
    if (!src) continue
    // Skip generic DealerSpike/platform template logos
    if (/dealerspike\.com\/imglib\/template/i.test(src)) continue
    if (/powered.?by|template\/v\d/i.test(src)) continue
    return src
  }

  return undefined
}

function findPhone($: cheerio.CheerioAPI): string | null {
  const areas = $('header, footer, .contact, [class*="phone"]')
  const text = areas.text()
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  return phoneMatch ? phoneMatch[0] : null
}

/**
 * Pull the business name out of JSON-LD structured data. Strips a trailing
 * location suffix like " in Le Claire, IA" that some sites append for SEO.
 */
function extractLdJsonName($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || '{}')
      const candidates = Array.isArray(data) ? data : [data]
      for (const entry of candidates) {
        const rawName = typeof entry?.name === 'string' ? entry.name.trim() : ''
        if (!rawName) continue
        // Drop " in <City>, <ST>" suffix the site may have tacked on
        return rawName.replace(/\s+in\s+[A-Z][\w\s-]+,\s*[A-Z]{2}\b.*$/, '').trim()
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null
}

function extractAddress($: cheerio.CheerioAPI): {
  address?: string
  city?: string
  state?: string
  zip?: string
} {
  const ldJson = $('script[type="application/ld+json"]')
  for (let i = 0; i < ldJson.length; i++) {
    try {
      const data = JSON.parse($(ldJson[i]).html() || '{}')
      const addr = data.address || data?.location?.address
      if (addr) {
        return {
          address: addr.streetAddress,
          city: addr.addressLocality,
          state: addr.addressRegion,
          zip: addr.postalCode,
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  const addressEl = $('address, .address, [class*="address"], [itemprop="address"]').first()
  if (addressEl.length) {
    const text = addressEl.text().trim().replace(/\s+/g, ' ')
    return { address: text }
  }

  return {}
}

function resolveUrl(url: string | undefined | null, origin: string): string | null {
  if (!url) return null
  try {
    return new URL(url, origin).href
  } catch {
    return null
  }
}

/**
 * Build CDN URL for DealerSpike inventory images.
 * Pattern: cdn.dealerspike.com/imglib/v1/{size}/imglib/Assets/Inventory/{first2}/{next2}/{guid}.ext
 */
function dealerSpikeImageUrl(filename: string, size = '1024x768'): string {
  const guid = filename.replace(/\.[^.]+$/, '')
  const first2 = guid.substring(0, 2)
  const next2 = guid.substring(2, 4)
  return `https://cdn.dealerspike.com/imglib/v1/${size}/imglib/Assets/Inventory/${first2}/${next2}/${filename}`
}

interface DSVehicle {
  id: string
  stockno: string
  manuf: string
  model: string
  bike_year: string
  price: string
  retail_price: string
  sale_price: string
  MSRP: string
  color: string
  vin: string
  type: string // N = new, U = used
  vehtypename: string
  catname: string
  notes: string
  status: string
  miles: string
  engine: string
  displacement: string
  hp: string
  length: string
  beam: string
  loa: string
  hullmaterial: string
  propulsion: string
  transmission: string
  enginehours: string
  fuel_capacity: string
  stock_image: string
  bike_image: string
  image2: string
  vehtitle: string
  unitvertical: string
  HasImages: string
}

/**
 * Extract vehicles from DealerSpike v6's inline `window.Vehicles` JS array.
 * Returns RawListing[] directly — no need to visit individual detail pages.
 */
async function extractInlineVehicles(origin: string): Promise<RawListing[]> {
  const vehicles = await evaluateInPage(() => {
    const v = (window as any).Vehicles
    if (!v || !Array.isArray(v)) return null
    return v as DSVehicle[]
  })

  if (!vehicles || vehicles.length === 0) return []

  return vehicles.map((v) => {
    const year = v.bike_year || ''
    const make = (v.manuf || '').replace(/[®™©]/g, '').trim()
    const model = v.model || ''
    const title = v.vehtitle || [year, make, model].filter(Boolean).join(' ')

    const price = v.price || v.sale_price || v.retail_price || v.MSRP || ''
    const priceStr = price ? `$${Number(price).toLocaleString()}` : undefined

    const photos: string[] = []
    if (v.bike_image) {
      photos.push(dealerSpikeImageUrl(v.bike_image))
    }
    if (v.image2) {
      photos.push(dealerSpikeImageUrl(v.image2))
    }
    if (photos.length === 0 && v.stock_image) {
      photos.push(v.stock_image.startsWith('http') ? v.stock_image : `${origin}${v.stock_image}`)
    }

    const specs: Record<string, string> = {}
    if (year) specs['Year'] = year
    if (make) specs['Make'] = make
    if (model) specs['Model'] = model
    if (v.color) specs['Color'] = v.color
    if (v.vin) specs['VIN'] = v.vin
    if (v.stockno) specs['Stock Number'] = v.stockno
    if (v.vehtypename) specs['Type'] = v.vehtypename
    if (v.catname) specs['Category'] = v.catname
    if (v.type) specs['Condition'] = v.type === 'N' ? 'New' : v.type === 'U' ? 'Used' : v.type
    if (v.miles && v.miles !== '0') specs['Miles'] = v.miles
    if (v.engine) specs['Engine'] = v.engine
    if (v.displacement) specs['Displacement'] = v.displacement
    if (v.hp) specs['Horsepower'] = v.hp
    if (v.transmission) specs['Transmission'] = v.transmission
    if (v.enginehours && v.enginehours !== '0') specs['Engine Hours'] = v.enginehours
    if (v.fuel_capacity) specs['Fuel Capacity'] = v.fuel_capacity
    if (v.length) specs['Length'] = v.length
    if (v.beam) specs['Beam'] = v.beam
    if (v.hullmaterial) specs['Hull Material'] = v.hullmaterial
    if (v.propulsion) specs['Propulsion'] = v.propulsion
    if (v.status) specs['Status'] = v.status
    if (v.MSRP && v.MSRP !== '0') specs['MSRP'] = `$${Number(v.MSRP).toLocaleString()}`

    const detailUrl = `${origin}/default.asp?page=xInventoryDetail&id=${v.id}&s=&fr=xAllInventory`

    return {
      url: detailUrl,
      title,
      price: priceStr,
      photos,
      specs,
      description: v.notes || undefined,
      rawHtml: '',
    } satisfies RawListing
  })
}

/**
 * Crawl a single inventory page, handling pagination, and collect detail URLs.
 */
async function crawlInventoryPage(
  startUrl: string,
  origin: string,
  detailUrls: Set<string>,
  strategy: ScrapeStrategy,
  log: (msg: string) => void,
  globalVisited: Set<string>,
): Promise<void> {
  const queue = [startUrl]
  const maxPages = 50
  let pagesVisited = 0

  while (queue.length > 0 && pagesVisited < maxPages) {
    const currentUrl = queue.shift()!
    if (globalVisited.has(currentUrl)) continue
    globalVisited.add(currentUrl)
    pagesVisited++

    let html: string
    try {
      html = await fetchPage(currentUrl)
    } catch {
      continue
    }

    const $ = cheerio.load(html)

    // Look for a "View All" link on the first page
    if (pagesVisited === 1) {
      const viewAllLink = strategy.findViewAllLink($, origin)
      if (viewAllLink && !globalVisited.has(viewAllLink)) {
        log(`Found "View All" link: ${viewAllLink}`)
        queue.unshift(viewAllLink)
        continue
      }
    }

    // Extract detail page links
    const sizeBefore = detailUrls.size
    const detailLinks = strategy.extractDetailLinks($, origin, currentUrl)
    for (const link of detailLinks) {
      detailUrls.add(link)
    }
    const newCount = detailUrls.size - sizeBefore

    log(`  Page yielded ${detailLinks.length} listing links (${newCount} new, total: ${detailUrls.size})`)

    // Stop paginating if this page added no new items (we've hit the end)
    if (newCount === 0 && pagesVisited > 1) {
      continue
    }

    // Find pagination "next" links
    const nextUrl = strategy.findNextPageLink($, origin, currentUrl)
    if (nextUrl && !globalVisited.has(nextUrl)) {
      queue.push(nextUrl)
    }
  }
}
