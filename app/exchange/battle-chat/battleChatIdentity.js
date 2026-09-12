'use client'

const ANON_AVATAR = '/anonymous/anonymous.png'

export function battleChatAuthorName(author, t) {
  const nickname = String(author?.nickname || '').trim()
  if (author?.kind === 'profile' && nickname) return nickname
  const fallback = typeof t === 'function' ? t('forum_subscriptions_unknown_user') : ''
  return fallback && fallback !== 'forum_subscriptions_unknown_user' ? fallback : 'Anonymous'
}

export function battleChatAuthorAvatar(author) {
  const avatar = String(author?.avatar || '').trim()
  return avatar || ANON_AVATAR
}
