 // app/api/forum/uploadAudio/route.js
 import { NextResponse } from 'next/server'
 import { put } from '@vercel/blob'
 import { isMediaLocked } from '../_db.js'
 import { resolveCanonicalAccountId } from '../../profile/_identity.js'
 export const runtime = 'nodejs'
  const ALLOWED_MIME = /^(audio\/webm|audio\/mpeg|audio\/mp4|audio\/wav)$/i
 const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
 
 export async function POST(req) {
   try {
     const form = await req.formData()
     const headerId = req.headers.get('x-forum-user-id')
     const formId = form.get('userId') || form.get('accountId') || form.get('asherId')
     const rawUserId = String(headerId || formId || '').trim()
     const userId = String((await resolveCanonicalAccountId(rawUserId).catch(() => '')) || rawUserId || '').trim()
     if (!userId) {
       return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401, headers: { 'cache-control': 'no-store' } })
     }
     const lock = await isMediaLocked(userId)
     if (lock.locked) {
       return NextResponse.json({ ok: false, error: 'media_locked', untilMs: lock.untilMs }, { status: 403, headers: { 'cache-control': 'no-store' } })
     }

     const f = form.get('file')
     if (!f) return NextResponse.json({ urls: [], errors: ['no_file'] }, { status: 400, headers:{'cache-control':'no-store'} })
 
     const buf = Buffer.from(await f.arrayBuffer())
     if (!ALLOWED_MIME.test(f.type||'')) {
       return NextResponse.json({ urls: [], errors: ['bad_type'] }, { status: 415, headers:{'cache-control':'no-store'} })
     }
     if (buf.length > MAX_SIZE_BYTES) {
       return NextResponse.json({ urls: [], errors: ['too_large'] }, { status: 413, headers:{'cache-control':'no-store'} })
     }
 
     const ext = (f.type||'audio/webm').includes('mpeg') ? 'mp3'
             : (f.type||'').includes('mp4') ? 'm4a'
             : (f.type||'').includes('wav') ? 'wav'
             : 'webm'
     const key = `forum/voice-${Date.now()}.${ext}`
     const { url } = await put(key, buf, {
       access: 'public',
       contentType: f.type || 'audio/webm',
       token: process.env.FORUM_READ_WRITE_TOKEN,
     })
     return NextResponse.json({ urls:[url], errors:[] }, { headers:{'cache-control':'no-store'} })
   } catch (e) {
     console.error('upload_audio_failed', e)
     return NextResponse.json({ urls: [], errors: ['upload_failed'] }, { status: 500 })
   }
 }
