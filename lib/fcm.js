import { createSign } from 'node:crypto'

const TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token'
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
let cachedAccessToken = null

function base64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function firebaseCredentials() {
  const projectId = String(process.env.FCM_PROJECT_ID || '').trim()
  const clientEmail = String(process.env.FCM_CLIENT_EMAIL || '').trim()
  const privateKey = String(process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim()
  return projectId && clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null
}

export function isFcmConfigured() {
  return Boolean(firebaseCredentials())
}

async function accessToken() {
  const credentials = firebaseCredentials()
  if (!credentials) throw new Error('fcm_not_configured')
  if (cachedAccessToken?.value && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64Url(JSON.stringify({
    iss: credentials.clientEmail,
    scope: FCM_SCOPE,
    aud: TOKEN_AUDIENCE,
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${claims}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const assertion = `${unsigned}.${signer.sign(credentials.privateKey, 'base64url')}`

  const response = await fetch(TOKEN_AUDIENCE, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload?.access_token) throw new Error(`fcm_token_failed:${response.status}`)
  cachedAccessToken = {
    value: String(payload.access_token),
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 3600)) * 1000,
  }
  return cachedAccessToken.value
}

export async function sendFcmMessage(message) {
  const credentials = firebaseCredentials()
  if (!credentials) return { ok: false, disabled: true }
  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(credentials.projectId)}/messages:send`
  const request = async (token) => fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message }),
    cache: 'no-store',
  })
  let response = await request(await accessToken())
  if (response.status === 401) {
    cachedAccessToken = null
    response = await request(await accessToken())
  }
  const payload = await response.json().catch(() => ({}))
  const errorCodes = Array.isArray(payload?.error?.details)
    ? payload.error.details.map((entry) => String(entry?.errorCode || ''))
    : []
  return {
    ok: response.ok,
    status: response.status,
    payload,
    invalidToken: response.status === 404 ||
      errorCodes.includes('UNREGISTERED'),
  }
}
