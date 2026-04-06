import type * as cheerio from 'cheerio'
import type { ScrapeStrategy } from './types.js'

/**
 * Classic DealerSpike sites.
 * - Inventory: /default.asp?page=xAllInventory
 * - Detail: /--xInventoryDetail?id=... or /Brand/Year-Make-Model/12345
 */
export const classicStrategy: ScrapeStrategy = {
  version: 'classic',

  discoverInventoryPages($, origin) {
    const found = new Set<string>()

    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href')
      const text = $(el).text().toLowerCase().trim()
      if (!href) return

      const isInventoryLink =
        /inventory|units|showroom|boats|motorcycles|atvs?|utvs?|watercraft|pwc|snowmobile/i.test(href) ||
        /inventory|all units|our .*(boats|motorcycles|inventory)|view (all|inventory)|shop now|browse/i.test(text)

      if (isInventoryLink) {
        try {
          const resolved = new URL(href, origin).href
          if (resolved.startsWith(origin)) {
            found.add(resolved)
          }
        } catch {
          // Skip invalid URLs
        }
      }
    })

    // Filter out subset pages (make=, vt=, category=, etc.)
    const prioritized = [...found].filter((u) => {
      const url = new URL(u)
      return !(
        url.searchParams.has('make') ||
        url.searchParams.has('vt') ||
        url.searchParams.has('vc') ||
        url.searchParams.has('ac') ||
        url.searchParams.has('subcategory') ||
        url.searchParams.has('category')
      )
    })

    const urls = prioritized.length > 0 ? prioritized : [...found]

    // If we have an xAllInventory page, prefer it and skip xNew/xPreOwned (they're subsets)
    const allInv = urls.find((u) => /xAllInventory/i.test(u))
    if (allInv) {
      // Strip any leftover filter params to get the clean "all inventory" page
      const clean = new URL(allInv)
      for (const key of ['category', 'make', 'vt', 'vc', 'ac', 'subcategory']) {
        clean.searchParams.delete(key)
      }
      return [clean.href]
    }

    // If no xAllInventory found but we have category-filtered URLs, construct clean xAllInventory
    const categoryFiltered = [...found].find((u) => /xAllInventory/i.test(u))
    if (categoryFiltered) {
      const clean = new URL(categoryFiltered)
      for (const key of ['category', 'make', 'vt', 'vc', 'ac', 'subcategory']) {
        clean.searchParams.delete(key)
      }
      return [clean.href]
    }

    return urls.slice(0, 5)
  },

  extractDetailLinks($, origin, currentUrl) {
    const links = new Set<string>()
    const currentPath = new URL(currentUrl).pathname

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

      const path = resolved.pathname
      const fullUrl = resolved.href

      if (path === currentPath && !resolved.search.includes('id=')) return

      // ?id= parameter on inventory-like pages
      if (resolved.search.includes('id=') && /inventory/i.test(path)) {
        links.add(fullUrl)
        return
      }

      // Numeric slug at end: /Brand/2024-Make-Model/12345
      if (/\/\d{4,8}\/?$/.test(path) || /\/\d{4,8}\?/.test(fullUrl)) {
        links.add(fullUrl)
        return
      }

      // xInventoryDetail pages
      if (/xInventoryDetail/i.test(path) || /xInventoryDetail/i.test(resolved.search)) {
        links.add(fullUrl)
        return
      }

      // Product card links
      const parent = $(el).closest(
        '.item, .unit, .listing, .product, [class*="inventory-item"], [class*="product-card"], [class*="listing-item"], .grid-item, .card',
      )
      if (parent.length > 0) {
        links.add(fullUrl)
        return
      }

      // Generic detail-like path
      if (/\/(inventory|unit|product|listing|item)\/.+\/.+/i.test(path)) {
        links.add(fullUrl)
        return
      }
    })

    return [...links]
  },

  findNextPageLink($, origin, currentUrl) {
    // Explicit "next" links
    const nextSelectors = [
      'a.next', 'a[rel="next"]', '.pagination a.next', '.pagination .next a',
      '.pager .next a', 'a[aria-label="Next"]', 'a[title="Next"]',
      'li.next a', '.page-next a',
    ]

    for (const sel of nextSelectors) {
      const href = $(sel).first().attr('href')
      if (href) {
        try { return new URL(href, origin).href } catch { /* skip */ }
      }
    }

    // Next by text content
    const nextByText = $('a[href]').filter((_i, el) => {
      const text = $(el).text().trim()
      return /^(next|>|>>|›|»|\u203A|\u00BB)$/i.test(text)
    })
    if (nextByText.length > 0) {
      const href = $(nextByText[0]).attr('href')
      if (href) {
        try { return new URL(href, origin).href } catch { /* skip */ }
      }
    }

    // Increment numeric page param
    const currentUrlObj = new URL(currentUrl)
    for (const paramName of ['pg', 'p', 'page']) {
      const val = currentUrlObj.searchParams.get(paramName)
      if (val) {
        const num = parseInt(val, 10)
        if (!isNaN(num)) {
          const nextUrlObj = new URL(currentUrl)
          nextUrlObj.searchParams.set(paramName, String(num + 1))
          return nextUrlObj.href
        }
        // Non-numeric 'page' param (e.g. page=xAllInventory) — skip it
      }
    }

    // DealerSpike: default.asp uses pg= for pagination
    if (/default\.asp/i.test(currentUrl) && !currentUrlObj.searchParams.has('pg')) {
      const nextUrlObj = new URL(currentUrl)
      nextUrlObj.searchParams.set('pg', '2')
      return nextUrlObj.href
    }

    return null
  },

  findViewAllLink($, origin) {
    const candidates = $('a[href]').filter((_i, el) => {
      const text = $(el).text().toLowerCase().trim()
      const href = $(el).attr('href') || ''
      return (
        /view\s*all|show\s*all|see\s*all|all\s*inventory/i.test(text) ||
        /view[-_]?all|show[-_]?all|pagesize=\d{3,}|per_page=\d{3,}|limit=\d{3,}/i.test(href)
      )
    })

    if (candidates.length > 0) {
      const href = $(candidates[0]).attr('href')
      if (href) {
        try { return new URL(href, origin).href } catch { return null }
      }
    }
    return null
  },
}
