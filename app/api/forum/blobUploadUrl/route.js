// app/api/forum/blobUploadUrl/route.js

import { NextResponse } from 'next/server'
import { generateUploadURL } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { mime } = await req.json().catch(() => ({}))
    if (!/^video\/(mp4|webm|quicktime)$/i.test(String(mime || ''))) {
      return NextResponse.json({ error: 'bad_type' }, { status: 415 })
    }

    // расширение фиксируем из MIME → URL будет .mp4/.webm/.mov
    const ext = mime.includes('mp4') ? 'mp4' : (mime.includes('quicktime') ? 'mov' : 'webm')
    const pathname = `forum/video-${Date.now()}.${ext}`

    const { url, fields } = await generateUploadURL({
      pathname,                                     // видеопрефикс + расширение
      allowedContentTypes: ['video/mp4','video/webm','video/quicktime'],
      maximumSizeInBytes: 300 * 1024 * 1024,        // лимит 300 МБ
      access: 'public',
      token: process.env.FORUM_READ_WRITE_TOKEN,     // твой токен, как в uploadVideo
    })

    return NextResponse.json({ url, fields, pathname }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('blobUploadUrl_failed', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
