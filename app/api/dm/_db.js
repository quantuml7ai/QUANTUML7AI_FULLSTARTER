// app/api/dm/_db.js
import { now, toStr, parseIntSafe } from './_utils.js'
import dmPrimary from '../../../lib/mongo/dm-primary.cjs'
import { isR2PublicUrl } from '../../../lib/storage/r2.js'

const str = (x) => String(x ?? '').trim()

export async function nextMsgId(options = {}) {
  return String(await dmPrimary.nextMsgId(options))
}

export async function saveMessage(msg, options = {}) {
  const id = str(msg?.id)
  if (!id) throw new Error('bad_id')
  await dmPrimary.saveMessage(msg, options)
  return msg
}

export async function getMessage(id) {
  return dmPrimary.getMessage(id)
}

export async function addAliasPair(a, b) {
  return dmPrimary.addAliasPair(a, b)
}

export async function addAliasesFor(primary, aliases = []) {
  return dmPrimary.addAliasesFor(primary, aliases)
}

export async function expandAliasIds(ids = []) {
  return dmPrimary.expandAliasIds(ids)
}

export function normalizeAttachments(list) {
  const arr = Array.isArray(list) ? list : []
  const out = []
  for (const it of arr) {
    if (!it) continue
    if (typeof it === 'string') {
      const url = str(it)
      if (url) out.push(url)
      continue
    }
    if (typeof it === 'object') {
      const url = str(it.url || it.src || it.href || it.file || '')
      if (!url) continue
      const type = str(it.type || it.mime || it.mediaType || it.kind || '')
      const entry = type ? { url, type } : { url }
      const isVideo = /video/i.test(type) || /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(url)
      if (isVideo) {
        const posterUrl = str(it.posterUrl || it.poster || '')
        if (isR2PublicUrl(posterUrl) && /\.(?:webp|jpe?g)(?:[?#].*)?$/i.test(posterUrl)) entry.posterUrl = posterUrl
        const facingMode = str(it.cameraFacingMode || it.facingMode || '').toLowerCase()
        const frontCameraMirror = !!(
          it.frontCameraMirror ||
          it.mirrorVideo ||
          facingMode === 'user' ||
          facingMode === 'front'
        )
        if (frontCameraMirror) {
          entry.cameraFacingMode = 'user'
          entry.frontCameraMirror = true
          entry.mirrorVideo = true
        }
        // New ordinary-DM video messages are always born pending on the server.
        // The client cannot self-assert an approved moderation state.
        entry.moderationStatus = 'pending'
      }
      out.push(entry)
    }
  }
  return out
}

export function normalizeMessage(raw) {
  const m = raw || {}
  return {
    id: str(m.id),
    from: str(m.from),
    to: str(m.to),
    text: toStr(m.text || ''),
    attachments: normalizeAttachments(m.attachments),
    ts: parseIntSafe(m.ts, now()),
    composerPolicyDecisionId: str(m.composerPolicyDecisionId),
    composerPolicyActorHash: str(m.composerPolicyActorHash),
    composerPolicyIntentHash: str(m.composerPolicyIntentHash),
  }
}
