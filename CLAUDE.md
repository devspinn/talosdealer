# CLAUDE.md

## What is this

RoostDealer is a startup building an AI-native dealer website platform for powersports/marine/outdoor equipment dealerships. We're replacing DealerSpike (the incumbent legacy CMS).

The repo is a pnpm monorepo with two packages:
- `packages/scraper` — CLI that crawls a dealer website, extracts inventory, and uses Claude to generate structured data + descriptions
- `packages/web` — React + Vite demo site that renders inventory beautifully

## Tech decisions

- **No Next.js** — user had bad experiences with the caching/server component "magic." Use React + Vite instead.
- **No Vercel** — too expensive, not enough control. Deploy on Railway or Fly.io.
- **No Supabase** — RLS was annoying. Use Neon (Postgres) + Drizzle ORM + BetterAuth instead (Phase B).
- **AI via AWS Bedrock**, not direct Anthropic API. Auth uses `AWS_BEARER_TOKEN_BEDROCK` as a session token with `@aws-sdk/client-bedrock-runtime`. Model comes from `ANTHROPIC_SMALL_FAST_MODEL` env var.

## DealerSpike scraping notes

DealerSpike has (at least) two site generations. The scraper auto-detects which version a site uses and applies the right strategy (`packages/scraper/src/strategies/`).

### Classic DealerSpike
- Inventory pages: `/default.asp?page=xAllInventory`, `xNewInventory`, `xPreOwnedInventory`
- Detail pages: `/--xInventoryDetail?year=...&make=...&model=...&oid=...`
- URL params contain structured data (year, make, model, condition, VIN, stock number)
- `window.utag_data` JS object on detail pages has `product_year`, `product_make`, `product_model`, `product_price`
- Pagination: `pg=N` param (NOT `page=` — that's a page type selector like `page=xAllInventory`)
- xNewInventory and xPreOwnedInventory are subsets of xAllInventory — only crawl xAllInventory
- Pages beyond the last valid page silently return the last page (no 404) — stop when no new items found
- Example site: sarasotapowersports.com (415 units)

### ARI / Endeavor Suite (newer)
- Inventory listing: `/search/inventory/...` with filter segments in the path
- Detail pages: `/inventory/{year}-{brand}-{model}-{city}-{state}-{zip}-{numericId}i`
- The trailing `{digits}i` pattern is the key identifier for detail URLs
- Photos often served from `published-assets.ari-build.com`
- Structured data must be parsed from the URL slug (no query params)
- Multi-word brands are common (e.g. "Alk2 Powerboats", "Sea Born", "Magic Tilt")
- Example site: portsideorlando.com (113 units)

### Gotchas
- `--skip-enrich` produces `year: null, make: 'Unknown'` — the enrichment-free path doesn't parse URL params. Use the transform script (`packages/scraper/transform-demo.mjs`) to structure raw data for the demo.
- Photos: Classic sites often only return 1 photo per unit on listing pages; detail pages have full galleries. ARI sites tend to return ~3 thumbnails.
- DealerSpike CDN images: `cdn.dealerspike.com/imglib/v1/800x600/...`
- **Scrape output path**: `pnpm scrape` runs from `packages/scraper/`, so `--output` is relative to that dir. Use `--output output/name-raw.json` (not `packages/scraper/output/...` — that nests incorrectly).
- **Logo extraction**: DealerSpike injects a generic "Powered by DealerSpike" logo at `cdn.dealerspike.com/imglib/template/...` that matches `[class*="logo"] img`. The scraper filters these out and picks the next match (the actual dealer logo). If a new template logo pattern appears, update `findDealerLogo()` in `crawl.ts`.
- **Classic inventory discovery**: Some sites link to category-filtered inventory (e.g. `xAllInventory?category=atv`). The scraper strips `category=` and other filter params to get the full unfiltered inventory. If a site is missing categories, check `discoverInventoryPages()` in `strategies/classic.ts`.

## Key commands

```bash
pnpm dev                    # Run demo site at localhost:5173
pnpm build                  # Build web for production
pnpm scrape --url <URL>     # Full scrape + AI enrichment
pnpm scrape --url <URL> --skip-enrich --max-listings 5  # Test crawling only
```

## Demo site data

The demo runs multiple dealers via slug-based routing (`/:slug/*`). Demo data lives in `packages/web/src/data/`:

| Dealer | Slug | Type | Units | Source |
|---|---|---|---|---|
| Mountain Marine | `mountain-marine` | Fake (loremflickr images) | mixed marine | `sample.json` |
| Sarasota Powersports | `sarasota-powersports` | Real (classic DealerSpike) | 50 powersports | `sarasota-powersports.json` |
| Portside Marine | `portside-marine` | Real (ARI DealerSpike) | 20 boats/trailers | `portside-marine.json` |
| Toms River Marine | `toms-river-marine` | Real (classic DealerSpike) | 152 mixed marine+powersports | `toms-river-marine.json` |

Registered in `packages/web/src/data/dealers.ts`. To add a new dealer:
1. Scrape: `pnpm scrape --url <URL> --skip-enrich --output output/name-raw.json`
2. Transform: add to `packages/scraper/transform-demo.mjs` and run `node transform-demo.mjs` (from `packages/scraper/`)
3. Register: import the JSON in `dealers.ts` and add to the `dealers` record

The `DealerBasePathProvider` + `useDealerPath()` hook in `DealerContext.tsx` handles slug-prefixed routing across all components.

### Hero content system
The homepage hero (`pages/Home.tsx`) has two layers:
- **AI-generated**: `dealer.heroTitle` and `dealer.heroSubtitle` fields — used when present. Generated by `enrichDealerHero()` in `enrich.ts` during full enrichment, or set manually in `transform-demo.mjs` for demo data.
- **Vibe-based fallback**: `getDealerVibe()` classifies dealers as marine/powersports/mixed based on inventory type ratios, then picks from hardcoded `vibeContent` templates. Produces generic copy like "Your Any Terrain Starts Here."

Always prefer setting `heroTitle`/`heroSubtitle` for demo dealers — the vibe fallback is a safety net, not the goal.

### Environment notes
- No `python` in `.tool-versions` — use Node.js for any scripting/data inspection.
- The scraper transform runs from `packages/scraper/` (`cd packages/scraper && node transform-demo.mjs`).

## Architecture for Phase B (not built yet)

When we add the backend it will be:
- **Hono** for the API server
- **Neon** (Postgres) for the database
- **Drizzle** ORM for type-safe queries
- **BetterAuth** for authentication (supports orgs/multi-tenant)
- Multi-tenant via wildcard subdomains: `{slug}.roostdealer.com`

## Competitive context

- **DealerSpike** — direct target. Legacy CMS, 24hr batch sync, no AI.
- **LightSpeed DMS** — future integration partner (4,500+ dealers). Has partner program with API access to inventory/customer/sales data. Jay should apply once we have traction.
- **Kenect** — NOT a competitor. Communication layer (texting, AI voice, reviews). Potential integration partner.
- **ARI Network Services** — OEM data licensing source for specs/photos (Phase D).

Jay Dorfman is the sales co-founder. He's Account Director at Boats Group (owns Boat Trader, YachtWorld). Boating Industry 40 Under 40. His network is the go-to-market.
