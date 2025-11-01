// app/api/forum/blob-upload/route.js

import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'

export const runtime = 'nodejs'

// Разрешённые типы (iOS MOV, MP4, WEBM, редкий 3GPP)
const ALLOWED = ['video/webm', 'video/mp4', 'video/quicktime', 'video/3gpp', 'audio/mpeg', 'audio/mp4', 'audio/aac']

export async function POST(request) {
  try {
    const body = await request.json()
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => {
        return {
          // Разрешаем только наши форматы
          allowedContentTypes: ALLOWED,
          addRandomSuffix: true,              // чтобы имена не коллидировали
          tokenPayload: JSON.stringify({      // при желании передай userId и т.п.
            kind: 'forum_video',
          }),
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
