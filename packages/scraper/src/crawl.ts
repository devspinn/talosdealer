import * as cheerio from 'cheerio'
import type { DealerInfo, RawListing, ScrapedData } from './types.js'
import { extractListing } from './extract.js'
import {
  detectSiteVersion,
  classicStrategy,
  ariStrategy,
  type ScrapeStrategy,
  type SiteVersion,
} from './strategies/index.js'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const RATE_LIMIT_MS = 200

/** Fetch a URL with a browser-like user-agent and rate limiting. */
async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`)
  }

  return res.text()
}

/** Sleep for a given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getStrategy(version: SiteVersion): ScrapeStrategy {
  return version === 'ari' ? ariStrategy : classicStrategy
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
  await sleep(RATE_LIMIT_MS)

  // Step 2: Detect site version
  const $ = cheerio.load(homepageHtml)
  const version = detectSiteVersion($, homepageHtml, baseUrl)
  const strategy = getStrategy(version)
  log(`Detected site version: ${version}`)

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

  // Step 5: Crawl all inventory pages and collect detail page links
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

  // Step 6: Fetch each detail page and extract listing data
  const listings: RawListing[] = []
  let i = 0

  for (const detailUrl of detailUrls) {
    i++
    log(`Extracting listing ${i}/${detailUrls.size}: ${detailUrl}`)
    try {
      await sleep(RATE_LIMIT_MS)
      const html = await fetchPage(detailUrl)
      const listing = extractListing(html, detailUrl, version)
      listings.push(listing)
    } catch (err) {
      log(`Warning: Failed to extract ${detailUrl}: ${err instanceof Error ? err.message : String(err)}`)
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
      await sleep(RATE_LIMIT_MS)
      const res = await fetch(testUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      })
      if (res.ok) {
        found.push(testUrl)
        log(`Found inventory page: ${testUrl}`)
      }
    } catch {
      // Not found, skip
    }
  }

  return found
}

/**
 * Extract dealer info from the homepage HTML.
 */
function extractDealerInfo(html: string, sourceUrl: string): DealerInfo {
  const $ = cheerio.load(html)
  const origin = new URL(sourceUrl).origin

  // Name: Try various common locations
  const titleText = $('title').text().trim()
  const titleFirst = titleText.split(/[|\-–]/)[0]?.trim()

  const name =
    $('meta[property="og:site_name"]').attr('content')?.trim() ||
    $('.dealer-name, .site-name, .company-name, [class*="dealer-name"]').first().text().trim() ||
    $('header .logo img').attr('alt')?.trim() ||
    (titleFirst && titleFirst.length < 60 ? titleFirst : null) ||
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
    sourceUrl,
  }
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

    await sleep(RATE_LIMIT_MS)
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
