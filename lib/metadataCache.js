import fs from 'fs'
import path from 'path'

const RAW_META_VERSION =
  process.env.NEXT_PUBLIC_META_VERSION ||
  process.env.NEXT_PUBLIC_OG_VERSION ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.npm_package_version ||
  '1'

const PUBLIC_ROOT = path.join(process.cwd(), 'public')
const VERSION_PARAM = 'v'
const assetVersionCache = new Map()

function normalizeVersion(value, fallback = '1') {
  const out = String(value || '').trim().slice(0, 80)
  return out || fallback
}

function normalizePublicPath(assetPath) {
  const raw = String(assetPath || '').trim()
  if (!raw || /^https?:\/\//i.test(raw)) return ''
  return raw.startsWith('/') ? raw.slice(1) : raw
}

function getAssetVersionFromFs(assetPath) {
  const relPath = normalizePublicPath(assetPath)
  if (!relPath) return ''
  if (assetVersionCache.has(relPath)) return assetVersionCache.get(relPath)
  let value = ''
  try {
    const stat = fs.statSync(path.join(PUBLIC_ROOT, relPath))
    if (stat.isFile()) {
      value = Math.floor(stat.mtimeMs).toString(36)
    }
  } catch {}
  assetVersionCache.set(relPath, value)
  return value
}

export const META_VERSION = normalizeVersion(RAW_META_VERSION)

export function withQueryParam(rawUrl, key, value) {
  const url = String(rawUrl || '').trim()
  const paramKey = String(key || '').trim()
  const paramValue = String(value || '').trim()
  if (!url || !paramKey || !paramValue) return url

  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''

  const queryIndex = beforeHash.indexOf('?')
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash
  const queryString = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : ''

  const params = new URLSearchParams(queryString)
  params.set(paramKey, paramValue)
  const nextQuery = params.toString()
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`
}

export function withMetaVersion(rawUrl, version = META_VERSION) {
  return withQueryParam(rawUrl, VERSION_PARAM, normalizeVersion(version, META_VERSION))
}

export function withAssetVersion(assetPath, fallbackVersion = META_VERSION) {
  const autoVersion = getAssetVersionFromFs(assetPath)
  const version = normalizeVersion(autoVersion || fallbackVersion, META_VERSION)
  return withMetaVersion(assetPath, version)
}

export function buildMetaVersionToken(...parts) {
  const items = parts
    .map((x) => String(x || '').trim().slice(0, 80))
    .filter(Boolean)
  return normalizeVersion(items.join('-'), META_VERSION)
}
