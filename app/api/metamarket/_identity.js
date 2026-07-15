import { resolveCanonicalAccountId } from '../profile/_identity.js'
import { makeHttpError } from './_format.js'

function readHeader(req, name) {
  try { return String(req?.headers?.get?.(name) || '').trim() } catch { return '' }
}

export async function resolveMetaMarketUserId(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  return String(await resolveCanonicalAccountId(value) || '').trim()
}

export async function requireMetaMarketUser(req, body = {}) {
  const raw =
    readHeader(req, 'x-forum-user-id') ||
    readHeader(req, 'x-forum-user') ||
    readHeader(req, 'x-auth-account-id') ||
    String(body?.viewerId || body?.userId || body?.accountId || '').trim()
  if (!raw) throw makeHttpError('missing_user_id', 401)
  const userId = await resolveMetaMarketUserId(raw)
  if (!userId) throw makeHttpError('unauthorized', 401)
  return { userId, rawUserId: raw }
}

export async function resolveRecipientId(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  return resolveMetaMarketUserId(value)
}
