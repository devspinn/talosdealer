import { config } from 'dotenv'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { eq } from 'drizzle-orm'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createDb } from './client'
import { dealers, units } from './schema'

const CONCURRENCY = 5

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET || 'roostdealer-images'
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://img.roostdealer.com'

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env')
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl }
}

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

function guessContentType(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const ext = extname(pathname)
    return CONTENT_TYPES[ext] || 'image/jpeg'
  } catch {
    return 'image/jpeg'
  }
}

function sanitizeFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const filename = pathname.split('/').pop() || 'image.jpg'
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  } catch {
    return 'image.jpg'
  }
}

function isR2Url(url: string): boolean {
  return url.includes('.r2.dev/') || url.includes('img.roostdealer.com/')
}

function isAlreadyMirrored(url: string, publicUrl: string): boolean {
  return url.startsWith(publicUrl)
}

function extractR2Key(url: string): string | null {
  if (!isR2Url(url)) return null
  try {
    return new URL(url).pathname.slice(1)
  } catch {
    return null
  }
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const { stdout } = await execFileAsync('curl', [
    '-fsSL',
    '--max-time', '30',
    '-H', 'User-Agent: Talos/1.0',
    '--output', '-',
    url,
  ], { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 })

  const contentType = guessContentType(url)
  return { buffer: stdout, contentType }
}

async function mirrorOne(
  client: S3Client,
  bucket: string,
  publicUrl: string,
  sourceUrl: string,
  key: string,
): Promise<string> {
  if (isAlreadyMirrored(sourceUrl, publicUrl)) return sourceUrl

  // Already in R2 under a different URL (e.g. dev URL) — just rewrite the prefix
  const existingKey = extractR2Key(sourceUrl)
  if (existingKey) return `${publicUrl}/${existingKey}`

  const { buffer, contentType } = await downloadImage(sourceUrl)
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
  return `${publicUrl}/${key}`
}

async function mirrorBatch(
  client: S3Client,
  bucket: string,
  publicUrl: string,
  urls: string[],
  keyPrefix: string,
): Promise<string[]> {
  const results: string[] = new Array(urls.length)

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (url, j) => {
        try {
          const filename = sanitizeFilename(url)
          const key = `${keyPrefix}/${filename}`
          results[i + j] = await mirrorOne(client, bucket, publicUrl, url, key)
        } catch (err) {
          console.log(`    Warning: failed ${url}: ${err instanceof Error ? err.message : String(err)}`)
          results[i + j] = url
        }
      })
    )
  }

  return results
}

async function main() {
  const r2 = getR2Config()
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
  })
  const db = createDb()

  console.log('\nTalos Image Migration')
  console.log('===========================\n')

  // --- Dealers ---
  const allDealers = await db.select().from(dealers)
  console.log(`Found ${allDealers.length} dealers\n`)

  for (const dealer of allDealers) {
    console.log(`Dealer: ${dealer.name} (${dealer.slug})`)
    let changed = false

    if (dealer.logo && !isAlreadyMirrored(dealer.logo, r2.publicUrl)) {
      try {
        dealer.logo = await mirrorOne(client, r2.bucket, r2.publicUrl, dealer.logo, `${dealer.slug}/dealer/${sanitizeFilename(dealer.logo)}`)
        changed = true
        console.log('  ✓ logo')
      } catch (err) {
        console.log(`  ✗ logo: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (dealer.heroImage && !isAlreadyMirrored(dealer.heroImage, r2.publicUrl)) {
      try {
        dealer.heroImage = await mirrorOne(client, r2.bucket, r2.publicUrl, dealer.heroImage, `${dealer.slug}/dealer/${sanitizeFilename(dealer.heroImage)}`)
        changed = true
        console.log('  ✓ heroImage')
      } catch (err) {
        console.log(`  ✗ heroImage: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (dealer.heroSlides?.length) {
      const slideUrls = dealer.heroSlides.map((s) => s.image)
      const needsMigration = slideUrls.some((u) => !isAlreadyMirrored(u, r2.publicUrl))
      if (needsMigration) {
        const mirrored = await mirrorBatch(client, r2.bucket, r2.publicUrl, slideUrls, `${dealer.slug}/dealer/slides`)
        dealer.heroSlides = dealer.heroSlides.map((slide, i) => ({ ...slide, image: mirrored[i] }))
        changed = true
        console.log(`  ✓ ${dealer.heroSlides.length} hero slides`)
      }
    }

    if (dealer.categoryImages) {
      const entries = Object.entries(dealer.categoryImages)
      const needsMigration = entries.some(([, url]) => !isAlreadyMirrored(url, r2.publicUrl))
      if (needsMigration) {
        const mirrored: Record<string, string> = {}
        for (const [category, url] of entries) {
          try {
            mirrored[category] = await mirrorOne(client, r2.bucket, r2.publicUrl, url, `${dealer.slug}/dealer/categories/${sanitizeFilename(url)}`)
          } catch {
            mirrored[category] = url
          }
        }
        dealer.categoryImages = mirrored
        changed = true
        console.log(`  ✓ ${entries.length} category images`)
      }
    }

    if (changed) {
      await db.update(dealers).set({
        logo: dealer.logo,
        heroImage: dealer.heroImage,
        heroSlides: dealer.heroSlides,
        categoryImages: dealer.categoryImages,
      }).where(eq(dealers.id, dealer.id))
      console.log('  → updated in DB')
    } else {
      console.log('  (no dealer images to migrate)')
    }
  }

  // --- Units ---
  const allUnits = await db.select().from(units)
  console.log(`\nFound ${allUnits.length} units total\n`)

  let totalPhotos = 0
  let migratedPhotos = 0

  for (const unit of allUnits) {
    if (unit.photos.length === 0) continue
    totalPhotos += unit.photos.length

    const needsMigration = unit.photos.some((u) => !isAlreadyMirrored(u, r2.publicUrl))
    if (!needsMigration) continue

    const dealer = allDealers.find((d) => d.id === unit.dealerId)
    const slug = dealer?.slug || 'unknown'
    const unitKey = unit.stockNumber || unit.id

    const mirrored = await mirrorBatch(client, r2.bucket, r2.publicUrl, unit.photos, `${slug}/units/${unitKey}`)

    await db.update(units).set({ photos: mirrored }).where(eq(units.id, unit.id))

    const count = mirrored.filter((u) => isAlreadyMirrored(u, r2.publicUrl)).length
    migratedPhotos += count

    if (migratedPhotos % 50 === 0 || unit === allUnits[allUnits.length - 1]) {
      console.log(`  Progress: ${migratedPhotos} photos mirrored...`)
    }
  }

  console.log(`\nDone! Mirrored ${migratedPhotos}/${totalPhotos} unit photos to R2.`)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
