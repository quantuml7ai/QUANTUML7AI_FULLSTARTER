import { NextResponse } from 'next/server'

const QUANTUM_SECURITY_VERSION = 'quantum-security-v1'
const QUANTUM_SECURITY_DEV_MODE = process.env.QUANTUM_SECURITY_DEV_MODE === '1'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const PROD_HIDDEN_API_PREFIXES = [
  '/api/_diag',
  '/api/debug',
]

const SERVER_TO_SERVER_WEBHOOK_PREFIXES = [
  '/api/pay/webhook',
  '/api/payments/now/webhook',
  '/api/qcoin/topup/webhook',
]

function startsWithPath(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/')
}

function isProdHiddenApi(pathname) {
  return PROD_HIDDEN_API_PREFIXES.some((prefix) => startsWithPath(pathname, prefix))
}

function isServerToServerWebhook(pathname) {
  return SERVER_TO_SERVER_WEBHOOK_PREFIXES.some((prefix) => startsWithPath(pathname, prefix))
}

function normalizeOrigin(value) {
  if (!value) return ''
  if (String(value).trim().toLowerCase() === 'null') return 'null'
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}`.toLowerCase()
  } catch {
    return ''
  }
}

function requestOrigin(req) {
  return normalizeOrigin(req.nextUrl.origin)
}

function isCrossOriginBrowserMutation(req) {
  const method = req.method.toUpperCase()
  const requestedMethod = (req.headers.get('access-control-request-method') || '').toUpperCase()
  const isPreflightForUnsafeMethod = method === 'OPTIONS' && UNSAFE_METHODS.has(requestedMethod)

  if (!UNSAFE_METHODS.has(method) && !isPreflightForUnsafeMethod) return false

  const rawOrigin = req.headers.get('origin') || ''
  const origin = normalizeOrigin(rawOrigin)
  const ownOrigin = requestOrigin(req)
  const secFetchSite = (req.headers.get('sec-fetch-site') || '').toLowerCase()

  if (origin === 'null') return true
  if (origin && ownOrigin && origin !== ownOrigin) return true
  if (secFetchSite === 'cross-site') return true

  // Treat same-site but not same-origin browser mutations as unsafe by default.
  // This blocks sibling-domain scripts while preserving normal same-origin app calls.
  if (secFetchSite === 'same-site' && (!origin || origin !== ownOrigin)) return true

  return false
}

function applyQuantumSecurityHeaders(res, req, blocked = false) {
  const pathname = req.nextUrl.pathname
  const api = isApiPath(pathname)

  res.headers.set('X-Quantum-Security', QUANTUM_SECURITY_DEV_MODE ? 'dev' : 'strict')
  res.headers.set('X-Quantum-Security-Version', QUANTUM_SECURITY_VERSION)
  res.headers.set('X-Quantum-Security-Dev-Mode', QUANTUM_SECURITY_DEV_MODE ? '1' : '0')
  res.headers.set('X-Quantum-Security-Cross-Origin-Mutation-Guard', QUANTUM_SECURITY_DEV_MODE ? '0' : '1')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.append('Vary', 'Origin')
  res.headers.append('Vary', 'Sec-Fetch-Site')

  if (api) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    res.headers.set('Cache-Control', 'no-store')
  }

  if (blocked) {
    res.headers.set('X-Quantum-Security-Blocked', '1')
  }

  return res
}

function quantumJson(req, body, status) {
  return applyQuantumSecurityHeaders(NextResponse.json(body, { status }), req, true)
}

export function middleware(req) {
  const pathname = req.nextUrl.pathname
  const api = isApiPath(pathname)

  if (!QUANTUM_SECURITY_DEV_MODE && api && isProdHiddenApi(pathname)) {
    return quantumJson(req, { ok: false, error: 'not_found' }, 404)
  }

  if (
    !QUANTUM_SECURITY_DEV_MODE &&
    api &&
    !isServerToServerWebhook(pathname) &&
    isCrossOriginBrowserMutation(req)
  ) {
    return quantumJson(req, { ok: false, error: 'quantum_security_cross_origin_mutation_blocked' }, 403)
  }

  return applyQuantumSecurityHeaders(NextResponse.next(), req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
