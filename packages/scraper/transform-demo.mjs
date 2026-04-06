/**
 * Transform raw scraped data into clean demo JSON files.
 * Handles both Classic (Sarasota) and ARI (Portside) raw output.
 */
import { readFileSync, writeFileSync } from 'node:fs'

// === Sarasota Powersports (Classic DealerSpike) ===

const sarasotaRaw = JSON.parse(readFileSync('output/sarasota-test2.json', 'utf-8'))

const VTYPE_MAP = {
  'Utility Vehicle': 'utv',
  'ATV': 'atv',
  'Motorcycle / Scooter': 'motorcycle',
  'Motorcycle': 'motorcycle',
  'Scooter': 'motorcycle',
  'Boat': 'boat',
  'Personal Watercraft': 'pwc',
  'Snowmobile': 'snowmobile',
  'Trailer': 'trailer',
}

function parseUrlParamsClassic(url) {
  try {
    const u = new URL(url)
    return {
      year: u.searchParams.get('year') ? parseInt(u.searchParams.get('year')) : null,
      make: u.searchParams.get('make') || null,
      model: u.searchParams.get('model')?.replace(/\+/g, ' ') || null,
      condition: (u.searchParams.get('condition') || 'new').toLowerCase(),
      vtype: u.searchParams.get('vtype')?.replace(/\+/g, ' ') || null,
      stockno: u.searchParams.get('stockno') || null,
      vin: u.searchParams.get('vin') || null,
      oid: u.searchParams.get('oid') || null,
    }
  } catch { return null }
}

const sarasotaUnits = sarasotaRaw.units.map((u, i) => {
  const params = parseUrlParamsClassic(u.url || '')
  const type = params?.vtype ? (VTYPE_MAP[params.vtype] || 'other') : 'other'
  return {
    id: params?.oid || `sarasota-${i}`,
    year: params?.year || null,
    make: params?.make || 'Unknown',
    model: params?.model || u.model,
    type,
    condition: (params?.condition === 'new' || params?.condition === 'used') ? params.condition : 'new',
    price: u.price || null,
    specs: u.specs || {},
    originalDescription: u.originalDescription,
    aiDescription: `${params?.year || ''} ${params?.make || ''} ${params?.model || u.model} — available now at Sarasota Powersports. Contact us for pricing and availability.`,
    photos: u.photos || [],
    stockNumber: params?.stockno || u.stockNumber,
    url: u.url,
  }
})

const sarasotaOutput = {
  dealer: {
    name: 'Sarasota Powersports',
    slug: 'sarasota-powersports',
    logo: 'https://www.sarasotapowersports.com/images/sarasota-powersports-logo.png',
    phone: '941-351-4330',
    email: 'info@sarasotapowersports.com',
    address: '2001 University Parkway',
    city: 'Sarasota',
    state: 'FL',
    zip: '34243',
    heroImage: undefined,
    categoryImages: {
      motorcycle: 'https://www.sarasotapowersports.com/images/sarasota-powersports-bttn-1.jpg',
      atv: 'https://www.sarasotapowersports.com/images/sarasota-powersports-bttn-2.jpg',
      utv: 'https://www.sarasotapowersports.com/images/sarasota-powersports-bttn-3.jpg',
    },
    sourceUrl: 'https://www.sarasotapowersports.com',
  },
  units: sarasotaUnits,
}

writeFileSync(
  new URL('../web/src/data/sarasota-powersports.json', import.meta.url),
  JSON.stringify(sarasotaOutput, null, 2),
)
console.log(`Sarasota: ${sarasotaUnits.length} units written`)


// === Portside Orlando (ARI DealerSpike) ===

const portsideRaw = JSON.parse(readFileSync('output/portside-all.json', 'utf-8'))

function parseAriSlug(url) {
  try {
    const path = new URL(url).pathname
    const match = path.match(/\/inventory\/(.+)-(\d{5,})i\/?$/)
    if (!match) return null
    const slug = match[1]
    const id = match[2]
    const parts = slug.split('-')

    const year = /^\d{4}$/.test(parts[0]) ? parseInt(parts[0]) : null

    // Find state/zip working backwards
    const remaining = year ? parts.slice(1) : parts
    let stateIdx = -1
    for (let i = remaining.length - 1; i >= Math.max(0, remaining.length - 4); i--) {
      if (/^[a-z]{2}$/i.test(remaining[i]) && i + 1 < remaining.length && /^\d{5}$/.test(remaining[i + 1])) {
        stateIdx = i
        break
      }
    }

    let brandModelParts
    if (stateIdx > 0) {
      // Look back for city (1-2 words before state)
      const cityStart = Math.max(0, stateIdx - 2)
      brandModelParts = remaining.slice(0, cityStart)
    } else {
      brandModelParts = remaining
    }

    if (brandModelParts.length === 0) return { id, year }

    // Multi-word brand detection
    const knownBrands = [
      'alk2 powerboats', 'sea born', 'hog island', 'cape craft',
      'magic tilt', 'suzuki marine', 'sun tracker', 'power pole',
    ]

    let make = null
    let modelParts = brandModelParts

    for (const brand of knownBrands) {
      const brandWords = brand.split(' ')
      const candidate = brandModelParts.slice(0, brandWords.length).join(' ').toLowerCase()
      if (candidate === brand) {
        make = brandWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        modelParts = brandModelParts.slice(brandWords.length)
        break
      }
    }

    if (!make && brandModelParts.length > 0) {
      make = brandModelParts[0].charAt(0).toUpperCase() + brandModelParts[0].slice(1)
      modelParts = brandModelParts.slice(1)
    }

    const model = modelParts.map(w => w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    return { id, year, make, model: model || undefined }
  } catch { return null }
}

// Classify Portside items
function classifyPortsideUnit(title, url, make) {
  const lower = (title + ' ' + url).toLowerCase()
  const makeLower = (make || '').toLowerCase()

  // Outboard motors are not boats
  if (makeLower === 'suzuki marine' || makeLower === 'mercury') return 'other'

  // Trailers
  if (makeLower === 'magic tilt') return 'trailer'

  // Accessories
  if (makeLower === 'power pole' || makeLower === 'dolphin') return 'other'

  // PWC trailers
  if (lower.includes('jet ski') || lower.includes('pwc')) return 'pwc'

  // Everything else from this dealer is a boat
  return 'boat'
}

// Transform all units
const allPortsideUnits = portsideRaw.units.map((u, i) => {
  const parsed = parseAriSlug(u.url || '')
  const make = parsed?.make || 'Unknown'
  const model = parsed?.model || u.model
  const type = classifyPortsideUnit(u.model, u.url || '', make)

  return {
    id: parsed?.id || `portside-${i}`,
    year: parsed?.year || null,
    make,
    model,
    type,
    condition: u.url?.includes('used') || (parsed?.year && parsed.year < 2025) ? 'used' : 'new',
    price: u.price || null,
    specs: u.specs || {},
    originalDescription: u.originalDescription,
    aiDescription: `${parsed?.year || ''} ${make} ${model} — available at Portside Marine in Winter Park, FL. Come see it in person or call for details.`,
    photos: u.photos || [],
    url: u.url,
  }
})

// Select diverse 20: prioritize boats, one per unique make+model combo, prefer units with photos
const boatUnits = allPortsideUnits.filter(u => u.type === 'boat' && u.photos.length > 0)
const trailerUnits = allPortsideUnits.filter(u => u.type === 'trailer' && u.photos.length > 0)

// Pick one per unique model from boats
const seenModels = new Set()
const selectedBoats = []
for (const u of boatUnits) {
  const key = `${u.make}-${u.model}`
  if (!seenModels.has(key)) {
    seenModels.add(key)
    selectedBoats.push(u)
  }
}

// Pick a few trailers too
const selectedTrailers = []
for (const u of trailerUnits) {
  const key = `${u.make}-${u.model}`
  if (!seenModels.has(key)) {
    seenModels.add(key)
    selectedTrailers.push(u)
    if (selectedTrailers.length >= 3) break
  }
}

// Combine: up to 17 boats + 3 trailers
const portsideUnits = [...selectedBoats.slice(0, 17), ...selectedTrailers].slice(0, 20)

const portsideOutput = {
  dealer: {
    name: 'Portside Marine',
    slug: 'portside-marine',
    logo: 'https://published-assets.ari-build.com/Content/Published/Site/24421/images/logo.png',
    phone: '(407) 249-1124',
    address: '2730 Forsyth Rd',
    city: 'Winter Park',
    state: 'FL',
    zip: '32792',
    heroImage: undefined,
    sourceUrl: 'https://www.portsideorlando.com',
  },
  units: portsideUnits,
}

writeFileSync(
  new URL('../web/src/data/portside-marine.json', import.meta.url),
  JSON.stringify(portsideOutput, null, 2),
)

console.log(`Portside: ${portsideUnits.length} units written`)
console.log('  Boats:', portsideUnits.filter(u => u.type === 'boat').length)
console.log('  Trailers:', portsideUnits.filter(u => u.type === 'trailer').length)
console.log('  Unique makes:', [...new Set(portsideUnits.map(u => u.make))].join(', '))


// === Toms River Marine and Motorsports (Classic DealerSpike) ===

const tomsriverRaw = JSON.parse(readFileSync('output/tomsriver-raw.json', 'utf-8'))

const tomsriverUnits = tomsriverRaw.units.map((u, i) => {
  const params = parseUrlParamsClassic(u.url || '')
  const type = params?.vtype ? (VTYPE_MAP[params.vtype] || 'other') : 'other'
  return {
    id: params?.oid || `tomsriver-${i}`,
    year: params?.year || null,
    make: params?.make || 'Unknown',
    model: params?.model || u.model,
    type,
    condition: (params?.condition === 'new' || params?.condition === 'used') ? params.condition : 'new',
    price: u.price || null,
    specs: u.specs || {},
    originalDescription: u.originalDescription,
    aiDescription: `${params?.year || ''} ${params?.make || ''} ${params?.model || u.model} — available now at Toms River Marine and Motorsports. Contact us for pricing and availability.`,
    photos: u.photos || [],
    stockNumber: params?.stockno || u.stockNumber,
    url: u.url,
  }
})

const tomsriverOutput = {
  dealer: {
    name: 'Toms River Marine & Motorsports',
    slug: 'toms-river-marine',
    logo: tomsriverRaw.dealer.logo,
    phone: '(732) 929-8168',
    address: '3117 Route 37 East',
    city: 'Toms River',
    state: 'NJ',
    zip: '08753',
    heroTitle: 'From Open Water to Open Trail',
    heroSubtitle: 'Toms River Marine & Motorsports is the Jersey Shore\'s home for boats, motorcycles, ATVs, and side-by-sides from Yamaha, Kawasaki, and more.',
    heroImage: undefined,
    sourceUrl: 'https://www.tomsrivermarineandmotorsports.com',
  },
  units: tomsriverUnits,
}

writeFileSync(
  new URL('../web/src/data/toms-river-marine.json', import.meta.url),
  JSON.stringify(tomsriverOutput, null, 2),
)
console.log(`Toms River: ${tomsriverUnits.length} units written`)
console.log('  Types:', [...new Set(tomsriverUnits.map(u => u.type))].join(', '))
console.log('  Makes:', [...new Set(tomsriverUnits.map(u => u.make))].join(', '))
