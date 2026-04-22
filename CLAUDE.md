# CLAUDE.md

## What is this

Talos is a startup building an AI-native dealer website platform for powersports/marine/outdoor equipment dealerships. We're replacing DealerSpike (the incumbent legacy CMS).

The repo is a pnpm monorepo with four packages:
- `packages/scraper` — CLI that crawls a dealer website, extracts inventory, and uses Claude to generate structured data + descriptions
- `packages/web` — React + Vite frontend: marketing site (`/`), demo directory (`/demos`), and dealer sites (`/:slug/*`)
- `packages/db` — Drizzle ORM schema, Neon client, seed script, migrations
- `packages/api` — Hono API server with BetterAuth (email/password)

## Tech decisions

- **No Next.js** — user had bad experiences with the caching/server component "magic." Use React + Vite instead.
- **No Vercel** — too expensive, not enough control. Deploy on Cloudflare (Pages + Workers).
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

### Classic DealerSpike v6 (fast path)
- Detected via `data-platformversion="6"` on the `<html>` tag
- All inventory loaded client-side as `window.Vehicles` JS array (can be 500+ items)
- The scraper uses `page.evaluate()` to extract this array directly — no need to visit individual detail pages
- Each vehicle object has: `id`, `bike_year`, `manuf`, `model`, `price`, `vin`, `stockno`, `type` (N/U), `vehtypename`, `catname`, `bike_image`, `image2`, `stock_image`, etc.
- Dealer-uploaded images: `cdn.dealerspike.com/imglib/v1/{size}/imglib/Assets/Inventory/{guid[0:2]}/{guid[2:4]}/{guid}.jpg`
- Stock/catalog images: `/imglib/trimsdb/{trimsid}-{variant}.png` (served from the dealer's domain)
- Falls back to detail-page crawl if `window.Vehicles` is empty (older classic sites use server-side pagination)
- Client-side pagination shows 15 items at a time — the HTML only has visible items as `<a>` tags, so the fast path is essential for getting the full inventory
- Example v6 site: fivestarduncansville.com (583 units)

### Gotchas
- `--skip-enrich` produces `year: null, make: 'Unknown'` — the enrichment-free path doesn't parse URL params. Use the transform script (`packages/scraper/transform-demo.mjs`) to structure raw data for the demo.
- Photos: Classic sites often only return 1 photo per unit on listing pages; detail pages have full galleries. ARI sites tend to return ~3 thumbnails.
- DealerSpike CDN images: `cdn.dealerspike.com/imglib/v1/800x600/...`
- **Scrape output path**: `pnpm scrape` runs from `packages/scraper/`, so `--output` is relative to that dir. Use `--output output/name-raw.json` (not `packages/scraper/output/...` — that nests incorrectly).
- **Logo extraction**: DealerSpike injects a generic "Powered by DealerSpike" logo at `cdn.dealerspike.com/imglib/template/...` that matches `[class*="logo"] img`. The scraper filters these out and picks the next match (the actual dealer logo). If a new template logo pattern appears, update `findDealerLogo()` in `crawl.ts`.
- **Classic inventory discovery**: Some sites link to category-filtered inventory (e.g. `xAllInventory?category=atv`). The scraper strips `category=`, `make=`, `vt=`, `vc=`, `ac=`, `at=`, and `subcategory=` params to get the full unfiltered inventory. If a site is missing categories, check `discoverInventoryPages()` in `strategies/classic.ts`.

## Key commands

```bash
pnpm dev                    # Run demo site at localhost:5173
pnpm build                  # Build web for production
pnpm scrape --url <URL>     # Full scrape + AI enrichment + R2 image upload
pnpm scrape --url <URL> --skip-images  # Scrape + enrich but keep original image URLs
pnpm scrape --url <URL> --skip-enrich --max-listings 5  # Test crawling only
pnpm api:dev                # Run Hono API server at localhost:3000
pnpm db:push                # Push schema changes to Neon (dev workflow)
pnpm db:generate            # Generate SQL migration from schema diff
pnpm db:migrate             # Run pending migrations
pnpm db:studio              # Open Drizzle Studio (visual DB browser)
pnpm db:seed                # Seed demo dealers + inventory into DB
pnpm db:migrate-images      # Mirror all DB images to R2, rewrite URLs (idempotent)
pnpm ship                   # Deploy API (Workers) + web (Pages) to Cloudflare
pnpm ship:api               # Deploy only the API to Cloudflare Workers
pnpm ship:web               # Build + deploy web to Cloudflare Pages
```

## Web app routes

- `/` — Marketing landing page (`Marketing.tsx`). Static, no API calls.
- `/demos` — Demo dealer directory (`DealerDirectory.tsx`). Fetches dealer list from API.
- `/login`, `/signup` — Auth pages (BetterAuth)
- `/:slug/*` — Dealer site (Home, Inventory, UnitDetail, Contact). Fetches dealer + units from API.

## Demo site data

The web app fetches dealer and inventory data from the API at runtime. Demo data JSON files live in `packages/web/src/data/` and are seeded into the DB via `pnpm db:seed`. The web app no longer imports these JSON files directly.

| Dealer | Slug | Type | Units | Source |
|---|---|---|---|---|
| Mountain Marine | `mountain-marine` | Fake (loremflickr images) | mixed marine | `sample.json` |
| Sarasota Powersports | `sarasota-powersports` | Real (classic DealerSpike) | 50 powersports | `sarasota-powersports.json` |
| Portside Marine | `portside-marine` | Real (ARI DealerSpike) | 20 boats/trailers | `portside-marine.json` |
| Toms River Marine | `toms-river-marine` | Real (classic DealerSpike) | 152 mixed marine+powersports | `toms-river-marine.json` |
| Five Star Marine | `five-star-marine` | Real (WooCommerce) | 186 marine hydraulic parts | `five-star-marine.json` |
| Five Star Duncansville | `five-star-duncansville` | Real (classic DealerSpike v6) | 75 powersports | `five-star-duncansville.json` |

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

## Deployment

All Cloudflare, all CLI — no dashboard (except one-time DNS setup).

- **Web** (`roostdealer.com`) → Cloudflare Pages (project: `roostdealer-web`)
- **API** (`api.roostdealer.com`) → Cloudflare Workers (name: `roostdealer-api`)
- **DB** → Neon (already hosted, `@neondatabase/serverless` HTTP driver is Workers-compatible)
- **Domain** → `roostdealer.com` on Cloudflare (zone ID: `0503decb770d1c6d10ddbc207959a7a8`)

### Architecture
- `packages/api/src/app.ts` — shared Hono app factory (`createApp()`). Accepts optional `getEnv` for Node.js process.env bridge. Workers populates `c.env` from bindings automatically.
- `packages/api/src/index.ts` — Node.js dev entry (uses `@hono/node-server`)
- `packages/api/src/worker.ts` — Workers entry (`export default createApp()`)
- `packages/api/wrangler.toml` — Workers config (name, routes, secrets). Uses `[[routes]]` with `zone_name` — requires a proxied AAAA `100::` DNS record on `api.roostdealer.com`.
- `packages/web/.env.production` — production `VITE_API_URL` for Vite build-time injection. Currently points at `roostdealer-api.devonstownsend.workers.dev` until `api.roostdealer.com` DNS is configured.

### Deploy commands
```bash
wrangler login                          # One-time Cloudflare OAuth
wrangler secret put DATABASE_URL        # Set from packages/api dir
wrangler secret put BETTER_AUTH_SECRET  # Set from packages/api dir
pnpm ship                               # Deploy both API + web
pnpm ship:api                           # Deploy only Workers API
pnpm ship:web                           # Build + deploy Pages
```

### Deployment gotchas
- **`pnpm deploy` is reserved** — pnpm intercepts `deploy` as a built-in command. Use `pnpm ship` / `ship:api` / `ship:web` instead.
- **Workers routes need DNS** — `[[routes]]` in `wrangler.toml` only intercepts traffic already proxied through Cloudflare. The `api` subdomain needs a proxied AAAA record (`100::`) in Cloudflare DNS before the route works.
- **`wrangler.toml` must live in `packages/api/`** — if a `wrangler.toml` or `wrangler.jsonc` exists at the repo root, wrangler finds it first and ignores the package-level config (causing "Missing entry-point" errors).
- **CORS origins** — `packages/api/src/app.ts` has an allowlist. Add new origins there (e.g. preview deploy URLs like `*.roostdealer-web.pages.dev`). The `roostdealer-web.pages.dev` origin is already allowed.
- **VITE_API_URL is build-time** — changes require rebuilding and redeploying the web app (`pnpm ship:web`). The Vite dev proxy (`/api` → `localhost:3000`) still works for local dev when `VITE_API_URL` is unset.
- **Workers env vs process.env** — route handlers access env via `c.env.DATABASE_URL` (Hono context), not `process.env`. The Node.js dev entry (`index.ts`) bridges `process.env` into `c.env` via middleware. Never use `process.env` in `app.ts` or route files.
- **`workerd` build script** — must be approved in `pnpm-workspace.yaml` `onlyBuiltDependencies` for wrangler to work. Already configured.

### Image hosting (R2)
- **Bucket**: `roostdealer-images` on Cloudflare R2
- **Public URL**: `https://img.roostdealer.com` (needs custom domain setup on R2 bucket — use `pub-<hash>.r2.dev` until then)
- **Key structure**: `{dealer-slug}/units/{stockNumber}/{filename}`, `{dealer-slug}/dealer/{filename}`
- **Scraper uploads at scrape time**: `packages/scraper/src/images.ts` downloads from source, uploads to R2, rewrites URLs in output JSON
- **Bulk migration**: `pnpm db:migrate-images` (`packages/db/src/migrate-images.ts`) reads all dealers+units from DB, mirrors images to R2, updates rows. Idempotent — skips URLs already on R2.
- **Env vars**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (default: `roostdealer-images`), `R2_PUBLIC_URL` (default: `https://img.roostdealer.com`)
- **`R2_ACCOUNT_ID` is not an API token** — it's the 32-char hex Cloudflare account ID (e.g. `7eb5d5329ed4a2fb46e213755af0bcfc`). Found in the dashboard URL or wrangler output. The `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` come from the R2 API token.
- **R2 API token**: Create via Cloudflare dashboard → R2 → Manage R2 API Tokens → "Admin Read & Write" permission on the bucket
- **Workers binding**: `IMAGES` R2 binding in `wrangler.toml` (available in API worker as `c.env.IMAGES`)
- **`--skip-images`**: Scraper flag to keep original external URLs (useful for testing)
- **DealerSpike TLS**: DealerSpike sites have broken TLS on non-www domains. Image downloads use `curl` (shelled out) instead of Node `fetch`/`https` to handle this — macOS LibreSSL negotiates where Node's OpenSSL 3.x fails.

### Not yet built
- `api.roostdealer.com` DNS record (AAAA `100::` proxied) — once added, switch `.env.production` back to `https://api.roostdealer.com/api` and redeploy web
- `img.roostdealer.com` custom domain on R2 bucket (until then, use R2 public dev URL or Workers binding)
- BetterAuth organization plugin (dealer = org, staff = members with roles)
- Scraper writing directly to DB
- Subdomain-based tenant resolution middleware

## Competitive context

- **DealerSpike** — direct target. Legacy CMS, 24hr batch sync, no AI.
- **LightSpeed DMS** — future integration partner (4,500+ dealers). Has partner program with API access to inventory/customer/sales data. Jay should apply once we have traction.
- **Kenect** — NOT a competitor. Communication layer (texting, AI voice, reviews). Potential integration partner.
- **ARI Network Services** — OEM data licensing source for specs/photos (Phase D).

Jay Dorfman is the sales co-founder. He's Account Director at Boats Group (owns Boat Trader, YachtWorld). Boating Industry 40 Under 40. His network is the go-to-market.
