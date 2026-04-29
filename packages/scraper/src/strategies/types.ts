import type * as cheerio from 'cheerio'

/** Supported site versions. */
export type SiteVersion = 'classic' | 'ari' | 'woocommerce' | 'bigsplash'

/**
 * A version-specific scraping strategy.
 * Each DealerSpike generation implements these differently.
 */
export interface ScrapeStrategy {
  version: SiteVersion

  /** Discover inventory listing page URLs from homepage HTML. */
  discoverInventoryPages(
    $: cheerio.CheerioAPI,
    origin: string,
  ): string[]

  /** Extract detail page links from an inventory listing page. */
  extractDetailLinks(
    $: cheerio.CheerioAPI,
    origin: string,
    currentUrl: string,
  ): string[]

  /** Find the next pagination link from a listing page. */
  findNextPageLink(
    $: cheerio.CheerioAPI,
    origin: string,
    currentUrl: string,
  ): string | null

  /** Find a "View All" link on the listing page. */
  findViewAllLink(
    $: cheerio.CheerioAPI,
    origin: string,
  ): string | null
}
