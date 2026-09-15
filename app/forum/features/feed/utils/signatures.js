export function sigTopic(topic) {
  const t = topic || {}
  return `${(t.title || '').slice(0, 80)}|${t.userId || t.accountId || ''}|${Math.round((t.ts || 0) / 60000)}`
}

export function sigPost(post) {
  const p = post || {}
  return `${(p.text || '').slice(0, 120)}|${p.userId || p.accountId || ''}|${p.topicId || ''}|${p.parentId || ''}|${Math.round((p.ts || 0) / 10000)}`
}
