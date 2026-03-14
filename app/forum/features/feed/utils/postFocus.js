'use client'

function normalizeFocusOptions(options) {
  if (typeof options === 'string') {
    return { behavior: options }
  }
  return options && typeof options === 'object' ? options : {}
}

function readBottomOcclusionPx(top, bottom) {
  try {
    const t = Number(top || 0) || 0
    const b = Number(bottom || 0) || 0
    if (!(b > t)) return 0
    const dock = document.querySelector?.('.composeDock') || null
    if (!dock) return 0
    const dr = dock.getBoundingClientRect?.()
    if (!dr) return 0
    const dockTop = Number(dr.top)
    if (!Number.isFinite(dockTop)) return 0
    const clampedDockTop = Math.max(t, Math.min(b, dockTop))
    const occ = b - clampedDockTop
    return Number.isFinite(occ) && occ > 0 ? Math.min(occ, b - t) : 0
  } catch {
    return 0
  }
}

function readMarginY(node) {
  try {
    const cs = window.getComputedStyle?.(node)
    const mt = cs ? parseFloat(cs.marginTop || '0') : 0
    const mb = cs ? parseFloat(cs.marginBottom || '0') : 0
    return {
      mt: Number.isFinite(mt) ? mt : 0,
      mb: Number.isFinite(mb) ? mb : 0,
    }
  } catch {
    return { mt: 0, mb: 0 }
  }
}

export function centerNodeInScroll(node, options = {}) {
  const normalized = normalizeFocusOptions(options)
  const behavior = normalized?.behavior || 'auto'
  const isBrowserFn = typeof normalized?.isBrowserFn === 'function' ? normalized.isBrowserFn : () => false
  const getScrollEl = typeof normalized?.getScrollEl === 'function' ? normalized.getScrollEl : () => null
  if (!isBrowserFn?.() || !node) return

  const minDelta = behavior === 'smooth' ? 18 : 10

  try {
    const scrollEl = getScrollEl?.()
    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
      const contRect = scrollEl.getBoundingClientRect()
      const r = node.getBoundingClientRect()
      const { mt, mb } = readMarginY(node)
      const elCenterInView = (r.top - contRect.top) - mt + ((r.height + mt + mb) / 2)
      const occ = readBottomOcclusionPx(contRect.top, contRect.bottom)
      const visibleH = Math.max(1, contRect.height - occ)
      const desired = visibleH / 2
      const delta = elCenterInView - desired
      if (!Number.isFinite(delta) || Math.abs(delta) < minDelta) return
      const nextTop = Math.max(
        0,
        Math.min((scrollEl.scrollTop || 0) + delta, (scrollEl.scrollHeight || 0) - (scrollEl.clientHeight || 0)),
      )
      scrollEl.scrollTo?.({ top: nextTop, behavior })
      return
    }
  } catch {}
  try {
    const r = node.getBoundingClientRect?.()
    if (r) {
      const { mt, mb } = readMarginY(node)
      const elCenter = (r.top - mt) + ((r.height + mt + mb) / 2)
      const vh = window.innerHeight || document.documentElement?.clientHeight || 0
      const occ = readBottomOcclusionPx(0, vh)
      const visibleH = Math.max(1, vh - occ)
      const desired = visibleH / 2
      const delta = elCenter - desired
      if (Number.isFinite(delta) && Math.abs(delta) > minDelta) {
        const curY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
        const nextY = Math.max(0, curY + delta)
        try {
          window.scrollTo({ top: nextY, behavior })
        } catch {
          try {
            window.scrollTo(0, nextY)
          } catch {}
        }
        return
      }
    }
  } catch {}
  try {
    node.scrollIntoView?.({ behavior, block: 'center' })
  } catch {
    try {
      node.scrollIntoView?.()
    } catch {}
  }
}

export function centerPostAfterDom(postId, options = {}) {
  const normalized = normalizeFocusOptions(options)
  const behavior = normalized?.behavior || 'auto'
  const isBrowserFn = typeof normalized?.isBrowserFn === 'function' ? normalized.isBrowserFn : () => false
  const centerNodeInScrollFn =
    typeof normalized?.centerNodeInScrollFn === 'function' ? normalized.centerNodeInScrollFn : centerNodeInScroll
  const pid = String(postId || '').trim()
  if (!pid || !isBrowserFn?.()) return
  let tries = 0
  const maxTries = 10
  const tick = () => {
    tries += 1
    const node = document.getElementById(`post_${pid}`)
    if (node) {
      centerNodeInScrollFn(node, behavior)
      return
    }
    if (tries < maxTries) {
      try {
        requestAnimationFrame(tick)
      } catch {
        try {
          setTimeout(tick, 16)
        } catch {}
      }
    }
  }
  try {
    requestAnimationFrame(tick)
  } catch {
    try {
      setTimeout(tick, 0)
    } catch {}
  }
}

export function centerAndFlashPostAfterDom(postId, options = {}) {
  const normalized = normalizeFocusOptions(options)
  const behavior = normalized?.behavior || 'auto'
  const isBrowserFn = typeof normalized?.isBrowserFn === 'function' ? normalized.isBrowserFn : () => false
  const centerNodeInScrollFn =
    typeof normalized?.centerNodeInScrollFn === 'function' ? normalized.centerNodeInScrollFn : centerNodeInScroll
  const getScrollEl = typeof normalized?.getScrollEl === 'function' ? normalized.getScrollEl : () => null
  const postsLen = Number(normalized?.postsLen || 0)
  const visibleThreadPostsCount = Number(normalized?.visibleThreadPostsCount || 0)
  const setVisibleThreadPostsCount =
    typeof normalized?.setVisibleThreadPostsCount === 'function' ? normalized.setVisibleThreadPostsCount : null

  const pid = String(postId || '').trim()
  if (!pid || !isBrowserFn?.()) return

  try {
    if (postsLen > 0 && visibleThreadPostsCount < postsLen) {
      try {
        setVisibleThreadPostsCount?.(postsLen)
      } catch {}
    }
  } catch {}

  let tries = 0
  const maxTries = 18
  const tick = () => {
    tries += 1
    const node = document.getElementById(`post_${pid}`)
    if (node) {
      try {
        centerNodeInScrollFn(node, behavior)
      } catch {}

      try {
        const computeDelta = () => {
          try {
            const r = node.getBoundingClientRect?.()
            if (!r) return 0
            const { mt, mb } = readMarginY(node)
            const scrollEl = getScrollEl?.()
            if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
              const contRect = scrollEl.getBoundingClientRect?.()
              if (!contRect) return 0
              const elCenterInView = (r.top - contRect.top) - mt + ((r.height + mt + mb) / 2)
              const occ = readBottomOcclusionPx(contRect.top, contRect.bottom)
              const visibleH = Math.max(1, contRect.height - occ)
              const desired = visibleH / 2
              const d = elCenterInView - desired
              return Number.isFinite(d) ? d : 0
            }
            const elCenter = (r.top - mt) + ((r.height + mt + mb) / 2)
            const vh = window.innerHeight || document.documentElement?.clientHeight || 0
            const occ = readBottomOcclusionPx(0, vh)
            const visibleH = Math.max(1, vh - occ)
            const d = elCenter - (visibleH / 2)
            return Number.isFinite(d) ? d : 0
          } catch {
            return 0
          }
        }

        const maybeRecenter = () => {
          const d = computeDelta()
          if (Number.isFinite(d) && Math.abs(d) > 24) {
            try {
              centerNodeInScrollFn(node, 'auto')
            } catch {}
          }
        }

        try {
          setTimeout(maybeRecenter, 90)
        } catch {}

        try {
          if (typeof ResizeObserver !== 'undefined') {
            const scrollEl = getScrollEl?.()
            let stopped = false
            let rafId = 0
            const schedule = () => {
              if (stopped || rafId) return
              try {
                rafId = requestAnimationFrame(() => {
                  rafId = 0
                  maybeRecenter()
                })
              } catch {}
            }

            const ro = new ResizeObserver(schedule)
            try {
              ro.observe(node)
            } catch {}
            if (scrollEl) {
              try {
                ro.observe(scrollEl)
              } catch {}
            }

            setTimeout(() => {
              stopped = true
              try {
                ro.disconnect()
              } catch {}
              if (rafId) {
                try {
                  cancelAnimationFrame(rafId)
                } catch {}
              }
            }, 180)
          }
        } catch {}
      } catch {}
      try {
        node.classList.add('replyTargetFlash')
        window.setTimeout(() => node.classList.remove('replyTargetFlash'), 1100)
      } catch {}
      return
    }
    if (tries < maxTries) {
      try {
        requestAnimationFrame(tick)
      } catch {
        try {
          setTimeout(tick, 16)
        } catch {}
      }
    }
  }
  try {
    requestAnimationFrame(tick)
  } catch {
    try {
      setTimeout(tick, 0)
    } catch {}
  }
}
