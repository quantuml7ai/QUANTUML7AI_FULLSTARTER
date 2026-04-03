'use client'

export function getScrollSnapshot(options = {}) {
  const isBrowserFn = typeof options?.isBrowserFn === 'function' ? options.isBrowserFn : () => false
  const getScrollEl = typeof options?.getScrollEl === 'function' ? options.getScrollEl : () => null
  if (!isBrowserFn()) return { useInner: false, y: 0 }
  try {
    const scrollEl = getScrollEl()
    const useInner = !!scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1
    if (useInner) return { useInner: true, y: scrollEl.scrollTop || 0 }
  } catch {}
  const winY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  return { useInner: false, y: winY }
}

export function getEntryOffset(options = {}) {
  const entryId = String(options?.entryId || '').trim()
  const useInner = !!options?.useInner
  const isBrowserFn = typeof options?.isBrowserFn === 'function' ? options.isBrowserFn : () => false
  const getScrollEl = typeof options?.getScrollEl === 'function' ? options.getScrollEl : () => null
  if (!isBrowserFn() || !entryId) return null
  try {
    const el = document.getElementById(entryId)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (useInner) {
      const scrollEl = getScrollEl()
      const contRect = scrollEl?.getBoundingClientRect?.() || { top: 0 }
      return rect.top - contRect.top
    }
    return rect.top
  } catch {
    return null
  }
}

export function restoreScrollSnapshot(options = {}) {
  const snapshot = options?.snapshot
  const isBrowserFn = typeof options?.isBrowserFn === 'function' ? options.isBrowserFn : () => false
  const getScrollEl = typeof options?.getScrollEl === 'function' ? options.getScrollEl : () => null
  if (!isBrowserFn() || !snapshot) return
  const y = Number(snapshot?.y || 0)
  const useInner = !!snapshot?.useInner
  const apply = () => {
    const scrollEl = useInner ? getScrollEl() : null
    if (useInner && scrollEl) {
      try {
        scrollEl.scrollTop = y
      } catch {}
    } else {
      try {
        window.scrollTo({ top: y, behavior: 'auto' })
      } catch {
        try {
          window.scrollTo(0, y)
        } catch {}
      }
    }
  }
  try {
    requestAnimationFrame(() => requestAnimationFrame(apply))
  } catch {
    try {
      setTimeout(apply, 0)
    } catch {}
  }
}

export function restoreEntryPosition(options = {}) {
  const state = options?.state
  const isBrowserFn = typeof options?.isBrowserFn === 'function' ? options.isBrowserFn : () => false
  const getScrollEl = typeof options?.getScrollEl === 'function' ? options.getScrollEl : () => null
  if (!isBrowserFn() || !state?.entryId) return false
  const entryId = String(state.entryId || '').trim()
  if (!entryId) return false
  const el = document.getElementById(entryId)
  if (!el) return false

  const useInner = !!state?.scroll?.useInner
  const offset = Number(state?.entryOffset)
  const minDelta = 14
  const apply = () => {
    try {
      if (useInner) {
        const scrollEl = getScrollEl()
        if (scrollEl) {
          if (Number.isFinite(offset)) {
            const rect = el.getBoundingClientRect()
            const contRect = scrollEl.getBoundingClientRect()
            const delta = rect.top - contRect.top - offset
            if (Math.abs(delta) >= minDelta) {
              scrollEl.scrollTop += delta
            }
          } else {
            el.scrollIntoView({ behavior: 'auto', block: 'nearest' })
          }
          return true
        }
      } else if (Number.isFinite(offset)) {
        const rect = el.getBoundingClientRect()
        const delta = rect.top - offset
        if (Math.abs(delta) >= minDelta) {
          try {
            window.scrollTo({ top: (window.pageYOffset || 0) + delta, behavior: 'auto' })
          } catch {}
        }
        return true
      } else {
        el.scrollIntoView({ behavior: 'auto', block: 'nearest' })
        return true
      }
    } catch {}
    return false
  }
  return apply()
}
