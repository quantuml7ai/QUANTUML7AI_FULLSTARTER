import { NextResponse } from 'next/server'

const OG_QUERY_KEY = '__ogv'
const STATIC_FILE_RE =
  /\.(?:avif|bmp|css|gif|ico|jpe?g|js|json|map|mp3|mp4|png|svg|txt|webm|webp|woff2?|xml)$/i
const SOCIAL_BOT_UA_RE =
  /TelegramBot|Twitterbot|facebookexternalhit|Facebot|LinkedInBot|Slackbot-LinkExpanding|Discordbot|WhatsApp|Viber|SkypeUriPreview|Pinterest|VKShare|bitlybot|redditbot/i

const RAW_OG_VERSION =
  process.env.NEXT_PUBLIC_META_VERSION ||
  process.env.NEXT_PUBLIC_OG_VERSION ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.npm_package_version ||
  '1'

const OG_VERSION = String(RAW_OG_VERSION || '1').trim().slice(0, 80) || '1'

function shouldBypass(pathname) {
  const path = String(pathname || '')
  if (!path) return true
  if (path.startsWith('/_next/')) return true
  if (path.startsWith('/api/')) return true
  if (path.startsWith('/metab/')) return true
  if (path.startsWith('/branding/')) return true
  if (path.startsWith('/audio/')) return true
  if (path.startsWith('/uploads/')) return true
  if (path.startsWith('/friends/')) return true
  if (path === '/robots.txt') return true
  if (path === '/sitemap.xml') return true
  if (path === '/favicon.ico') return true
  return STATIC_FILE_RE.test(path)
}

export function middleware(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return NextResponse.next()
  }

  const userAgent = req.headers.get('user-agent') || ''
  if (!SOCIAL_BOT_UA_RE.test(userAgent)) {
    return NextResponse.next()
  }

  const url = req.nextUrl
  if (shouldBypass(url.pathname)) {
    return NextResponse.next()
  }

  if (url.searchParams.get(OG_QUERY_KEY) === OG_VERSION) {
    return NextResponse.next()
  }

  const redirectUrl = url.clone()
  redirectUrl.searchParams.set(OG_QUERY_KEY, OG_VERSION)
  return NextResponse.redirect(redirectUrl, 307)
}

export const config = {
  matcher: '/:path*',
}
