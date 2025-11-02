// app/api/forum/blobUploadUrl/route.js
import { NextResponse } from 'next/server'
import { generateUploadURL } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(req) {
  const t0 = process.hrtime.bigint()
  const urlObj = new URL(req.url)
  const debug = urlObj.searchParams.get('debug') === '1'

  const hdr = Object.fromEntries(req.headers.entries())
  const clientInfo = {
    ip: hdr['x-real-ip'] || hdr['x-forwarded-for'] || 'unknown',
    ua: hdr['user-agent'] || 'unknown',
  }

  const respond = (status, payload) => {
    const t1 = process.hrtime.bigint()
    const ms = Number(t1 - t0) / 1e6
    const body = {
      ok: status >= 200 && status < 300,
      ...payload,
      timing_ms: Math.round(ms),
    }
    return NextResponse.json(body, {
      status,
      headers: { 'cache-control': 'no-store' },
    })
  }

  try {
    // 1) Метод
    if (req.method !== 'POST') {
      const code = 'method_not_allowed'
      console.warn('[blobUploadUrl]', code, { method: req.method, clientInfo })
      return respond(405, { error: { code, message: 'Use POST' } })
    }

    // 2) Токен
    const token = process.env.FORUM_READ_WRITE_TOKEN
    if (!token) {
      const code = 'missing_token'
      console.error('[blobUploadUrl]', code, { clientInfo })
      return respond(500, {
        error: {
          code,
          message: 'FORUM_READ_WRITE_TOKEN is not set',
          hint: 'Добавь RW токен в переменные окружения проекта',
        },
      })
    }

    // 3) Тело и MIME
    let mimeRaw = ''
    try {
      const json = await req.json()
      mimeRaw = String(json?.mime || '')
    } catch (e) {
      const code = 'bad_json'
      console.error('[blobUploadUrl]', code, { e, clientInfo })
      return respond(400, {
        error: { code, message: 'Invalid JSON body', hint: 'Ожидается { "mime": "video/mp4|webm|quicktime" }' },
      })
    }

    const mime = mimeRaw.split(';')[0].trim() // убираем ;codecs=...
    const isVideo = /^video\/(mp4|webm|quicktime)$/i.test(mime)
    const finalMime = isVideo ? mime : 'video/webm'

    // 4) Имя и расширение
    const ext =
      finalMime.includes('mp4') ? 'mp4' :
      finalMime.includes('quicktime') ? 'mov' : 'webm'
    const pathname = `forum/video-${Date.now()}.${ext}`

    // 5) Сигним урл
    let signed
    try {
      signed = await generateUploadURL({
        pathname,
        access: 'public',
        allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        maximumSizeInBytes: 300 * 1024 * 1024, // 300 МБ
        token,
      })
    } catch (e) {
      // Часто тут бывают ошибки из Blob API. Логируем всё, но наружу даём понятный код.
      const code = 'sign_error'
      console.error('[blobUploadUrl]', code, {
        clientInfo,
        input: { mime: mimeRaw, normalized: finalMime, ext, pathname },
        errName: e?.name,
        errCode: e?.code,
        errMsg: e?.message,
        stack: debug ? e?.stack : undefined,
      })
      return respond(500, {
        error: {
          code,
          message: 'Failed to generate upload URL',
          hint: 'Проверь Blob Storage в проекте и права RW-токена',
          details: { errName: e?.name, errCode: e?.code, errMsg: e?.message },
        },
        debug: debug ? { stack: e?.stack } : undefined,
      })
    }

    const mode = signed?.fields ? 'post' : 'put'

    // 6) Успех
    console.log('[blobUploadUrl] ok', {
      clientInfo,
      input: { mime: mimeRaw, normalized: finalMime },
      out: { ext, pathname, mode },
    })

    return respond(200, {
      url: signed.url,
      fields: signed.fields || null,
      pathname,
      mode,
    })
  } catch (e) {
    const code = 'server_error'
    console.error('[blobUploadUrl]', code, {
      clientInfo,
      errName: e?.name,
      errCode: e?.code,
      errMsg: e?.message,
      stack: debug ? e?.stack : undefined,
    })
    return respond(500, {
      error: { code, message: 'Unexpected server error' },
      debug: debug ? { stack: e?.stack } : undefined,
    })
  }
}
