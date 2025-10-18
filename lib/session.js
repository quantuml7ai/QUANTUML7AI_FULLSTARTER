// lib/session.js
import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'ql7_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 дней

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}
function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url')
}

export function createSessionToken(payload) {
  const secret = process.env.SESSION_SECRET || 'dev_only_secret'
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000) }))
  const unsigned = `${header}.${body}`
  const signature = sign(unsigned, secret)
  return `${unsigned}.${signature}`
}

export function verifySessionToken(token) {
  const secret = process.env.SESSION_SECRET || 'dev_only_secret'
  const [h, b, sig] = String(token || '').split('.')
  if (!h || !b || !sig) return null
  const check = sign(`${h}.${b}`, secret)
  if (check !== sig) return null
  try {
    return JSON.parse(Buffer.from(b, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export function createSessionCookie(res, payload) {
  const token = createSessionToken(payload)
  const oneMonth = MAX_AGE_SECONDS
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // чтобы работало в WebView (iOS) и вообще в iframes
    maxAge: oneMonth,
    path: '/',
  })
}

export function readSession() {
  try {
    const jar = cookies()
    const token = jar.get(COOKIE_NAME)?.value
    return token ? verifySessionToken(token) : null
  } catch { return null }
}

export function destroySessionCookie(res) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly:true, secure:true, sameSite:'none', maxAge:0, path:'/' })
}
