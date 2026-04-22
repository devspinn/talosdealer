# Talos

AI-native website platform for powersports, marine, and outdoor equipment dealerships. Replaces legacy CMS providers (DealerSpike) with instant AI-powered onboarding, better inventory descriptions, and modern design.

## How it works

1. **Scrape** a dealer's existing website to extract their inventory
2. **Enrich** each listing with Claude — structured data + compelling SEO descriptions
3. **Render** a beautiful, fast dealer website from the enriched data

## Project structure

```
roostdealer/
├── packages/
│   ├── scraper/          # CLI tool: crawl dealer sites, enrich with AI
│   │   ├── src/
│   │   │   ├── index.ts  # CLI entry (commander)
│   │   │   ├── crawl.ts  # Site crawler + inventory discovery
│   │   │   ├── extract.ts # HTML → structured data (Cheerio)
│   │   │   └── enrich.ts # Claude API → descriptions + parsing
│   │   └── output/       # Scraped JSON output (gitignored)
│   └── web/              # Demo dealer website (React + Vite)
│       └── src/
│           ├── pages/    # Home, Inventory, UnitDetail, Contact
│           ├── components/
│           └── data/     # Static JSON (from scraper or sample)
├── package.json          # pnpm workspace root
└── pnpm-workspace.yaml
```

## Setup

```bash
pnpm install
```

### Required environment variables (for AI enrichment)

The scraper uses AWS Bedrock to call Claude. These should already be in your shell if you're running Claude Code with Bedrock:

```
AWS_BEARER_TOKEN_BEDROCK   # Auth token
AWS_REGION                 # e.g. us-east-1
ANTHROPIC_SMALL_FAST_MODEL # e.g. us.anthropic.claude-sonnet-4-6
```

## Usage

### Run the scraper

```bash
# Full pipeline: scrape + AI enrichment
pnpm scrape --url https://some-dealer.com --output ./packages/scraper/output/dealer.json

# Scrape only (skip AI, useful for testing the crawler)
pnpm scrape --url https://some-dealer.com --skip-enrich

# Limit listings (faster for testing)
pnpm scrape --url https://some-dealer.com --max-listings 5
```

### Run the demo website

```bash
pnpm dev
# → http://localhost:5173
```

The demo site loads from `packages/web/src/data/sample.json` by default. To use real scraped data, copy your scraper output there.

### Build for production

```bash
pnpm build
# Output in packages/web/dist/
```

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui patterns |
| AI | Claude via AWS Bedrock |
| Scraping | Cheerio + native fetch |
| Monorepo | pnpm workspaces |

## Phases

- **Phase A (current):** Scraper + static demo site. Prove the concept to dealers.
- **Phase B:** Hono API + Neon DB + BetterAuth. Multi-tenant, lead capture, dealer admin.
- **Phase C:** AI chat, DMS integration (LightSpeed), marketplace syndication.

## Team

- **dtown** — technical, builds with Claude Code
- **Jay Dorfman** — sales/industry, Account Director at Boats Group
