// lib/storage/r2.js

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET
const R2_ENDPOINT =
  process.env.CLOUDFLARE_R2_ENDPOINT ||
  (R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : '')

const R2_PUBLIC_BASE_URL = String(
  process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || '',
).replace(/\/+$/, '')

function assertR2Env() {
  const missing = []

  if (!R2_ACCESS_KEY_ID) missing.push('CLOUDFLARE_R2_ACCESS_KEY_ID')
  if (!R2_SECRET_ACCESS_KEY) missing.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
  if (!R2_BUCKET) missing.push('CLOUDFLARE_R2_BUCKET')
  if (!R2_ENDPOINT) missing.push('CLOUDFLARE_R2_ENDPOINT')
  if (!R2_PUBLIC_BASE_URL) missing.push('CLOUDFLARE_R2_PUBLIC_BASE_URL')

  if (missing.length) {
    throw new Error(`Missing Cloudflare R2 env: ${missing.join(', ')}`)
  }
}

export function getR2BucketName() {
  assertR2Env()
  return R2_BUCKET
}

export function getR2PublicBaseUrl() {
  assertR2Env()
  return R2_PUBLIC_BASE_URL
}

export function getR2PublicUrl(key) {
  assertR2Env()

  const cleanKey = String(key || '')
    .replace(/^\/+/, '')
    .trim()

  if (!cleanKey) {
    throw new Error('R2 object key is required')
  }

  return `${R2_PUBLIC_BASE_URL}/${cleanKey}`
}

let cachedClient = null

export function getR2Client() {
  assertR2Env()

  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  }

  return cachedClient
}

async function normalizeR2UploadBody(body) {
  if (!body) {
    throw new Error('R2 object body is required')
  }

  if (Buffer.isBuffer(body) || body instanceof Uint8Array || typeof body === 'string') {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body)
  }

  // Next.js/Undici File and Blob objects expose arrayBuffer().
  // Passing them directly to AWS SDK can be treated as a flowing stream and fail with:
  // "Unable to calculate hash for flowing readable stream".
  // Convert to Buffer before PutObject so R2 uploads are stable for ads/forum server uploads.
  if (typeof body.arrayBuffer === 'function') {
    const arrayBuffer = await body.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  return body
}

export async function putR2Object({
  key,
  body,
  contentType = 'application/octet-stream',
  cacheControl = 'public, max-age=31536000, immutable',
}) {
  assertR2Env()

  const cleanKey = String(key || '')
    .replace(/^\/+/, '')
    .trim()

  if (!cleanKey) {
    throw new Error('R2 object key is required')
  }

  const uploadBody = await normalizeR2UploadBody(body)

  const client = getR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
      Body: uploadBody,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  )

  return {
    key: cleanKey,
    url: getR2PublicUrl(cleanKey),
  }
}

export async function createR2PresignedPutUrl({
  key,
  contentType = 'application/octet-stream',
  expiresIn = 60 * 10,
  cacheControl = 'public, max-age=31536000, immutable',
}) {
  assertR2Env()

  const cleanKey = String(key || '')
    .replace(/^\/+/, '')
    .trim()

  if (!cleanKey) {
    throw new Error('R2 object key is required')
  }

  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: cleanKey,
    ContentType: contentType,
    CacheControl: cacheControl,
  })

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn,
  })

  return {
    key: cleanKey,
    uploadUrl,
    publicUrl: getR2PublicUrl(cleanKey),
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  }
}

export async function deleteR2Object(key) {
  assertR2Env()

  const cleanKey = String(key || '')
    .replace(/^\/+/, '')
    .trim()

  if (!cleanKey) {
    throw new Error('R2 object key is required')
  }

  const client = getR2Client()

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
    }),
  )

  return {
    key: cleanKey,
    deleted: true,
  }
}

export function isR2PublicUrl(url) {
  const value = String(url || '').trim()
  if (!value || !R2_PUBLIC_BASE_URL) return false

  return value.startsWith(`${R2_PUBLIC_BASE_URL}/`)
}

export function extractR2KeyFromPublicUrl(url) {
  const value = String(url || '').trim()
  if (!isR2PublicUrl(value)) return ''

  return value.slice(`${R2_PUBLIC_BASE_URL}/`.length)
}