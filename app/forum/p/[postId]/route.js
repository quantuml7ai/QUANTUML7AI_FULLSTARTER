// app/forum/p/[postId]/route.js
// OG/Twitter preview + human redirect entrypoint.

import { createHash } from 'crypto'
import { redis, K, safeParse } from '../../../api/forum/_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

const OG_DEFAULT_IMAGE = '/metab/forum1.png'
const OG_AUDIO_IMAGE = '/audio/Q-Cast.png'
const SHARE_OG_TITLE = 'Q-Line Future is in your hands'

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

function dedupUrls(list) {
  const out = []
  const seen = new Set()
  for (const it of Array.isArray(list) ? list : []) {
    const u = String(it || '').trim()
    if (!u) continue
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

function isLikelyVercelBlobUrl(url) {
  const s = String(url || '').toLowerCase()
  return (
    s.includes('vercel-storage') ||
    s.includes('vercel-blob') ||
    s.includes('blob.vercel-storage.com') ||
    /https?:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//i.test(url)
  )
}

function imageMime(url) {
  const s = String(url || '').toLowerCase()
  if (s.includes('.png')) return 'image/png'
  if (s.includes('.jpg') || s.includes('.jpeg')) return 'image/jpeg'
  if (s.includes('.gif')) return 'image/gif'
  if (s.includes('.webp')) return 'image/webp'
  if (s.includes('.avif')) return 'image/avif'
  if (s.includes('.bmp')) return 'image/bmp'
  if (s.includes('.svg')) return 'image/svg+xml'
  return ''
}

function extractPreviewImageUrls(text) {
  const s = String(text || '')
  if (!s) return []
  const re =
    /(?:https?:\/\/[^\s<>'")]+?\.(?:webp|png|jpe?g|gif|avif|bmp|svg)(?:[?#][^\s<>'")]+)?|\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif|avif|bmp|svg)(?:[?#][^\s<>'")]+)?)/gi

  const matches = []
  try {
    for (const m of s.matchAll(re)) {
      const u = String(m?.[0] || '').trim()
      if (u) matches.push(u)
    }
  } catch {
    const m = s.match(re)
    if (m && m[0]) matches.push(String(m[0]).trim())
  }

  const list = dedupUrls(matches)
  if (!list.length) return []

  const scored = list.map((u, idx) => {
    let score = 0
    if (isLikelyVercelBlobUrl(u)) score += 30
    if (/^https:\/\//i.test(u)) score += 3
    const mime = imageMime(u)
    // Telegram/соцсети наиболее стабильно работают с jpg/png; webp оставляем, но чуть ниже.
    if (mime === 'image/jpeg') score += 4
    if (mime === 'image/png') score += 3
    if (mime === 'image/gif') score += 2
    if (mime === 'image/webp') score -= 1
    if (mime === 'image/svg+xml') score -= 6
    return { u, idx, score }
  })

  scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
  return scored.map((x) => x.u)
}

function extractPreviewImageUrl(text) {
  return extractPreviewImageUrls(text)[0] || ''
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

function extractPreviewAudioUrl(text) {
  const s = String(text || '')
  if (!s) return ''
  const re =
    /(?:https?:\/\/[^\s<>'")]+?\.(?:webm|ogg|mp3|m4a|wav)(?:[?#][^\s<>'")]+)?|\/uploads\/audio\/[A-Za-z0-9._\-\/]+?\.(?:webm|ogg|mp3|m4a|wav)(?:[?#][^\s<>'")]+)?|\/forum\/voice[^\s<>'")]*\.(?:webm|ogg|mp3|m4a|wav)(?:[?#][^\s<>'")]+)?)/i
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

function audioMime(url) {
  const s = String(url || '').toLowerCase()
  if (s.includes('.mp3')) return 'audio/mpeg'
  if (s.includes('.m4a')) return 'audio/mp4'
  if (s.includes('.wav')) return 'audio/wav'
  if (s.includes('.ogg')) return 'audio/ogg'
  return 'audio/webm'
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
  const redirectUrl = `${origin}/forum?post=${encodeURIComponent(postId)}${
    topicId ? `&topic=${encodeURIComponent(topicId)}` : ''
  }`

  const titleRaw = found ? SHARE_OG_TITLE : 'Post not found'

  const plain = found ? toPlainText(post?.text || '') : ''
  const descRaw = found
    ? (truncateOnWord(plain, 220) || 'Forum post')
    : 'This post does not exist or was deleted.'

  const textRaw = found ? String(post?.text || '') : ''
  const ytId = found ? extractYouTubeId(textRaw) : ''
  const ytEmbedUrl = ytId ? `https://www.youtube.com/embed/${encodeURIComponent(ytId)}` : ''
  const ytThumbUrl = ytId ? `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg` : ''

  const isAudioPost = found ? hasAudioInText(textRaw) : false
  const imgRels = found ? extractPreviewImageUrls(textRaw) : []
  const imgRel = imgRels[0] || ''
  const vidRel = found ? extractPreviewVideoUrl(textRaw) : ''
  const audRel = found ? extractPreviewAudioUrl(textRaw) : ''

  // Media priority for share previews:
  // - YouTube: try to provide a playable embed via og:video (fallback thumbnail via og:image)
  // - Video file: og:video points to the real file URL
  // - Audio: always use Q-Cast cover image (and provide og:audio when possible)
  // - Image: og:image points to the real image URL
  // - No media: forum default preview image
  const chosen = (() => {
    if (ytEmbedUrl) {
      return {
        kind: 'youtube',
        images: dedupUrls([
          `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/mqdefault.jpg`,
          `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/maxresdefault.jpg`,
          ytThumbUrl,
          OG_DEFAULT_IMAGE,
        ]),
        videoUrl: ytEmbedUrl,
        videoType: 'text/html',
        audioUrl: '',
        audioType: '',
        ogType: 'video.other',
      }
    }
    if (vidRel) {
      const v = absUrl(origin, vidRel)
      return {
        kind: 'video',
        images: dedupUrls([imgRel, OG_DEFAULT_IMAGE]),
        videoUrl: v,
        videoType: videoMime(v),
        audioUrl: '',
        audioType: '',
        ogType: 'video.other',
      }
    }
    if (isAudioPost) {
      const a = audRel ? absUrl(origin, audRel) : ''
      return {
        kind: 'audio',
        images: [OG_AUDIO_IMAGE],
        videoUrl: '',
        videoType: '',
        audioUrl: a,
        audioType: a ? audioMime(a) : '',
        ogType: 'article',
      }
    }
    if (imgRel) {
      return {
        kind: 'image',
        images: dedupUrls([imgRel, OG_DEFAULT_IMAGE]),
        videoUrl: '',
        videoType: '',
        audioUrl: '',
        audioType: '',
        ogType: 'article',
      }
    }
    return {
      kind: 'default',
      images: [OG_DEFAULT_IMAGE],
      videoUrl: '',
      videoType: '',
      audioUrl: '',
      audioType: '',
      ogType: 'website',
    }
  })()

  const imageUrls = dedupUrls((chosen?.images || []).map((x) => absUrl(origin, x))).filter(Boolean)
  const imageUrl = imageUrls[0] || ''
  const videoUrl = String(chosen.videoUrl || '').trim()
  const videoType = String(chosen.videoType || '').trim()
  const audioUrl = String(chosen.audioUrl || '').trim()
  const audioType0 = String(chosen.audioType || '').trim()
  const twitterCard = imageUrl ? 'summary_large_image' : 'summary'

  const lastModifiedMs = found ? Number(post?.ts || 0) || Date.now() : Date.now()
  const etag = mkEtag([postId, titleRaw, descRaw, imageUrls.join(','), videoUrl, audioUrl, String(lastModifiedMs)].join('|'))

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
  const ogImgs = imageUrls.map((u) => escapeAttr(u))
  const ogVid = escapeAttr(videoUrl)
  const ogVidType = escapeAttr(videoType)
  const ogAud = escapeAttr(audioUrl)
  const ogAudType = escapeAttr(audioType0)
  const redirectEsc = escapeAttr(redirectUrl)
  const ogType = escapeAttr(String(chosen?.ogType || (videoUrl ? 'video.other' : 'article')))

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
    <meta property="og:type" content="${ogType}"/>
    <meta property="og:site_name" content="Q-Line"/>
    ${ogImgs.map((u) => `<meta property="og:image" content="${u}"/>\n    <meta property="og:image:secure_url" content="${u}"/>`).join('\n    ')}
    ${videoUrl ? `<meta property="og:video" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:url" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:secure_url" content="${ogVid}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:type" content="${ogVidType}"/>` : ''}
    ${videoUrl ? `<meta property="og:video:width" content="1280"/>` : ''}
    ${videoUrl ? `<meta property="og:video:height" content="720"/>` : ''}
    ${audioUrl ? `<meta property="og:audio" content="${ogAud}"/>` : ''}
    ${audioUrl ? `<meta property="og:audio:secure_url" content="${ogAud}"/>` : ''}
    ${audioUrl ? `<meta property="og:audio:type" content="${ogAudType}"/>` : ''}

    <meta name="twitter:card" content="${twitterCard}"/>
    <meta name="twitter:title" content="${title}"/>
    <meta name="twitter:description" content="${desc}"/>
    ${ogImgs[0] ? `<meta name="twitter:image" content="${ogImgs[0]}"/>` : ''}

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
