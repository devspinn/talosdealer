# CLAUDE.md

## What is this

RoostDealer is a startup building an AI-native dealer website platform for powersports/marine/outdoor equipment dealerships. We're replacing DealerSpike (the incumbent legacy CMS).

The repo is a pnpm monorepo with four packages:
- `packages/scraper` — CLI that crawls a dealer website, extracts inventory, and uses Claude to generate structured data + descriptions
- `packages/web` — React + Vite demo site that renders inventory beautifully
- `packages/db` — Drizzle ORM schema, Neon client, seed script, migrations
- `packages/api` — Hono API server with BetterAuth (email/password)

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
pnpm api:dev                # Run Hono API server at localhost:3000
pnpm db:push                # Push schema changes to Neon (dev workflow)
pnpm db:generate            # Generate SQL migration from schema diff
pnpm db:migrate             # Run pending migrations
pnpm db:studio              # Open Drizzle Studio (visual DB browser)
pnpm db:seed                # Seed demo dealers + inventory into DB
```

## Demo site data

The web app fetches dealer and inventory data from the API at runtime. Demo data JSON files live in `packages/web/src/data/` and are seeded into the DB via `pnpm db:seed`. The web app no longer imports these JSON files directly.

| Dealer | Slug | Type | Units | Source |
|---|---|---|---|---|
| Mountain Marine | `mountain-marine` | Fake (loremflickr images) | mixed marine | `sample.json` |
| Sarasota Powersports | `sarasota-powersports` | Real (classic DealerSpike) | 50 powersports | `sarasota-powersports.json` |
| Portside Marine | `portside-marine` | Real (ARI DealerSpike) | 20 boats/trailers | `portside-marine.json` |
| Toms River Marine | `toms-river-marine` | Real (classic DealerSpike) | 152 mixed marine+powersports | `toms-river-marine.json` |

To add a new dealer:
1. Scrape: `pnpm scrape --url <URL> --skip-enrich --output output/name-raw.json`
2. Transform: add to `packages/scraper/transform-demo.mjs` and run `node transform-demo.mjs` (from `packages/scraper/`)
3. Place the JSON in `packages/web/src/data/`, add filename to `packages/db/src/seed.ts`, then `pnpm db:seed`

The `DealerBasePathProvider` + `useDealerPath()` hook in `DealerContext.tsx` handles slug-prefixed routing across all components.

### Hero content system
The homepage hero (`pages/Home.tsx`) has two layers:
- **AI-generated**: `dealer.heroTitle` and `dealer.heroSubtitle` fields — used when present. Generated by `enrichDealerHero()` in `enrich.ts` during full enrichment, or set manually in `transform-demo.mjs` for demo data.
- **Vibe-based fallback**: `getDealerVibe()` classifies dealers as marine/powersports/mixed based on inventory type ratios, then picks from hardcoded `vibeContent` templates. Produces generic copy like "Your Any Terrain Starts Here."

Always prefer setting `heroTitle`/`heroSubtitle` for demo dealers — the vibe fallback is a safety net, not the goal.

### Environment notes
- No `python` in `.tool-versions` — use Node.js for any scripting/data inspection.
- The scraper transform runs from `packages/scraper/` (`cd packages/scraper && node transform-demo.mjs`).

## Backend (Phase B — in progress)

- **Hono** API server (`packages/api`) at `:3000` with CORS for `:5173`
- **Neon** Postgres 17, AWS us-east-1, project name `roostdealer`
- **Drizzle** ORM — schema in `packages/db/src/schema/`, migrations in `packages/db/drizzle/`
- **BetterAuth** — email/password auth, Drizzle adapter. Tables: `user`, `session`, `account`, `verification`
- Multi-tenant via wildcard subdomains: `{slug}.roostdealer.com` (not wired yet)

### DB/API gotchas
- **Env loading**: The API uses `--env-file=../../.env` in the tsx/node command (not dotenv import) because ES module imports are hoisted — top-level `createDb()` calls in `auth.ts` run before any dotenv `config()` in `index.ts`. The db package uses `dotenv` in `drizzle.config.ts` and `seed.ts` since those are standalone scripts, not imported modules.
- **Neon Auth vs BetterAuth**: Neon offers "Neon Auth" (managed BetterAuth wrapper) but its SDK targets Next.js. We use BetterAuth directly for Hono compatibility. Same underlying tech.
- **Schema changes workflow**: Edit schema files in `packages/db/src/schema/`, then `pnpm db:push` for dev iteration or `pnpm db:generate` + `pnpm db:migrate` for tracked migrations.
- **Seed is idempotent**: Uses `onConflictDoNothing` on dealer slug, so re-running won't duplicate. But units don't have a unique constraint beyond their UUID, so re-seeding after a full wipe is the safest path.
- **Web fetches from API**: The web app fetches dealers and inventory from the Hono API at runtime via hooks in `packages/web/src/hooks/use-api.ts`. The Vite dev server proxies `/api` to `localhost:3000`. Both `pnpm dev` and `pnpm api:dev` must be running for the demo site to work.
- **Types are duplicated**: `packages/web/src/types.ts` and `packages/scraper/src/types.ts` both define `Unit`/`DealerInfo`. `packages/db/src/index.ts` exports Drizzle-inferred `Dealer`/`Unit` types. The web and scraper should eventually import from `@roostdealer/db` instead.

### API routes
- `GET /api/dealers` — list all dealers
- `GET /api/dealers/:slug` — single dealer
- `GET /api/dealers/:slug/inventory` — units (filters: `?type=`, `?condition=`, `?make=`, `?search=`)
- `GET /api/dealers/:slug/inventory/:id` — single unit
- `/api/auth/*` — BetterAuth (sign-up, sign-in, session, etc.)

### Not yet built
- BetterAuth organization plugin (dealer = org, staff = members with roles)
- Scraper writing directly to DB
- Subdomain-based tenant resolution middleware

## Competitive context

- **DealerSpike** — direct target. Legacy CMS, 24hr batch sync, no AI.
- **LightSpeed DMS** — future integration partner (4,500+ dealers). Has partner program with API access to inventory/customer/sales data. Jay should apply once we have traction.
- **Kenect** — NOT a competitor. Communication layer (texting, AI voice, reviews). Potential integration partner.
- **ARI Network Services** — OEM data licensing source for specs/photos (Phase D).

Jay Dorfman is the sales co-founder. He's Account Director at Boats Group (owns Boat Trader, YachtWorld). Boating Industry 40 Under 40. His network is the go-to-market.
