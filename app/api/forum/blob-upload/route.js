// app/api/forum/blob-upload/route.js
import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // не кэшируем

// Разрешаем видео/аудио (включая варианты с параметрами кодеков)
const ALLOWED_MASKS = ['video/*', 'audio/*']

export async function POST(request) {
  try {
    const body = await request.json() // upload() шлёт JSON
    const json = await handleUpload({
      body,
      request,
      // КРИТИЧЕСКОЕ: используем твой токен окружения
      token: process.env.FORUM_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_MASKS,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ kind: 'forum_video' }),
        // maximumSize: 2_000_000_000, // (опционально) лимит в байтах, если захочешь
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('[forum] video uploaded:', blob.url, blob.size, blob.contentType)
      },
    })

    return NextResponse.json(json, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    const msg = String(e?.message || e || 'upload_failed')
    const hint = !process.env.FORUM_READ_WRITE_TOKEN ? 'NO_FORUM_READ_WRITE_TOKEN' : undefined
    return NextResponse.json({ error: msg, hint }, { status: 400 })
  }
}
