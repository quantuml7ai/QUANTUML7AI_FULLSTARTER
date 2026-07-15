// app/api/dm/_db.js
import { now, toStr, parseIntSafe } from './_utils.js'
import dmPrimary from '../../../lib/mongo/dm-primary.cjs'

const str = (x) => String(x ?? '').trim()

export async function nextMsgId() {
  return String(await dmPrimary.nextMsgId())
}

export async function saveMessage(msg) {
  const id = str(msg?.id)
  if (!id) throw new Error('bad_id')
  await dmPrimary.saveMessage(msg)
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
      out.push(type ? { url, type } : { url })
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
  }
}
