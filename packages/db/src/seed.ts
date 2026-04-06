import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { createDb } from './client'
import { dealers, units } from './schema'

interface DealerJson {
  dealer: {
    name: string
    slug: string
    logo?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    hours?: string
    heroImage?: string
    heroTitle?: string
    heroSubtitle?: string
    categoryImages?: Record<string, string>
    sourceUrl: string
  }
  units: {
    id: string
    year: number | null
    make: string
    model: string
    trim?: string
    type: string
    condition: string
    price: number | null
    specs: Record<string, string>
    originalDescription?: string
    aiDescription: string
    photos: string[]
    stockNumber?: string
    url?: string
  }[]
}

const dataDir = resolve(__dirname, '../../web/src/data')

const files = [
  'sample.json',
  'sarasota-powersports.json',
  'portside-marine.json',
  'toms-river-marine.json',
]

async function seed() {
  const db = createDb()

  for (const file of files) {
    const raw = readFileSync(resolve(dataDir, file), 'utf-8')
    const data: DealerJson = JSON.parse(raw)

    console.log(`Seeding ${data.dealer.name} (${data.units.length} units)...`)

    const [dealer] = await db
      .insert(dealers)
      .values({
        name: data.dealer.name,
        slug: data.dealer.slug,
        logo: data.dealer.logo,
        phone: data.dealer.phone,
        email: data.dealer.email,
        address: data.dealer.address,
        city: data.dealer.city,
        state: data.dealer.state,
        zip: data.dealer.zip,
        hours: data.dealer.hours,
        heroImage: data.dealer.heroImage,
        heroTitle: data.dealer.heroTitle,
        heroSubtitle: data.dealer.heroSubtitle,
        categoryImages: data.dealer.categoryImages,
        sourceUrl: data.dealer.sourceUrl,
      })
      .onConflictDoNothing({ target: dealers.slug })
      .returning()

    if (!dealer) {
      console.log(`  Skipped (already exists)`)
      continue
    }

    if (data.units.length > 0) {
      await db.insert(units).values(
        data.units.map((u) => ({
          dealerId: dealer.id,
          externalId: u.id,
          year: u.year,
          make: u.make,
          model: u.model,
          trim: u.trim,
          type: u.type as any,
          condition: u.condition as any,
          price: u.price,
          specs: u.specs,
          originalDescription: u.originalDescription,
          aiDescription: u.aiDescription,
          photos: u.photos,
          stockNumber: u.stockNumber,
          url: u.url,
        }))
      )
    }

    console.log(`  Done: ${data.units.length} units inserted`)
  }

  console.log('\nSeed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
