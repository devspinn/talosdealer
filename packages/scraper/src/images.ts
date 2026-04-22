import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { extname } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
import type { DealerInfo, Unit, HeroSlide } from './types.js'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
}

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET || 'roostdealer-images'
  const publicUrl = process.env.R2_PUBLIC_URL || `https://img.roostdealer.com`

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.'
    )
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl }
}

function createS3Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
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
  const pathname = new URL(url).pathname.toLowerCase()
  const ext = extname(pathname)
  return CONTENT_TYPES[ext] || 'image/jpeg'
}

function sanitizeFilename(url: string): string {
  const pathname = new URL(url).pathname
  const filename = pathname.split('/').pop() || 'image.jpg'
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
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

async function uploadToR2(
  client: S3Client,
  config: R2Config,
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )
  return `${config.publicUrl}/${key}`
}

async function mirrorImage(
  client: S3Client,
  config: R2Config,
  sourceUrl: string,
  keyPrefix: string,
  log: (msg: string) => void,
): Promise<string> {
  const filename = sanitizeFilename(sourceUrl)
  const key = `${keyPrefix}/${filename}`

  try {
    const { buffer, contentType } = await downloadImage(sourceUrl)
    const publicUrl = await uploadToR2(client, config, key, buffer, contentType)
    return publicUrl
  } catch (err) {
    log(`Warning: failed to mirror ${sourceUrl}: ${err instanceof Error ? err.message : String(err)}`)
    return sourceUrl
  }
}

async function mirrorImages(
  client: S3Client,
  config: R2Config,
  urls: string[],
  keyPrefix: string,
  log: (msg: string) => void,
  concurrency = 5,
): Promise<string[]> {
  const results: string[] = new Array(urls.length)

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((url, j) => mirrorImage(client, config, url, keyPrefix, log).then((r) => {
        results[i + j] = r
      }))
    )
  }

  return results
}

export async function uploadImages(
  dealer: DealerInfo,
  units: Unit[],
  log: (msg: string) => void,
): Promise<{ dealer: DealerInfo; units: Unit[] }> {
  const config = getR2Config()
  const client = createS3Client(config)
  const slug = dealer.slug

  log(`Uploading images to R2 bucket "${config.bucket}"...`)

  // Mirror dealer images
  if (dealer.logo) {
    log('  Uploading dealer logo...')
    dealer.logo = await mirrorImage(client, config, dealer.logo, `${slug}/dealer`, log)
  }

  if (dealer.heroImage) {
    log('  Uploading hero image...')
    dealer.heroImage = await mirrorImage(client, config, dealer.heroImage, `${slug}/dealer`, log)
  }

  if (dealer.heroSlides?.length) {
    log(`  Uploading ${dealer.heroSlides.length} hero slides...`)
    const slideUrls = dealer.heroSlides.map((s) => s.image)
    const mirrored = await mirrorImages(client, config, slideUrls, `${slug}/dealer/slides`, log)
    dealer.heroSlides = dealer.heroSlides.map((slide, i) => ({
      ...slide,
      image: mirrored[i],
    }))
  }

  // Mirror unit photos
  const totalPhotos = units.reduce((sum, u) => sum + u.photos.length, 0)
  log(`  Uploading ${totalPhotos} unit photos across ${units.length} units...`)

  let uploaded = 0
  for (const unit of units) {
    if (unit.photos.length === 0) continue

    const unitKey = unit.stockNumber || unit.id
    unit.photos = await mirrorImages(
      client,
      config,
      unit.photos,
      `${slug}/units/${unitKey}`,
      log,
    )

    uploaded += unit.photos.length
    if (uploaded % 25 === 0 || uploaded === totalPhotos) {
      log(`  Progress: ${uploaded}/${totalPhotos} photos`)
    }
  }

  log(`  Done! ${uploaded} photos uploaded.`)
  return { dealer, units }
}
