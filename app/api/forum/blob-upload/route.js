// app/api/forum/blob-upload/route.js

import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'   // на всякий: отключаем кеширование роутинга

// Разрешаем видео/аудио масками — чтобы прошли варианты с параметрами (e.g. "video/webm;codecs=vp9")
const ALLOWED_MASKS = ['video/*', 'audio/*']
 
export async function POST(request) {
  try {
    const body = await request.json()
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => {
        return {
          // Маски вместо точных строк (Android часто шлёт "video/webm;codecs=vp8/vp9")
          allowedContentTypes: ALLOWED_MASKS,
          addRandomSuffix: true,              // чтобы имена не коллидировали
          tokenPayload: JSON.stringify({      // при желании передай userId и т.п.
            kind: 'forum_video',
          }),
         // при желании можно ограничить размер (в байтах), иначе — без лимита со стороны нашего роута
          maximumSize: 2_000_000, // пример: 200 МБ 
        }
      },
      // колбэк прилетает от Vercel после успешной загрузки
      onUploadCompleted: async ({ blob /*, tokenPayload */ }) => {
        // тут можно записать blob.url в БД/лог, если надо
        console.log('forum video uploaded:', blob.url, blob.pathname, blob.size, blob.contentType)
      },
    })
    return NextResponse.json(json, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}
