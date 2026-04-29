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
    heroSlides?: Array<{ image: string; video?: string; title: string; subtitle: string; ctaText?: string; ctaLink?: string }>
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
  'five-star-marine.json',
  'five-star-duncansville.json',
  'grace-marine.json',
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
        heroSlides: data.dealer.heroSlides,
        sourceUrl: data.dealer.sourceUrl,
      })
      .onConflictDoNothing({ target: dealers.slug })
      .returning()

    if (!dealer) {
      console.log(`  Skipped (already exists)`)
      continue
    }

    if (data.units.length > 0) {
      // Batch inserts to stay under Postgres parameter limit
      const BATCH_SIZE = 10
      for (let i = 0; i < data.units.length; i += BATCH_SIZE) {
        const batch = data.units.slice(i, i + BATCH_SIZE)
        await db.insert(units).values(
          batch.map((u) => ({
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
    }

    console.log(`  Done: ${data.units.length} units inserted`)
  }

  // Backfill fields for dealers that already existed
  for (const file of files) {
    const raw = readFileSync(resolve(dataDir, file), 'utf-8')
    const data: DealerJson = JSON.parse(raw)
    const updates: Record<string, any> = {}
    if (data.dealer.heroSlides?.length) updates.heroSlides = data.dealer.heroSlides
    if (data.dealer.hours) updates.hours = data.dealer.hours
    if (Object.keys(updates).length > 0) {
      await db
        .update(dealers)
        .set(updates)
        .where(eq(dealers.slug, data.dealer.slug))
      console.log(`  Updated ${Object.keys(updates).join(', ')} for ${data.dealer.name}`)
    }
  }

  // --- Seed carousel + testimonials for Sarasota Powersports ---
  const [sarasota] = await db
    .select({ id: dealers.id })
    .from(dealers)
    .where(eq(dealers.slug, 'sarasota-powersports'))

  if (sarasota) {
    // Hero carousel slides (scraped from sarasotapowersports.com)
    const spsOrigin = 'https://sarasotapowersports.com'
    const heroSlides = [
      { image: `${spsOrigin}/images/slideshow/Promotional-Slideshow/slide_Polaris_March2026_WCTBSPS.jpg`, title: 'Sarasota Powersports', subtitle: "Florida's premier powersports dealer" },
      { image: `${spsOrigin}/images/slideshow/Promotional-Slideshow/slide_CFMoto_March2026_WCTBSPS.png`, title: 'Sarasota Powersports', subtitle: "Florida's premier powersports dealer" },
      { image: `${spsOrigin}/images/slideshow/Promotional-Slideshow/slide_Suzuki_WCTBSPS.jpg`, title: 'Sarasota Powersports', subtitle: "Florida's premier powersports dealer" },
      { image: `${spsOrigin}/images/slideshow/Promotional-Slideshow/Yamaha-Sxs-2000x530.jpg`, title: 'Yamaha Special Offers', subtitle: '$500 Customer Cash on select models', ctaText: 'Learn More', ctaLink: '/sarasota-powersports/inventory' },
      { image: `${spsOrigin}/images/slideshow/Promotional-Slideshow/slide_GasGas_WCTBSPS.jpg`, title: 'Sarasota Powersports', subtitle: "Florida's premier powersports dealer" },
      { image: `${spsOrigin}/images/slideshow/Promotional-Slideshow/Polaris-2000x530.jpg`, title: 'Polaris Off-Road Sale', subtitle: 'Up to $3,000 off select 2026 vehicles', ctaText: 'Shop Now', ctaLink: '/sarasota-powersports/inventory?make=Polaris' },
    ]

    await db.update(dealers).set({ heroSlides }).where(eq(dealers.id, sarasota.id))
    console.log(`\nSeeded ${heroSlides.length} hero slides for Sarasota Powersports`)

    // Real testimonials (scraped from sarasotapowersports.com)
    await db.delete(testimonials).where(eq(testimonials.dealerId, sarasota.id))

    const realTestimonials = [
      {
        dealerId: sarasota.id,
        reviewerName: 'Robb LeBoeuf',
        rating: 5,
        text: 'I recently was starting to look for a new motorcycle. When I went into the showroom I was greeted by a gentleman who offered his services. There was never any pressure or "herding" to any specific motorcycle. Andreas told me about all of the new models and we signed the paperwork. The staff at Sarasota Powersports were top notch, sales was fluid and comfortable, financing was spot on and reasonable.',
        source: 'DealerSpike',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Mike F',
        rating: 5,
        text: 'Love this store. The staff is fantastic, the selection is great and everyone involved with buying my new ride made it an awesome experience. Thanks guys!',
        source: 'DealerSpike',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Dave Zucker',
        rating: 5,
        text: 'Last week I purchased a new 2018 Kawasaki from Justin at Sarasota Powersports. The entire experience exceeded my expectations. The bike was prepped and ready to go exactly as promised and the price was extremely fair. This is a great dealership to do business with and I highly recommend them.',
        source: 'DealerSpike',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'TJ TheSoulTrain',
        rating: 5,
        text: "This staff is absolutely fantastic! I bought my bike out of the crate and didn't know how to ride it in 2016. They delivered it and brought it into my garage. They maintained the bike while it was on the street and when I put it on the track. They have been extremely friendly, helpful and one of the reasons I keep going back.",
        source: 'DealerSpike',
      },
      {
        dealerId: sarasota.id,
        reviewerName: 'Justin Semi',
        rating: 5,
        text: 'Very welcoming, answered all my questions, gear and tools very fairly priced, every time I go in here I feel very welcomed, these guys are great, love this place.',
        source: 'DealerSpike',
      },
    ]

    await db.insert(testimonials).values(realTestimonials)
    console.log(`Seeded ${realTestimonials.length} testimonials for Sarasota Powersports`)
  }

  console.log('\nSeed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
