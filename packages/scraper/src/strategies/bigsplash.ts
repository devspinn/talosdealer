import type * as cheerio from 'cheerio'
import type { ScrapeStrategy } from './types.js'

/**
 * Big Splash Interactive — a marine-focused dealer CMS.
 * Example: gracemarine.com
 *
 * URL patterns:
 * - Listing: /all-inventory-c-{catId}.html, /new-inventory-c-{catId}.html, /pre-owned-inventory-c-{catId}.html
 * - Pagination: /inventory-c-{catId}.html?cPath={catId}&page={N} (12 items per page)
 * - Detail:    /inventory-c-{catId}.html?invid={numericId}
 *
 * Detection signal: footer references `bigsplashinteractive.com`, or inventory links
 * match the `-c-\d+\.html` filename pattern with `?invid=` detail URLs.
 */

/** Matches detail pages: ...?invid=N */
const BIGSPLASH_DETAIL_RE = /[?&]invid=\d+/i

/** Matches listing filenames: foo-c-230.html */
const BIGSPLASH_LISTING_RE = /-c-\d+\.html$/i

export const bigsplashStrategy: ScrapeStrategy = {
  version: 'bigsplash',

  discoverInventoryPages($, origin) {
    const all = new Set<string>()
    const preferred = new Set<string>()

    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href')
      const text = $(el).text().toLowerCase().trim()
      if (!href) return

      let resolved: URL
      try {
        resolved = new URL(href, origin)
      } catch {
        return
      }
      if (resolved.origin !== origin) return

      const path = resolved.pathname
      if (!BIGSPLASH_LISTING_RE.test(path)) return

      // Skip detail pages (they share the -c-N.html filename but carry ?invid=)
      if (BIGSPLASH_DETAIL_RE.test(resolved.search)) return

      all.add(resolved.href)

      // Prefer "all inventory" links over new/pre-owned subsets
      if (/all[-\s]?inventory/i.test(text) || /all-inventory/i.test(path)) {
        // Strip condition filters to get the truly unfiltered listing
        const clean = new URL(resolved.href)
        clean.searchParams.delete('condition[]')
        clean.searchParams.delete('condition%5B%5D')
        preferred.add(clean.href)
      }
    })

    if (preferred.size > 0) return [...preferred]

    // No explicit "All Inventory" link — fall back to any listing page, stripping
    // condition filters so pagination walks the full catalog.
    const fallback = [...all].map((u) => {
      const clean = new URL(u)
      clean.searchParams.delete('condition[]')
      clean.searchParams.delete('condition%5B%5D')
      return clean.href
    })
    // Dedupe after cleaning
    return [...new Set(fallback)].slice(0, 3)
  },

  extractDetailLinks($, origin, _currentUrl) {
    const links = new Set<string>()

    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href')
      if (!href) return

      let resolved: URL
      try {
        resolved = new URL(href, origin)
      } catch {
        return
      }

      if (resolved.origin !== origin) return
      if (BIGSPLASH_DETAIL_RE.test(resolved.search)) {
        links.add(resolved.href)
      }
    })

    return [...links]
  },

  findNextPageLink($, origin, currentUrl) {
    // Walk pagination numerically: the "Next" link wraps to page 1 on the last page,
    // which would loop forever. Instead, find the max page number in the paginator
    // and advance by one until we exceed it.
    const currentUrlObj = new URL(currentUrl)
    const currentPage = parseInt(currentUrlObj.searchParams.get('page') || '1', 10)

    let maxPage = 1
    $('.pagination a.page-link[href]').each((_i, el) => {
      const href = $(el).attr('href') || ''
      const m = href.match(/[?&]page=(\d+)/)
      if (m) {
        const n = parseInt(m[1]!, 10)
        if (n > maxPage) maxPage = n
      }
    })

    if (currentPage >= maxPage) return null

    const next = new URL(currentUrl, origin)
    next.searchParams.set('page', String(currentPage + 1))
    // Ensure cPath is set for pagination routes (the listing filename alone works too,
    // but the site's own pagination links include it).
    if (!next.searchParams.has('cPath')) {
      const catMatch = next.pathname.match(/-c-(\d+)\.html$/)
      if (catMatch) next.searchParams.set('cPath', catMatch[1]!)
    }
    return next.href
  },

  findViewAllLink(_$, _origin) {
    // Big Splash paginates at a fixed 12/page with no "view all" option.
    return null
  },
}

/**
 * Parse the pipe-delimited meta strip Big Splash renders above the title, e.g.
 *   "Pre-Owned In Stock | Category: Bowrider | Brand: Four Winns | Stock Number: PFWFE044 | VIN: PFWFE044E223"
 * Returns a specs-shaped object ready to merge into RawListing.specs.
 */
export function parseBigsplashMetaStrip(raw: string): {
  condition?: string
  category?: string
  brand?: string
  stockNumber?: string
  vin?: string
} {
  const out: {
    condition?: string
    category?: string
    brand?: string
    stockNumber?: string
    vin?: string
  } = {}

  const parts = raw.split('|').map((p) => p.trim())
  for (const part of parts) {
    // First chunk is the condition/status line: "Pre-Owned In Stock", "New In Stock",
    // "New On Order", or just bare "New" / "Pre-Owned". Detect by the absence of a
    // "Key: value" separator.
    if (!/:/.test(part)) {
      if (/pre[-\s]?owned/i.test(part)) out.condition = 'Pre-Owned'
      else if (/^new\b/i.test(part)) out.condition = 'New'
      else if (/used/i.test(part)) out.condition = 'Used'
      continue
    }

    const [keyRaw, ...rest] = part.split(':')
    if (!keyRaw || rest.length === 0) continue
    const key = keyRaw.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (!value) continue

    if (key === 'category') out.category = value
    else if (key === 'brand' || key === 'make') out.brand = value
    else if (key === 'stock number' || key === 'stock no' || key === 'stock') out.stockNumber = value
    else if (key === 'vin') out.vin = value
  }

  return out
}

/**
 * Parse a Big Splash detail title like "2023 Four Winns HD5 OB" into year/make/model.
 * The brand from the meta strip is authoritative when available — this parser is a
 * fallback for when it's missing.
 */
export function parseBigsplashTitle(
  title: string,
  brandHint?: string,
): { year?: string; make?: string; model?: string } {
  const trimmed = title.trim()
  const yearMatch = trimmed.match(/^(\d{4})\s+(.+)$/)
  const year = yearMatch ? yearMatch[1] : undefined
  const afterYear = yearMatch ? yearMatch[2]! : trimmed

  if (brandHint && afterYear.toLowerCase().startsWith(brandHint.toLowerCase())) {
    const model = afterYear.slice(brandHint.length).trim()
    return { year, make: brandHint, model: model || undefined }
  }

  // No brand hint — guess that the first word is the make
  const parts = afterYear.split(/\s+/)
  if (parts.length === 0) return { year }
  const make = parts[0]
  const model = parts.slice(1).join(' ')
  return { year, make, model: model || undefined }
}
