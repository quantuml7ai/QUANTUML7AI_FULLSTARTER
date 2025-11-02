import { NextResponse } from 'next/server'
import * as blob from '@vercel/blob' // берём всё, чтобы проверить доступные функции

export const runtime = 'nodejs'

export async function POST(req) {
  const t0 = Date.now()
  const respond = (status, payload) =>
    NextResponse.json(
      { ok: status >= 200 && status < 300, ...payload, timing_ms: Date.now() - t0 },
      { status, headers: { 'cache-control': 'no-store' } }
    )

  try {
    // 1) тело и MIME (срезаем ;codecs=...)
    let mimeRaw = ''
    try {
      const j = await req.json()
      mimeRaw = String(j?.mime || '')
    } catch {
      return respond(400, {
        error: { code: 'bad_json', message: 'Invalid JSON body', hint: 'ожидается { "mime": "video/mp4|webm|quicktime" }' }
      })
    }
    const m = mimeRaw.split(';')[0].trim()
    const isVideo = /^video\/(mp4|webm|quicktime)$/i.test(m)
    const finalMime = isVideo ? m : 'video/webm'

    // 2) расширение и имя файла (для распознавания на клиенте)
    const ext = finalMime.includes('mp4') ? 'mp4' : (finalMime.includes('quicktime') ? 'mov' : 'webm')
    const pathname = `forum/video-${Date.now()}.${ext}`

    // 3) токен
    const token = process.env.FORUM_READ_WRITE_TOKEN
    if (!token) {
      return respond(500, {
        error: { code: 'missing_token', message: 'FORUM_READ_WRITE_TOKEN is not set' }
      })
    }

    // 4) выбираем актуальную функцию из @vercel/blob
    const generateUploadURL =
      (typeof blob.generateUploadURL === 'function' && blob.generateUploadURL) ||
      (typeof blob.generateUploadUrl === 'function' && blob.generateUploadUrl) ||
      null

    if (!generateUploadURL) {
      // В этой версии пакета нет нужной функции — подскажем явно
      return respond(500, {
        error: {
          code: 'no_generate_fn',
          message: 'Your @vercel/blob version does not export generateUploadURL/Url',
          hint: 'Обнови @vercel/blob или используй эту же функцию с именем generateUploadUrl (lowercase L)'
        },
        debug: {
          exports: Object.keys(blob || {})
        }
      })
    }

    // 5) пробуем подписать; ловим и отдаём разжёванную ошибку
    let signed
    try {
      signed = await generateUploadURL({
        pathname,
        access: 'public',
        allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        maximumSizeInBytes: 300 * 1024 * 1024,
        token
      })
    } catch (e) {
      return respond(500, {
        error: {
          code: 'sign_error',
          message: 'Failed to generate upload URL',
          details: { name: e?.name, code: e?.code, msg: e?.message }
        },
        debug: {
          usedFn: generateUploadURL === blob.generateUploadURL ? 'generateUploadURL' : 'generateUploadUrl',
          input: { mime: mimeRaw, normalized: finalMime, ext, pathname }
        }
      })
    }

    const mode = signed?.fields ? 'post' : 'put'
    return respond(200, {
      url: signed.url,
      fields: signed.fields || null,
      pathname,
      mode
    })
  } catch (e) {
    return respond(500, {
      error: { code: 'server_error', message: 'Unexpected server error', details: { name: e?.name, msg: e?.message } }
    })
  }
}
