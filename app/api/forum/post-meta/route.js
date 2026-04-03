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

function extractPreviewImageUrl(text) {
  const s = String(text || '')
  if (!s) return ''
  const re =
    /(?:https?:\/\/[^\s<>'")]+?\.(?:webp|png|jpe?g|gif)(?:[?#][^\s<>'")]+)?|\/uploads\/[A-Za-z0-9._\-\/]+?\.(?:webp|png|jpe?g|gif)(?:[?#][^\s<>'")]+)?)/i
  const m = s.match(re)
  return m ? String(m[0] || '').trim() : ''
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
    const nickname = String(post?.nickname || '').trim() || null
    const plain = toPlainText(post?.text || post?.body || '')
    const bodyTextPlain = plain
    const ogDescription = truncateOnWord(plain, 220) || ''

    const previewImageUrl =
      extractPreviewImageUrl(post?.text || '') || '/metab/forum1.png'

    return json({
      ok: true,
      postId: String(postId),
      topicId,
      parentId: post?.parentId != null ? String(post.parentId) : null,
      authorName: nickname,
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
