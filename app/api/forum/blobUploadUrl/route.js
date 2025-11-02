import { NextResponse } from 'next/server'
import { generateUploadURL } from '@vercel/blob'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const { mime } = await req.json().catch(() => ({}))
    const m = String(mime || '').split(';')[0].trim() // "video/webm" без параметров
    const ok = /^video\/(mp4|webm|quicktime)$/i.test(m)
    const finalMime = ok ? m : 'video/webm'

    const ext =
      finalMime.includes('mp4') ? 'mp4' :
      finalMime.includes('quicktime') ? 'mov' : 'webm'

    const pathname = `forum/video-${Date.now()}.${ext}`

    const { url, fields } = await generateUploadURL({
      pathname,
      allowedContentTypes: ['video/mp4','video/webm','video/quicktime'],
      maximumSizeInBytes: 300 * 1024 * 1024,
      access: 'public',
      token: process.env.FORUM_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url, fields, pathname }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('blobUploadUrl_failed', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
