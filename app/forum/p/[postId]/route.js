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
    /(?:https?:\/\/[^\s<>'")]+?\.(?:webp|png|jpe?g|gif|avif|bmp|svg)(?:[?#][^\s<>'")]+)?|\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif|avif|bmp|svg)(?:[?#][^\s<>'")]+)?)/i
  const m = s.match(re)
  return m ? String(m[0] || '').trim() : ''
}

function extractYouTubeId(text) {
  const s = String(text || '')
  if (!s) return ''
  const m = s.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  )
  return m ? String(m[1] || '').trim() : ''
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

function hasAudioInText(text) {
  const s = String(text || '')
  if (!s) return false
  const re =
    /(?:https?:\/\/[^\s<>'")]+?\.(?:webm|ogg|mp3|m4a|wav)(?:[?#][^\s<>'")]+)?|\/uploads\/audio\/[A-Za-z0-9._\-\/]+?\.(?:webm|ogg|mp3|m4a|wav)(?:[?#][^\s<>'")]+)?|\/forum\/voice[^\s<>'")]*\.(?:webm|ogg|mp3|m4a|wav)(?:[?#][^\s<>'")]+)?)/i
  if (re.test(s)) return true
  return /[?&]filename=.*\.(?:webm|ogg|mp3|m4a|wav)(?:$|[&#])/i.test(s)
}

function videoMime(url) {
  const s = String(url || '').toLowerCase()
  if (s.includes('.webm')) return 'video/webm'
  if (s.includes('.ogv')) return 'video/ogg'
  if (s.includes('.mov')) return 'video/quicktime'
  // mp4/m4v default
  return 'video/mp4'
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

  let rootId = found ? String(post?.id || postId) : ''
  if (found) {
    try {
      let cur = post
      let curId = String(cur?.id || postId)
      rootId = curId
      const seen = new Set([curId])
      for (let i = 0; i < 80; i += 1) {
        const pid = cur?.parentId != null ? String(cur.parentId).trim() : ''
        if (!pid) break
        if (seen.has(pid)) break
        seen.add(pid)
        const rawParent = await redis.get(K.postKey(pid))
        const parent = rawParent ? safeParse(rawParent) : null
        if (!parent || !parent.id) break
        cur = parent
        curId = String(parent.id)
        rootId = curId
      }
    } catch {
      rootId = found ? String(post?.id || postId) : ''
    }
  }

  const redirectUrl = `${origin}/forum?post=${encodeURIComponent(postId)}${
    topicId ? `&topic=${encodeURIComponent(topicId)}` : ''
  }${rootId ? `&root=${encodeURIComponent(rootId)}` : ''}`

  const nick = found ? String(post?.nickname || '').trim() : ''
  const titleRaw = found
    ? (nick ? `Forum - Post by @${nick.replace(/^@/, '')}` : 'Forum - Post')
    : 'Forum - Post not found'

  const plain = found ? toPlainText(post?.text || '') : ''
  const descRaw = found
    ? (truncateOnWord(plain, 220) || 'Forum post')
    : 'This post does not exist or was deleted.'

  const textRaw = found ? String(post?.text || '') : ''
  const ytId = found ? extractYouTubeId(textRaw) : ''
  const ytEmbedUrl = ytId ? `https://www.youtube.com/embed/${encodeURIComponent(ytId)}` : ''
  const ytThumbUrl = ytId ? `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg` : ''

  const isAudioPost = found ? hasAudioInText(textRaw) : false
  const imgRel = found ? extractPreviewImageUrl(textRaw) : ''
  const vidRel = found ? extractPreviewVideoUrl(textRaw) : ''

  // Media priority for share previews:
  // - YouTube: try to provide a playable embed via og:video (fallback thumbnail via og:image)
  // - Video file: og:video points to the real file URL
  // - Image: og:image points to the real image URL
  // - Audio: use Q-Cast cover image
  // - No media: forum default preview image
  const chosen = (() => {
    if (ytEmbedUrl) {
      return {
        kind: 'youtube',
        imageRel: ytThumbUrl || '/metab/forum1.png',
        videoUrl: ytEmbedUrl,
        videoType: 'text/html',
      }
    }
    if (vidRel) {
      const v = absUrl(origin, vidRel)
      return {
        kind: 'video',
        imageRel: imgRel || '/metab/forum1.png',
        videoUrl: v,
        videoType: videoMime(v),
      }
    }
    if (imgRel) {
      return { kind: 'image', imageRel: imgRel, videoUrl: '', videoType: '' }
    }
    if (isAudioPost) {
      return { kind: 'audio', imageRel: '/audio/Q-Cast.png', videoUrl: '', videoType: '' }
    }
    return { kind: 'default', imageRel: '/metab/forum1.png', videoUrl: '', videoType: '' }
  })()

  const imageUrl = absUrl(origin, chosen.imageRel)
  const videoUrl = String(chosen.videoUrl || '').trim()
  const videoType = String(chosen.videoType || '').trim()
  const twitterCard = imageUrl ? 'summary_large_image' : 'summary'

  const lastModifiedMs = found ? Number(post?.ts || 0) || Date.now() : Date.now()
  const etag = mkEtag(
    [postId, titleRaw, descRaw, imageUrl, String(rootId), String(lastModifiedMs)].join('|'),
  )

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
  const redirectEsc = escapeAttr(redirectUrl)

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
    <meta property="og:type" content="${videoUrl ? 'video.other' : 'article'}"/>
    <meta property="og:image" content="${ogImg}"/>
    ${videoUrl ? `<meta property="og:video" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:secure_url" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:type" content="${ogVidType}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:width" content="1280"/>` : ''}
    ${videoUrl ? `<meta property="og:video:height" content="720"/>` : ''}

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
