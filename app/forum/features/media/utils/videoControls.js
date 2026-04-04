'use client'

/**
 * Build a safe tap handler that enables native controls only after user interaction.
 * Root passes media helper adapters to preserve exact runtime behavior.
 */
export function createEnableVideoControlsOnTap({
  hasLazyVideoSourceWithoutSrc,
  restoreVideoEl,
  touchActiveVideoEl,
  enforceActiveVideoCap,
}) {
  return function enableVideoControlsOnTap(e) {
    try {
      const v = e?.currentTarget
      if (!v) return
      if (typeof window === 'undefined') return
      if (!(v instanceof HTMLVideoElement)) return
      try {
        const forumVideoKind = String(v.dataset?.forumVideo || v.getAttribute('data-forum-video') || '')
        if (forumVideoKind === 'post') return
      } catch {}

      try {
        if (typeof hasLazyVideoSourceWithoutSrc === 'function' && hasLazyVideoSourceWithoutSrc(v)) {
          if (typeof restoreVideoEl === 'function') restoreVideoEl(v)
        }
        if (typeof touchActiveVideoEl === 'function') touchActiveVideoEl(v)
        if (typeof enforceActiveVideoCap === 'function') enforceActiveVideoCap(v)
        v.preload = 'auto'
      } catch {}

      if (v.controls) {
        try {
          const dur = Number(v.duration || 0)
          const cur = Number(v.currentTime || 0)
          const endedLike =
            Number(v.ended ? 1 : 0) === 1 ||
            (Number.isFinite(dur) && dur > 0 && cur >= Math.max(0, dur - 0.05))
          if (endedLike && v.paused) {
            v.currentTime = 0
            const p = v.play?.()
            if (p && typeof p.catch === 'function') p.catch(() => {})
          }
        } catch {}
        return
      }

      v.controls = true
      try {
        v.setAttribute('controls', '')
      } catch {}

      try {
        v.playsInline = true
      } catch {}
      try {
        v.setAttribute('playsinline', '')
      } catch {}
      try {
        v.setAttribute('webkit-playsinline', '')
      } catch {}

      try {
        const hasLazy = typeof hasLazyVideoSourceWithoutSrc === 'function' && hasLazyVideoSourceWithoutSrc(v)
        if (!v.currentSrc && hasLazy) {
          if (typeof restoreVideoEl === 'function') restoreVideoEl(v)
        }
        if (!v.currentSrc) return
        if (v.paused) {
          const p = v.play?.()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        }
      } catch {}
    } catch {}
  }
}
