// app/api/forum/blobUploadUrl/route.js
import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'
import { isMediaLocked } from '../_db.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
export const runtime = 'nodejs'

// Разрешаем iPhone .mov и ставим лимит 300 МБ
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_SIZE = 300 * 1024 * 1024

export async function POST(req) {
  const t0 = Date.now()

  // Универсальный ответ с метаданными и таймингом
  const respond = (status, payload = {}) =>
    NextResponse.json(
      {
        ok: status >= 200 && status < 300,
        ...payload,
        timing_ms: Date.now() - t0,
      },
      { status, headers: { 'cache-control': 'no-store' } },
    )

  try {
    // 1) Попробуем разобрать JSON тела (клиент upload() шлёт filename/size/mime)
    let j = {}
    try {
      j = (await req.json()) || {}
    } catch {
      // не валим — handleUpload сам справится; но для логов вернём подробности
      j = {}
    }

    const headerId = req.headers.get('x-forum-user-id') || ''
    const bodyId =
      j?.userId ||
      j?.accountId ||
      j?.asherId ||
      j?.payload?.clientPayload?.userId ||
      j?.payload?.clientPayload?.accountId ||
      j?.payload?.clientPayload?.asherId
    const rawUserId = String(headerId || bodyId || '').trim()
    const userId = String((await resolveCanonicalAccountId(rawUserId).catch(() => '')) || rawUserId || '').trim()
    if (!userId) {
      return respond(401, { error: { code: 'missing_user_id', message: 'User id required' } })
    }
    const lock = await isMediaLocked(userId)
    if (lock.locked) {
      return respond(403, { error: { code: 'media_locked', message: 'Media upload locked', untilMs: lock.untilMs } })
    }

    // 2) RW-токен (обязателен для @vercel/blob/client)
    const token =
      process.env.FORUM_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return respond(500, {
        error: {
          code: 'missing_token',
          message:
            'FORUM_READ_WRITE_TOKEN is not set in the environment (dev/prod).',
          hint:
            'Добавь FORUM_READ_WRITE_TOKEN в .env.local (dev) и в Vercel → Project → Settings → Environment Variables.',
        },
      })
    }
 
    const mimeRaw = String(j?.mime || j?.contentType || '').trim()
    const mime = mimeRaw.split(';')[0].toLowerCase()
    const size = Number(j?.size || 0)

    // 3) Предвалидация (даём человеку ясную причину ещё до handleUpload)
    if (mime && !ALLOWED.includes(mime)) {
      return respond(415, {
        error: {
          code: 'bad_type',
          message: `Unsupported Content-Type: "${mimeRaw}"`,
          hint: `Разрешены: ${ALLOWED.join(', ')}`,
        },
        request_meta: { mime: mimeRaw, size },
      })
    }
    if (size && size > MAX_SIZE) {
      return respond(413, {
        error: {
          code: 'too_large',
          message: `File is too large: ${size} bytes`,
          hint: `Максимум: ${MAX_SIZE} bytes (300MB).`,
        },
        request_meta: { mime: mimeRaw, size },
      })
    }

    // 4) Основная магия — выдаём короткоживущий клиентский токен
    const res = await handleUpload({
      request: req,
      body: j, // можно передать пустой объект — handleUpload сам обработает
      token,
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => {
        // здесь можно проверять авторизацию/квоты и т.п.

        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: false,
          // хочешь фиксированный префикс в пути — раскомментируй:
          // pathnamePrefix: 'forum/',
          tokenPayload: JSON.stringify({ kind: 'forum_video' }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // post-hook — тут можно записать blob.url в БД, если надо
        console.log('forum video uploaded:', {
          url: blob?.url,
          size: blob?.size,
          type: blob?.contentType,
          tokenPayload,
        })
      },
    })

    // handleUpload вернёт { url, pathname, token, ... } — клиенту этого достаточно
    return respond(200, { ...res })
  } catch (e) {
    // 5) Детальный отчёт об ошибке
    const err = toErr(e)
    console.error('blobUploadUrl_failed', err)
    return respond(err.http || 500, {
      error: {
        code: err.code || 'server_error',
        message: err.message || 'Upload sign failed',
        // В debug — полезная техинфа, без секретов
        debug: {
          name: err.name,
          stack: err.stack?.split('\n').slice(0, 4).join('\n'),
        },
        hint:
          err.code === 'ERR_CONTENT_TYPE' ||
          err.message?.includes('Content-Type')
            ? `Проверь, что на клиенте передаёшь корректный MIME и filename c расширением (.mp4/.webm/.mov).`
            : err.code === 'MISSING_TOKEN'
            ? 'Проверь переменную FORUM_READ_WRITE_TOKEN в окружении.'
            : undefined,
      },
    })
  }
}

// аккуратный нормализатор ошибок
function toErr(e) {
  const x = e || {}
  return {
    name: x.name,
    message: String(x.message || ''),
    code:
      x.code ||
      (String(x.message || '').toLowerCase().includes('token')
        ? 'MISSING_TOKEN'
        : undefined),
    http: x.status || x.statusCode || undefined,
    stack: x.stack,
  }
}
