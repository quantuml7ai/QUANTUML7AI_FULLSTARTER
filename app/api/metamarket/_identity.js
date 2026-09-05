import { makeHttpError } from './_format.js'
import identityContract from '../../../lib/identity/ql7IdentityContract.cjs'

function readHeader(req, name) {
  try { return String(req?.headers?.get?.(name) || '').trim() } catch { return '' }
}

export async function resolveMetaMarketUserId(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const identity = await identityContract.resolve(value, {
    mode: 'metamarket-owner',
    source: 'app/api/metamarket/_identity.js',
  })
  if (identity.conflicted || identity.mutationAllowed === false) {
    const error = makeHttpError('identity_link_conflict', 409)
    error.internalCode = 'IDENTITY_LINK_CONFLICT'
    throw error
  }
  return String(identity.metamarketOwnerId || identity.canonicalAccountId || '').trim()
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
