import { Command } from 'commander'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { crawl } from './crawl.js'
import { enrich, enrichDealerHero } from './enrich.js'
import type { EnrichedData } from './types.js'

const program = new Command()

program
  .name('scrape')
  .description('Scrape dealer inventory from a website and enrich with AI')
  .requiredOption('--url <url>', 'Dealer website URL to scrape')
  .option('--output <path>', 'Output JSON file path', './output/dealer.json')
  .option('--skip-enrich', 'Skip AI enrichment (output raw scraped data)', false)
  .option('--max-listings <n>', 'Maximum number of listings to scrape', parseInt)
  .action(async (opts) => {
    const startTime = Date.now()
    const { url, output, skipEnrich, maxListings } = opts as {
      url: string
      output: string
      skipEnrich: boolean
      maxListings?: number
    }

    console.log(`\n  RoostDealer Scraper`)
    console.log(`  ${'='.repeat(40)}`)
    console.log(`  Target: ${url}`)
    console.log(`  Output: ${output}`)
    console.log()

    try {
      // Step 1: Crawl the site
      console.log('[1/3] Crawling website...')
      const scraped = await crawl(url, (msg) => console.log(`  ${msg}`))

      console.log()
      console.log(`  Dealer: ${scraped.dealer.name}`)
      console.log(`  Listings found: ${scraped.listings.length}`)

      let listings = scraped.listings
      if (maxListings && listings.length > maxListings) {
        console.log(`  Limiting to ${maxListings} listings`)
        listings = listings.slice(0, maxListings)
      }

      if (listings.length === 0) {
        console.log('\n  No listings found. The site structure may not be supported yet.')
        console.log('  Try providing a direct inventory page URL with --url')
        process.exit(1)
      }

      // Step 2: Enrich with AI (or skip)
      let result: EnrichedData

      if (skipEnrich) {
        console.log('\n[2/3] Skipping AI enrichment (--skip-enrich)')
        // Map raw listings to basic units without AI
        result = {
          dealer: scraped.dealer,
          units: listings.map((l, i) => ({
            id: `raw-${i}`,
            year: null,
            make: 'Unknown',
            model: l.title,
            type: 'other' as const,
            condition: 'new' as const,
            price: l.price ? parseFloat(l.price.replace(/[^0-9.]/g, '')) || null : null,
            specs: l.specs,
            originalDescription: l.description,
            aiDescription: l.description || l.title,
            photos: l.photos,
            url: l.url,
          })),
        }
      } else {
        console.log('\n[2/3] Enriching with AI...')
        const units = await enrich(listings, (msg) => console.log(`  ${msg}`))

        // Generate AI hero content based on the enriched inventory
        try {
          const hero = await enrichDealerHero(scraped.dealer, units, (msg) => console.log(`  ${msg}`))
          if (hero.heroTitle) scraped.dealer.heroTitle = hero.heroTitle
          if (hero.heroSubtitle) scraped.dealer.heroSubtitle = hero.heroSubtitle
        } catch (err) {
          console.log(`  Warning: Hero generation failed: ${err instanceof Error ? err.message : String(err)}`)
        }

        result = {
          dealer: scraped.dealer,
          units,
        }
      }

      // Step 3: Write output
      console.log('\n[3/3] Writing output...')
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, JSON.stringify(result, null, 2), 'utf-8')

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log()
      console.log(`  Done! ${result.units.length} units written to ${output}`)
      console.log(`  Time: ${elapsed}s`)
      console.log()
    } catch (err) {
      console.error(`\n  Error: ${err instanceof Error ? err.message : String(err)}`)
      if (err instanceof Error && err.stack) {
        console.error(`\n  ${err.stack}`)
      }
      process.exit(1)
    }
  })

program.parse()
