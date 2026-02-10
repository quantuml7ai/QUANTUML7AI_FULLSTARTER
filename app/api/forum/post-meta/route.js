// app/api/forum/post-meta/route.js
import { json, bad } from '../_utils.js'
import { redis, K, safeParse } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function toPlainText(raw) {
  const s0 = String(raw || '')
  if (!s0) return ''
  return s0
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
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

function pickPreviewImageFromPost(post) {
  if (!post) return ''

  // attachments/media lists
  const lists = []
  if (Array.isArray(post?.attachments)) lists.push(post.attachments)
  if (Array.isArray(post?.files)) lists.push(post.files)
  const mediaList = lists.flat().filter(Boolean)
  for (const a of mediaList) {
    const url = String(a?.url || a?.src || a?.href || a?.file || '').trim()
    const typeHint = String(a?.type || a?.mime || a?.mediaType || '').toLowerCase()
    if (!url) continue
    if (typeHint.startsWith('image/') || typeHint === 'image' || isImageUrl(url)) return url
  }

  // direct media fields
  const direct =
    String(post?.posterUrl || post?.media?.posterUrl || '').trim() ||
    String(post?.imageUrl || post?.media?.imageUrl || '').trim()
  if (direct) return direct

  const rawText = String(post?.text || post?.body || '')
  const ytId = extractYouTubeId(rawText)
  if (ytId) return `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg`

  const fromText = extractPreviewImageUrl(rawText)
  if (fromText) return fromText

  // audio fallback cover
  const urls = extractUrlsFromText(rawText)
  const hasAudio =
    urls.some((u) => isAudioUrl(u)) ||
    !!String(post?.audioUrl || post?.media?.audioUrl || '').trim()
  if (hasAudio) return '/audio/Q-Cast.png'

  // video fallback (no poster) -> forum default
  const hasVideo =
    urls.some((u) => isVideoUrl(u)) ||
    !!String(post?.videoUrl || post?.media?.videoUrl || '').trim()
  if (hasVideo) return '/metab/forum1.png?v=20260210'

  return ''
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = String(searchParams.get('postId') || '').trim()
    if (!postId) return bad('missing_postId', 400)

    const raw = await redis.get(K.postKey(postId))
    if (!raw) return json({ ok: false, error: 'not_found' }, 404)
    const post = safeParse(raw)
    if (!post) return json({ ok: false, error: 'not_found' }, 404)

    const topicId = String(post?.topicId || '').trim() || null
    const plain = toPlainText(post?.text || post?.body || '')
    const bodyTextPlain = plain
    const ogDescription = truncateOnWord(plain, 220) || ''

    const previewImageUrl =
      pickPreviewImageFromPost(post) || '/metab/forum1.png?v=20260210'

    return json({
      ok: true,
      postId: String(postId),
      topicId,
      parentId: post?.parentId != null ? String(post.parentId) : null,
      authorName: null,
      bodyTextPlain,
      ogDescription,
      previewImageUrl,
      createdAt: Number(post?.ts || 0) || null,
    })
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500, {
      'cache-control': 'no-store, max-age=0',
    })
  }
}
