'use client'

export function safeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /(https?:\/\/[^\s<]+)(?=\s|$)/g,
      '<a target="_blank" rel="noreferrer noopener nofollow ugc" href="$1">$1</a>',
    )
    .replace(/\n/g, '<br/>')
}

export function rich(input) {
  return safeHtml(input)
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
}
