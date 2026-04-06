import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import type { RawListing, Unit, UnitType, Condition, DealerInfo } from './types.js'

const BATCH_SIZE = 5

function createBedrockClient(): BedrockRuntimeClient {
  const region = process.env.AWS_REGION || 'us-east-1'
  const token = process.env.AWS_BEARER_TOKEN_BEDROCK
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (token) {
    return new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
        sessionToken: token,
      },
    })
  }

  if (apiKey) {
    // Fallback: if they have AWS credentials in the environment (default chain)
    return new BedrockRuntimeClient({ region })
  }

  throw new Error(
    'No AI credentials found. Set AWS_BEARER_TOKEN_BEDROCK (for Bedrock) or configure AWS credentials.',
  )
}

function getModel(): string {
  return process.env.ANTHROPIC_SMALL_FAST_MODEL || 'us.anthropic.claude-sonnet-4-6'
}

async function callClaude(
  client: BedrockRuntimeClient,
  model: string,
  prompt: string,
  maxTokens: number,
): Promise<string> {
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  const command = new InvokeModelCommand({
    modelId: model,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  return responseBody.content?.[0]?.text || ''
}

/**
 * Enrich raw listings with AI-parsed structured data and generated descriptions.
 */
export async function enrich(
  listings: RawListing[],
  onProgress?: (msg: string) => void,
): Promise<Unit[]> {
  const log = onProgress ?? (() => {})
  const client = createBedrockClient()
  const model = getModel()

  log(`Using model: ${model}`)

  const units: Unit[] = []

  // Process in batches
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(listings.length / BATCH_SIZE)

    log(`Enriching batch ${batchNum}/${totalBatches} (${batch.length} listings)...`)

    try {
      const enriched = await enrichBatch(client, model, batch)
      units.push(...enriched)
    } catch (err) {
      log(`Warning: Batch ${batchNum} failed (${err instanceof Error ? err.message : String(err)}), enriching individually...`)
      // Fallback: process each listing individually
      for (const listing of batch) {
        try {
          const enriched = await enrichSingle(client, model, listing)
          units.push(enriched)
        } catch (singleErr) {
          log(
            `Warning: Failed to enrich ${listing.url}: ${singleErr instanceof Error ? singleErr.message : String(singleErr)}`,
          )
          // Create a best-effort unit from raw data
          units.push(fallbackUnit(listing))
        }
      }
    }
  }

  return units
}

/**
 * Enrich a batch of listings in a single API call.
 */
async function enrichBatch(
  client: BedrockRuntimeClient,
  model: string,
  listings: RawListing[],
): Promise<Unit[]> {
  const listingSummaries = listings.map((l, idx) => {
    const specs = Object.entries(l.specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')

    return `
=== LISTING ${idx + 1} ===
URL: ${l.url}
Title: ${l.title}
Price: ${l.price || 'Not listed'}
Specs:
${specs || 'None found'}
Description: ${l.description?.slice(0, 1000) || 'None'}
Number of photos: ${l.photos.length}
`
  })

  const prompt = `You are a powersports and marine inventory data specialist. Parse the following ${listings.length} dealer inventory listings into structured data.

For each listing, provide a JSON object with these fields:
- year: number or null (extract from title/specs)
- make: string (manufacturer brand, e.g., "Honda", "Yamaha", "Ranger Boats")
- model: string (model name/number)
- trim: string or null (trim/variant if applicable)
- type: one of "boat", "motorcycle", "atv", "utv", "snowmobile", "pwc", "trailer", "other"
- condition: "new" or "used" (infer from title, URL, or specs; default "new" if unclear)
- price: number or null (parse from price string, remove $ and commas)
- stockNumber: string or null (from specs if available, look for "stock", "stock #", "stock number")
- aiDescription: A compelling, SEO-optimized description of 150-250 words. Highlight key features, specs, and appeal. Write as if for a dealer website product page. Be enthusiastic but honest.

${listingSummaries.join('\n')}

Respond with ONLY a JSON array of objects. No markdown, no code fences, just the JSON array. Ensure the array has exactly ${listings.length} objects in the same order as the listings above.`

  const text = await callClaude(client, model, prompt, 4096)

  // Parse the JSON response
  const parsed = parseJsonResponse(text, listings.length)

  return listings.map((listing, idx) => {
    const ai = parsed[idx] || {}
    return buildUnit(listing, ai)
  })
}

/**
 * Enrich a single listing (fallback when batch fails).
 */
async function enrichSingle(
  client: BedrockRuntimeClient,
  model: string,
  listing: RawListing,
): Promise<Unit> {
  const specs = Object.entries(listing.specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const prompt = `Parse this dealer inventory listing into structured data:

Title: ${listing.title}
Price: ${listing.price || 'Not listed'}
URL: ${listing.url}
Specs:
${specs || 'None'}
Description: ${listing.description?.slice(0, 1000) || 'None'}

Respond with a single JSON object (no markdown, no code fences):
{
  "year": <number or null>,
  "make": "<string>",
  "model": "<string>",
  "trim": "<string or null>",
  "type": "<boat|motorcycle|atv|utv|snowmobile|pwc|trailer|other>",
  "condition": "<new|used>",
  "price": <number or null>,
  "stockNumber": "<string or null>",
  "aiDescription": "<150-250 word compelling product description>"
}`

  const text = await callClaude(client, model, prompt, 1024)

  const parsed = parseJsonResponse(text, 1)
  return buildUnit(listing, parsed[0] || {})
}

/**
 * Parse a JSON response from Claude, handling potential formatting issues.
 */
function parseJsonResponse(text: string, expectedCount: number): Record<string, unknown>[] {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/gm, '')
    .replace(/\n?```\s*$/gm, '')
    .trim()

  // Try direct parse
  try {
    const result = JSON.parse(cleaned)
    if (Array.isArray(result)) return result
    // Single object — wrap in array
    return [result]
  } catch {
    // Try to find JSON in the response
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0])
      } catch {
        // Fall through
      }
    }

    const objMatch = cleaned.match(/\{[\s\S]*\}/)
    if (objMatch) {
      try {
        return [JSON.parse(objMatch[0])]
      } catch {
        // Fall through
      }
    }
  }

  // Return empty array of the expected size
  return Array.from({ length: expectedCount }, () => ({}))
}

/**
 * Build a Unit from a RawListing and AI-parsed data.
 */
function buildUnit(listing: RawListing, ai: Record<string, unknown>): Unit {
  const validTypes: UnitType[] = ['boat', 'motorcycle', 'atv', 'utv', 'snowmobile', 'pwc', 'trailer', 'other']
  const rawType = String(ai.type || 'other').toLowerCase() as UnitType
  const type = validTypes.includes(rawType) ? rawType : 'other'

  const rawCondition = String(ai.condition || 'new').toLowerCase()
  const condition: Condition = rawCondition === 'used' ? 'used' : 'new'

  // Generate a stable ID from the URL
  const id = generateId(listing.url)

  return {
    id,
    year: typeof ai.year === 'number' ? ai.year : null,
    make: String(ai.make || 'Unknown'),
    model: String(ai.model || 'Unknown'),
    trim: ai.trim ? String(ai.trim) : undefined,
    type,
    condition,
    price: typeof ai.price === 'number' ? ai.price : parsePrice(listing.price),
    specs: listing.specs,
    originalDescription: listing.description,
    aiDescription: String(ai.aiDescription || ai.description || 'No description available.'),
    photos: listing.photos,
    stockNumber: ai.stockNumber ? String(ai.stockNumber) : undefined,
    url: listing.url,
  }
}

/**
 * Create a best-effort unit when AI enrichment fails entirely.
 */
function fallbackUnit(listing: RawListing): Unit {
  const titleParts = listing.title.match(/(\d{4})?\s*(.+?)(?:\s+(.+))?$/)
  return {
    id: generateId(listing.url),
    year: titleParts?.[1] ? parseInt(titleParts[1], 10) : null,
    make: titleParts?.[2]?.trim() || 'Unknown',
    model: titleParts?.[3]?.trim() || listing.title,
    type: 'other',
    condition: /used|pre-owned/i.test(listing.title + listing.url) ? 'used' : 'new',
    price: parsePrice(listing.price),
    specs: listing.specs,
    originalDescription: listing.description,
    aiDescription: listing.description || listing.title,
    photos: listing.photos,
    url: listing.url,
  }
}

function parsePrice(priceStr: string | undefined): number | null {
  if (!priceStr) return null
  const cleaned = priceStr.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function generateId(url: string): string {
  // Create a short hash-like ID from the URL
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32-bit integer
  }
  return `unit-${Math.abs(hash).toString(36)}`
}

/**
 * Use AI to generate a compelling, dealer-specific hero title and subtitle.
 */
export async function enrichDealerHero(
  dealer: DealerInfo,
  units: Unit[],
  onProgress?: (msg: string) => void,
): Promise<{ heroTitle: string; heroSubtitle: string }> {
  const log = onProgress ?? (() => {})
  const client = createBedrockClient()
  const model = getModel()

  // Summarize inventory for the prompt
  const typeCounts = new Map<string, number>()
  const makes = new Set<string>()
  for (const u of units) {
    typeCounts.set(u.type, (typeCounts.get(u.type) || 0) + 1)
    if (u.make !== 'Unknown') makes.add(u.make)
  }
  const inventorySummary = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ')
  const brandList = [...makes].slice(0, 8).join(', ')

  const prompt = `You are a marketing copywriter for a powersports/marine dealership website. Generate a hero section title and subtitle for this dealer's homepage.

Dealer: ${dealer.name}
Location: ${dealer.city ? `${dealer.city}, ${dealer.state}` : 'Unknown'}
Inventory: ${units.length} units — ${inventorySummary}
Top brands: ${brandList}

Requirements:
- heroTitle: A punchy, 4-8 word headline that captures the dealer's identity. Do NOT use generic phrases like "Starts Here" or "Your Adventure Awaits." Make it specific to what this dealer actually sells and where they are. Use power words that evoke the lifestyle.
- heroSubtitle: 1-2 sentences (under 40 words) that expand on the title. Mention the dealer name, location, and the types of products they carry. Be specific, not generic.

Respond with ONLY a JSON object, no markdown:
{"heroTitle": "...", "heroSubtitle": "..."}`

  log('Generating hero content with AI...')
  const text = await callClaude(client, model, prompt, 256)

  try {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      heroTitle: String(parsed.heroTitle || ''),
      heroSubtitle: String(parsed.heroSubtitle || ''),
    }
  } catch {
    log('Warning: Failed to parse hero content, using defaults')
    return { heroTitle: '', heroSubtitle: '' }
  }
}
