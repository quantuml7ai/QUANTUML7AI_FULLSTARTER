export function resolveForumUserId(explicit) {
  if (explicit && String(explicit).trim()) return String(explicit).trim()

  try {
    const w = typeof window !== 'undefined' ? window : {}
    const ls = typeof localStorage !== 'undefined' ? localStorage : null

    const fromWin =
      w.__FORUM_USER__ || w.__AUTH_ACCOUNT__ || w.__ASHER_ID__ || w.wallet || w.account || ''
    if (fromWin) return String(fromWin)

    if (ls) {
      const fromLs =
        ls.getItem('account') ||
        ls.getItem('wallet') ||
        ls.getItem('asherId') ||
        ls.getItem('ql7_uid') ||
        ''
      if (fromLs) return String(fromLs)
    }
  } catch {}

  return ''
}
