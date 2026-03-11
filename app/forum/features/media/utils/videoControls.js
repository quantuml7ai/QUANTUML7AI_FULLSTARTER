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
        if (typeof hasLazyVideoSourceWithoutSrc === 'function' && hasLazyVideoSourceWithoutSrc(v)) {
          if (typeof restoreVideoEl === 'function') restoreVideoEl(v)
        }
        if (typeof touchActiveVideoEl === 'function') touchActiveVideoEl(v)
        if (typeof enforceActiveVideoCap === 'function') enforceActiveVideoCap(v)
        v.preload = 'auto'
        try { v.setAttribute('preload', 'auto') } catch {}
      } catch {}

      if (v.controls) return

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
