// app/forum/p/[postId]/route.js
// OG/Twitter preview + human redirect entrypoint.

import { createHash } from 'crypto'
import { redis, K, safeParse } from '../../../api/forum/_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toPlainText(raw) {
  const s0 = String(raw || '')
  if (!s0) return ''
  const s1 = s0
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
  return s1
    // remove urls and storage details from meta text (keep only meaningful body text)
    .replace(/\b(?:https?:\/\/|blob:|tg:\/\/|viber:\/\/|whatsapp:\/\/)[^\s<>'")]+/gi, ' ')
    .replace(/\/uploads\/[A-Za-z0-9._\-\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateOnWord(s, maxLen = 220) {
  const text = String(s || '').trim()
  const lim = Math.max(60, Math.min(320, Number(maxLen) || 220))
  if (text.length <= lim) return text
  const cut = text.slice(0, lim)
  const lastSpace = cut.lastIndexOf(' ')
  const out = (lastSpace >= 40 ? cut.slice(0, lastSpace) : cut).trim()
  return out ? `${out}…` : `${cut.trim()}…`
}

function extractPreviewImageUrl(text) {
  const s = String(text || '')
  if (!s) return ''
  const re =
    /(?:https?:\/\/[^\s<>'")]+?\.(?:webp|png|jpe?g|gif)(?:[?#][^\s<>'")]+)?|\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)(?:[?#][^\s<>'")]+)?)/i
  const m = s.match(re)
  return m ? String(m[0] || '').trim() : ''
}

function extractYouTubeId(text) {
  const s = String(text || '')
  if (!s) return ''
  const m = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i)
  return m ? String(m[1] || '').trim() : ''
}

function extractUrlsFromText(text) {
  const s = String(text || '')
  if (!s) return []
  const out = []
  const re = /\bhttps?:\/\/[^\s<>'")]+/gi
  let m
  while ((m = re.exec(s))) {
    const u = String(m[0] || '').trim()
    if (u) out.push(u)
  }
  return out
}

function isImageUrl(url) {
  const s = String(url || '').toLowerCase()
  return /\.(webp|png|jpe?g|gif)(?:[?#]|$)/i.test(s)
}

function isVideoUrl(url) {
  const s = String(url || '').toLowerCase()
  return /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(s)
}

function isAudioUrl(url) {
  const s = String(url || '').toLowerCase()
  if (s.includes('/forum/voice-')) return true
  return /\.(mp3|m4a|wav|ogg|opus)(?:[?#]|$)/i.test(s)
}

function pickCandidatesFromPost(post, combinedText) {
  const out = { image: '', video: '', audio: '', poster: '' }
  if (!post) return out

  // attachments/media lists
  const lists = []
  if (Array.isArray(post?.attachments)) lists.push(post.attachments)
  if (Array.isArray(post?.files)) lists.push(post.files)
  const mediaList = lists.flat().filter(Boolean)
  for (const a of mediaList) {
    const url = String(a?.url || a?.src || a?.href || a?.file || '').trim()
    const typeHint = String(a?.type || a?.mime || a?.mediaType || '').toLowerCase()
    if (!url) continue
    if (!out.image && (typeHint.startsWith('image/') || typeHint === 'image' || isImageUrl(url))) out.image = url
    if (!out.video && (typeHint.startsWith('video/') || typeHint === 'video' || isVideoUrl(url))) out.video = url
    if (!out.audio && (typeHint.startsWith('audio/') || typeHint === 'audio' || isAudioUrl(url))) out.audio = url
  }

  // direct media fields
  if (!out.image) out.image = String(post?.imageUrl || post?.media?.imageUrl || '').trim()
  if (!out.video) out.video = String(post?.videoUrl || post?.media?.videoUrl || '').trim()
  if (!out.audio) out.audio = String(post?.audioUrl || post?.media?.audioUrl || '').trim()
  out.poster = String(post?.posterUrl || post?.media?.posterUrl || '').trim()

  // scan text URLs
  const urls = extractUrlsFromText(combinedText || '')
  if (!out.image) out.image = urls.find((u) => isImageUrl(u)) || ''
  if (!out.video) out.video = urls.find((u) => isVideoUrl(u)) || ''
  if (!out.audio) out.audio = urls.find((u) => isAudioUrl(u)) || ''

  return out
}

function absUrl(origin, maybeRelative) {
  const v = String(maybeRelative || '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('/')) return `${origin}${v}`
  return v
}

function mkEtag(payload) {
  const h = createHash('sha1').update(String(payload || '')).digest('hex')
  return `"${h}"`
}

function isFreshByEtag(req, etag) {
  const inm = req.headers.get('if-none-match') || ''
  if (!inm) return false
  return inm.split(',').map((s) => s.trim()).includes(etag)
}

function isFreshBySince(req, lastModifiedMs) {
  const ims = req.headers.get('if-modified-since') || ''
  if (!ims) return false
  const t = Date.parse(ims)
  if (!Number.isFinite(t)) return false
  return Number(lastModifiedMs || 0) > 0 && t >= Number(lastModifiedMs || 0)
}

function extractPreviewVideoUrl(text) {
  const s = String(text || '')
  if (!s) return ''
  const re =
    /(?:https?:\/\/[^\s<>'")]+?\.(?:mp4|webm|mov|m4v|ogv)(?:[?#][^\s<>'")]+)?|\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:mp4|webm|mov|m4v|ogv)(?:[?#][^\s<>'")]+)?)/i
  const m = s.match(re)
  return m ? String(m[0] || '').trim() : ''
}

function videoMime(url) {
  const s = String(url || '').toLowerCase()
  if (s.includes('.webm')) return 'video/webm'
  if (s.includes('.ogv')) return 'video/ogg'
  if (s.includes('.mov')) return 'video/quicktime'
  // mp4/m4v default
  return 'video/mp4'
}

function audioMime(url) {
  const s = String(url || '').toLowerCase()
  if (s.includes('.mp3')) return 'audio/mpeg'
  if (s.includes('.m4a') || s.includes('.mp4')) return 'audio/mp4'
  if (s.includes('.wav')) return 'audio/wav'
  if (s.includes('.ogg') || s.includes('.opus')) return 'audio/ogg'
  return 'audio/webm'
}

function guessVideoDims(videoUrl) {
  const u = String(videoUrl || '')
  if (!u) return { w: 1280, h: 720 }
  if (/youtube\.com|youtu\.be/i.test(u)) return { w: 1280, h: 720 }
  // Most user-uploaded forum videos are portrait; helps Telegram sizing.
  if (/\/forum\/video-/i.test(u)) return { w: 720, h: 1280 }
  return { w: 1280, h: 720 }
}

function maybeProxyOgImage(origin, imageUrlAbs) {
  const u = String(imageUrlAbs || '').trim()
  if (!u) return ''
  try {
    const nu = new URL(u)
    const host = String(nu.hostname || '').toLowerCase()
    const isBlob =
      host.endsWith('public.blob.vercel-storage.com') ||
      host.endsWith('blob.vercel-storage.com')
    if (isBlob || /\.webp(?:[?#]|$)/i.test(u)) {
      return `${origin}/api/forum/og-image?src=${encodeURIComponent(u)}`
    }
  } catch {}
  return u
}

export async function GET(req, { params }) {
  const postId = String(params?.postId || '').trim()
  const url = new URL(req.url)
  const origin = url.origin

  const canonicalUrl = `${origin}/forum/p/${encodeURIComponent(postId)}`

  let post = null
  try {
    const raw = await redis.get(K.postKey(postId))
    post = raw ? safeParse(raw) : null
  } catch {
    post = null
  }

  const found = !!post && !!post?.id
  const topicId = found && post?.topicId != null ? String(post.topicId) : ''
  const redirectUrl = `${origin}/forum?post=${encodeURIComponent(postId)}${
    topicId ? `&topic=${encodeURIComponent(topicId)}` : ''
  }`

  const titleRaw = found ? 'Forum post' : 'Post not found'

  const rawText = found ? String(post?.text || post?.body || '') : ''
  const rawHtml = found ? String(post?.html || '') : ''
  const combined = `${rawText}\n${rawHtml}`

  const plain = found ? toPlainText(rawText) : ''
  const descRaw = found
    ? (truncateOnWord(plain, 220) || 'Forum post')
    : 'This post does not exist or was deleted.'

  const ytId = found ? extractYouTubeId(combined) : ''
  const c = found ? pickCandidatesFromPost(post, combined) : { image: '', video: '', audio: '', poster: '' }

  const videoUrl = c.video ? absUrl(origin, c.video) : ''
  const videoType = videoUrl ? videoMime(videoUrl) : ''
  const audioUrl = c.audio ? absUrl(origin, c.audio) : ''
  const audioType = audioUrl ? audioMime(audioUrl) : ''

  const qcastCover = '/audio/Q-Cast.png'
  const forumDefault = '/metab/forum1.png?v=20260210'

  const imgRel =
    (c.poster || c.image || '') ||
    (ytId ? `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg` : '') ||
    (audioUrl ? qcastCover : '') ||
    forumDefault

  const imageUrlAbs = absUrl(origin, imgRel)
  const imageUrl = maybeProxyOgImage(origin, imageUrlAbs)

  const twitterCard = imageUrl ? 'summary_large_image' : 'summary'

  const lastModifiedMs = found ? Number(post?.ts || 0) || Date.now() : Date.now()
  const etag = mkEtag([postId, titleRaw, descRaw, imageUrl, videoUrl, audioUrl, String(lastModifiedMs)].join('|'))

  const cacheControl =
    'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'

  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': cacheControl,
    etag,
    'last-modified': new Date(lastModifiedMs).toUTCString(),
  })

  if (isFreshByEtag(req, etag) || isFreshBySince(req, lastModifiedMs)) {
    return new Response(null, { status: 304, headers })
  }

  const title = escapeAttr(titleRaw.slice(0, 80))
  const desc = escapeAttr(descRaw.slice(0, 240))
  const ogUrl = escapeAttr(canonicalUrl)
  const ogImg = escapeAttr(imageUrl)
  const ogVid = escapeAttr(videoUrl)
  const ogVidType = escapeAttr(videoType)
  const ogAud = escapeAttr(audioUrl)
  const ogAudType = escapeAttr(audioType)
  const redirectEsc = escapeAttr(redirectUrl)

  const { w: vW, h: vH } = videoUrl ? guessVideoDims(videoUrl) : { w: 0, h: 0 }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${title}</title>
    <link rel="canonical" href="${ogUrl}"/>

    <meta property="og:title" content="${title}"/>
    <meta property="og:description" content="${desc}"/>
    <meta property="og:url" content="${ogUrl}"/>
    <meta property="og:type" content="${videoUrl ? 'video.other' : (audioUrl ? 'music.song' : 'article')}"/>
    <meta property="og:image" content="${ogImg}"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    ${videoUrl ? `<meta property="og:video" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:secure_url" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:type" content="${ogVidType}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:width" content="${escapeAttr(String(vW || 1280))}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:height" content="${escapeAttr(String(vH || 720))}"/>` : ''}
    ${audioUrl ? `<meta property="og:audio" content="${ogAud}"/>` : ''}
    ${audioUrl ? `<meta property="og:audio:secure_url" content="${ogAud}"/>` : ''}
    ${audioUrl ? `<meta property="og:audio:type" content="${ogAudType}"/>` : ''}

    <meta name="twitter:card" content="${twitterCard}"/>
    <meta name="twitter:title" content="${title}"/>
    <meta name="twitter:description" content="${desc}"/>
    <meta name="twitter:image" content="${ogImg}"/>

    <meta http-equiv="refresh" content="1;url=${redirectEsc}"/>
    <style>
      body{margin:0;background:#060a12;color:#eaf4ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
      .wrap{max-width:720px;margin:0 auto;padding:24px}
      a{color:#8fd0ff}
      .card{border:1px solid rgba(120,170,255,.24);border-radius:16px;padding:16px;background:rgba(10,16,28,.55)}
      .t{font-weight:700;margin:0 0 6px}
      .d{opacity:.88;margin:0 0 14px}
      .btn{display:inline-block;padding:10px 12px;border-radius:12px;border:1px solid rgba(120,170,255,.28);text-decoration:none;background:rgba(10,16,28,.35)}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <p class="t">${title}</p>
        <p class="d">${desc}</p>
        <a class="btn" href="${redirectEsc}">Open post</a>
      </div>
    </div>
    <script>
      try{ window.location.replace(${JSON.stringify(redirectUrl)}); }catch(e){}
    </script>
  </body>
</html>`

  return new Response(html, { status: found ? 200 : 404, headers })
}
