// app/api/forum/snapshot/route.js
import { json, bad } from '../_utils.js'
import { redis } from '../_db.js'

// Конфиг Next route (без 'use server')
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Ключи по умолчанию
const TOPICS_ZSET = 'forum:topics'
const POSTS_ZSET  = 'forum:posts'
const STATE_HASH  = 'forum:state'

// Безопасный парсер
function safeParse(x) {
  try { return JSON.parse(x) } catch(_) { return null }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    // since — timestamp миллисекунд; если задан, отдаем только новые элементы
    const since = Number(searchParams.get('since') || 0)

    // получаем свежие топики/посты по убыванию времени (score = ts)
    // Upstash v1: zrange(key, start, stop, { rev:true }) — здесь берём 0..199 по ревёрсу
    const [topicRows, postRows, state] = await Promise.all([
      redis.zrange(TOPICS_ZSET, 0, 199, { rev: true }),
      redis.zrange(POSTS_ZSET,  0, 499, { rev: true }),
      redis.hgetall(STATE_HASH).catch(() => ({})),
    ])

    // JSON → объекты
    let topics = (topicRows || []).map(safeParse).filter(Boolean)
    let posts  = (postRows  || []).map(safeParse).filter(Boolean)

    // Фильтрация по since, если задан
    if (since > 0) {
      topics = topics.filter(t => Number(t?.ts || 0) > since)
      posts  = posts.filter (p => Number(p?.ts || 0) > since)
    }

    // Последняя метка времени, пригодится клиенту
    const lastTs = Math.max(
      0,
      ...topics.map(t => Number(t.ts || 0)),
      ...posts.map(p => Number(p.ts || 0))
    )

    return json({
      ok: true,
      topics,
      posts,
      state: state || {},
      lastTs,
    })
  } catch (e) {
    console.error('snapshot error:', e)
    return bad(e, 500)
  }
}
