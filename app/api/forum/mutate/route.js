// app/api/forum/mutate/route.js
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

// Нормализатор базовых полей
function baseFields({ id, userId, accountId, isAdmin, nickname, icon, ts }) {
  return {
    id,
    userId: userId || accountId || '',
    isAdmin: !!isAdmin,
    nickname: nickname || '',
    icon: icon || '',
    ts: Number(ts || Date.now()),
  }
}

// Защита от дубликатов: строим детерминированный hash ключа операции
function opDedupKey(op) {
  const { t, args = {} } = op || {}
  // ключ уникальности: тип + автор + текст + parentId + title
  const sig = JSON.stringify({
    t,
    userId: args.userId || args.accountId || '',
    title: (args.title || '').trim(),
    text:  (args.text  || '').trim(),
    parentId: args.parentId || '',
  })
  // очень короткий хэш (не крипто) — достаточно для антидублей 0.5-1с
  let h = 0
  for (let i = 0; i < sig.length; i++) {
    h = (h * 31 + sig.charCodeAt(i)) >>> 0
  }
  return `forum:dedup:${t}:${h}`
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const ops = Array.isArray(body.ops) ? body.ops : []
    const isAdmin = !!body.isAdmin

    if (ops.length === 0) {
      return json({ ok: true, applied: 0 })
    }

    const pipe = redis.pipeline()
    let queued = 0

    for (const raw of ops) {
      const { t, args = {} } = raw || {}
      if (!t) continue

      // Антидубликат — TTL 2 секунды. Если ключ уже есть, пропускаем.
      const dedupKey = opDedupKey(raw)
      pipe.set(dedupKey, '1', { ex: 2, nx: true })
      queued++

      // выполняем «условно»: если предыдущий SET был успешен
      // В upstash pipeline условного выполнения нет, поэтому делаем простой способ:
      // сначала поставим SET NX в отдельном заходе вне пайплайна.
    }

    // ВАЖНО: выполняем предварительный NX сет вне общего пайплайна,
    // чтобы знать, какие операции реально пойдут дальше
    // (иначе «pipeline is empty» или попытка провести все без фильтра).
    const runOps = []
    for (const raw of ops) {
      const ok = await redis.set(opDedupKey(raw), '1', { ex: 2, nx: true })
      if (ok === 'OK') runOps.push(raw)
    }

    // Теперь собираем настоящий пайплайн только из прошедших антидубликат
    const pipe2 = redis.pipeline()
    let applied = 0

    for (const raw of runOps) {
      const { t, args = {} } = raw

      if (t === 'create_topic') {
        const item = {
          ...baseFields(args),
          title: (args.title || '').trim().slice(0, 200),
          description: (args.description || '').trim().slice(0, 2000),
        }
        const member = JSON.stringify(item)
        pipe2.zadd(TOPICS_ZSET, { score: item.ts, member })
        // общий счётчик тем
        pipe2.hincrby(STATE_HASH, 'topicsTotal', 1)
        applied++
        continue
      }

      if (t === 'create_post') {
        const item = {
          ...baseFields(args),
          parentId: args.parentId || null, // если это ответ
          text: (args.text || '').toString().slice(0, 10000),
          // простая заготовка для реакций/просмотров
          reactions: args.reactions || {},
          views: Number(args.views || 0),
        }
        const member = JSON.stringify(item)
        pipe2.zadd(POSTS_ZSET, { score: item.ts, member })
        // счётчик сообщений
        pipe2.hincrby(STATE_HASH, 'postsTotal', 1)
        // счётчик сообщений в теме (если есть parent/topicId)
        if (item.parentId) {
          pipe2.hincrby(STATE_HASH, `topic:${item.parentId}:posts`, 1)
        }
        applied++
        continue
      }

      if (t === 'react' && args.id && args.emoji) {
        // Реакции агрегируем на общий хэш: forum:state => post:{id}:👍
        const field = `post:${args.id}:react:${args.emoji}`
        // delta = +1 / -1 / 0 (например, снять реакцию)
        const delta = Number(args.delta ?? 1)
        if (delta !== 0) pipe2.hincrby(STATE_HASH, field, delta)
        applied++
        continue
      }

      if (t === 'view_post' && args.id) {
        pipe2.hincrby(STATE_HASH, `post:${args.id}:views`, 1)
        applied++
        continue
      }

      if (t === 'view_topic' && args.id) {
        pipe2.hincrby(STATE_HASH, `topic:${args.id}:views`, 1)
        applied++
        continue
      }

      // другие типы операций можно добавить по аналогии
    }

    if (applied === 0) {
      return json({ ok: true, applied: 0 })
    }

    await pipe2.exec()
    return json({ ok: true, applied })
  } catch (e) {
    console.error('mutate error:', e)
    return bad(e, 500)
  }
}
