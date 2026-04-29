import type * as cheerio from 'cheerio'
import type { SiteVersion } from './types.js'

/**
 * Detect which site platform/version is running.
 *
 * Classic DealerSpike: /default.asp pages, --xInventoryDetail URLs, utag_data
 * ARI/Endeavor: /search/inventory/ or /inventory/{slug}-{id}i URLs
 * WooCommerce: wp-content paths, .woocommerce body class, /product/ URLs
 */
export function detectSiteVersion(
  $: cheerio.CheerioAPI,
  html: string,
  baseUrl: string,
): SiteVersion {
  // Strong classic signals
  const hasDefaultAsp = /default\.asp/i.test(baseUrl) || /default\.asp/i.test(html)
  const hasXInventory = $('a[href]').toArray().some((el) =>
    /xInventoryDetail|xAllInventory|xNewInventory|xPreOwned/i.test($(el).attr('href') || ''),
  )
  const hasUtagData = /window\.utag_data/.test(html)

  // Strong ARI signals
  const hasAriInventoryLinks = $('a[href]').toArray().some((el) => {
    const h = $(el).attr('href') || ''
    return /\/inventory\/.*-\d+i\b/.test(h) || /\/search\/inventory/i.test(h)
  })
  const hasAriDetailPattern = /\/inventory\/\d{4}-[\w-]+-\d+i/.test(html)

  // WooCommerce/WordPress signals
  const hasWpContent = /wp-content|wp-includes/i.test(html)
  const hasWooBodyClass = $('body.woocommerce-page, body.woocommerce').length > 0 ||
    ($('body').attr('class') || '').includes('woocommerce')
  const hasWcBlocks = $('script[src*="wc-blocks"], script[src*="woocommerce"], link[href*="woocommerce"]').length > 0
  const hasProductUrls = $('a[href*="/product/"]').length > 0

  // Big Splash Interactive signals
  const hasBigSplashFooter = /bigsplashinteractive\.com/i.test(html)
  const hasBigSplashDetailLinks = $('a[href*="invid="][href*="-c-"]').length > 0
  const hasBigSplashListingLinks = $('a[href]').toArray().some((el) => {
    const h = $(el).attr('href') || ''
    return /-c-\d+\.html(\?|$)/i.test(h) && !/invid=/i.test(h)
  })

  // Score them
  let classicScore = 0
  let ariScore = 0
  let wooScore = 0
  let bigsplashScore = 0

  if (hasDefaultAsp) classicScore += 3
  if (hasXInventory) classicScore += 3
  if (hasUtagData) classicScore += 2

  if (hasAriInventoryLinks) ariScore += 3
  if (hasAriDetailPattern) ariScore += 3

  // Check for ARI-style search/inventory path structure in nav
  const hasSearchInventory = $('a[href*="/search/inventory"]').length > 0
  if (hasSearchInventory) ariScore += 2

  // Check for ARI's typical class names
  if ($('[class*="dspn-"]').length > 0) ariScore += 1
  if ($('[class*="endeavor"]').length > 0) ariScore += 2

  if (hasWpContent) wooScore += 2
  if (hasWooBodyClass) wooScore += 3
  if (hasWcBlocks) wooScore += 2
  if (hasProductUrls) wooScore += 1

  if (hasBigSplashFooter) bigsplashScore += 4
  if (hasBigSplashDetailLinks) bigsplashScore += 3
  if (hasBigSplashListingLinks) bigsplashScore += 1

  const maxScore = Math.max(classicScore, ariScore, wooScore, bigsplashScore)
  if (maxScore === 0) return 'classic' // default fallback

  if (bigsplashScore === maxScore) return 'bigsplash'
  if (wooScore === maxScore && wooScore > classicScore && wooScore > ariScore) return 'woocommerce'
  if (ariScore > classicScore) return 'ari'
  return 'classic'
}
