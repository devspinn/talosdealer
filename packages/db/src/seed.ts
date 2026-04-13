import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { eq } from 'drizzle-orm'
import { createDb } from './client'
import { dealers, units, testimonials } from './schema'

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

  // --- Seed testimonials for Sarasota Powersports ---
  const [sarasota] = await db
    .select({ id: dealers.id })
    .from(dealers)
    .where(eq(dealers.slug, 'sarasota-powersports'))

  if (sarasota) {
    // Clear existing testimonials to avoid duplicates on re-run
    await db.delete(testimonials).where(eq(testimonials.dealerId, sarasota.id))

    const fakeTestimonials = [
      {
        dealerId: sarasota.id,
        reviewerName: 'Mike R.',
        rating: 5,
        text: 'Bought a 2024 Yamaha WaveRunner from these guys and the whole process was seamless. No pressure sales, fair trade-in value on my old ski, and they had me on the water the same weekend.',
        source: 'Google',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Jessica T.',
        rating: 5,
        text: 'Their service department is top notch. I brought my CFMoto in for a weird electrical issue and they diagnosed it in under an hour. Reasonable labor rates too. Will definitely be back.',
        source: 'Google',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Carlos M.',
        rating: 4,
        text: 'Great selection of new and used inventory. The online photos matched exactly what was on the lot. Sales team was knowledgeable and helped me pick the right UTV for my property.',
        source: 'Facebook',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Donna K.',
        rating: 5,
        text: 'We\'ve purchased three boats from Sarasota Powersports over the years. They always go above and beyond with the rigging and delivery. Wouldn\'t go anywhere else in the Sarasota area.',
        source: 'Google',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Brian W.',
        rating: 4,
        text: 'Financing was easy and they beat the rate my credit union offered. The parts department also had the cover I needed in stock, which saved me from ordering online and waiting a week.',
        source: 'Facebook',
      },
    ]

    await db.insert(testimonials).values(fakeTestimonials)
    console.log(`\nSeeded 5 testimonials for Sarasota Powersports`)
  }

  console.log('\nSeed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
