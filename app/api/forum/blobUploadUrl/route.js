import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const token = process.env.FORUM_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json(
        { ok: false, error: { code: 'missing_token', message: 'FORUM_READ_WRITE_TOKEN is not set' } },
        { status: 500, headers: { 'cache-control': 'no-store' } }
      )
    }

    const body = await request.json().catch(() => ({}))

    const res = await handleUpload({
      request,
      body,
      token, // критично
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        maximumSizeInBytes: 300 * 1024 * 1024,
        addRandomSuffix: false,
        tokenPayload: JSON.stringify({ kind: 'forum_video' }),
        // pathnamePrefix: 'forum/', // опционально, если хочешь префикс
      }),
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('forum video uploaded:', blob.url, tokenPayload)
      },
    })

    return NextResponse.json({ ok: true, ...res }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('blobUploadUrl_failed', e)
    return NextResponse.json(
      { ok: false, error: { code: 'server_error', message: e?.message || 'failed' } },
      { status: 500, headers: { 'cache-control': 'no-store' } }
    )
  }
}
