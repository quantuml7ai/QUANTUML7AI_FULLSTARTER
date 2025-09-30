import { json, bad } from '../_utils.js'
import { snapshot } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// --- MICROCACHE 1.5–2s + дедупликация
const TTL_MS = 2000
let cache = { key: '', ts: 0, payload: null }
const inflight = new Map()
const makeKey = (since) => `since=${Number(since) || 0}`

export async function GET(request) {
  const url = new URL(request.url)
  const since = parseInt(url.searchParams.get('since') || '0', 10) || 0
  const key = makeKey(since)
  const now = Date.now()

  // 1) свежий кэш
  if (cache.payload && cache.key === key && (now - cache.ts) < TTL_MS) {
    return json(cache.payload)
  }

  // 2) дедупликация
  let p = inflight.get(key)
  if (!p) {
    p = (async () => {
      try {
        const res = await snapshot(since)
        if (res?.ok) {
          cache = { key, ts: Date.now(), payload: res }
        }
        return res
      } catch (err) {
        // === КРИТИЧНО: если выбился лимит, отдаём последний кэш (если он есть),
        // чтобы не превращать клиентов в «молоток» и не плодить ретраи
        const msg = String(err?.message || err)
        const isQuota =
          msg.includes('max requests limit exceeded') ||
          msg.includes('ERR max requests limit exceeded')

        if (isQuota && cache.payload) return cache.payload
        throw err
      } finally {
        inflight.delete(key)
      }
    })()
    inflight.set(key, p)
  }

  try {
    const res = await p
    return json(res)
  } catch (err) {
    console.error('snapshot error', err)
    return bad('internal_error', 500)
  }
}
