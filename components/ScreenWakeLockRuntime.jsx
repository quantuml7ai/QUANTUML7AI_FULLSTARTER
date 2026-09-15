'use client'

import { useEffect } from 'react'

const WAKE_STATE_KEY = '__ql7ScreenWakeLockState'

export default function ScreenWakeLockRuntime() {
  useEffect(() => {
    let sentinel = null
    let disposed = false
    let requestInFlight = null

    const supported =
      typeof navigator !== 'undefined' &&
      !!navigator.wakeLock &&
      typeof navigator.wakeLock.request === 'function'

    const publishState = (patch = {}) => {
      try {
        window[WAKE_STATE_KEY] = {
          ...(window[WAKE_STATE_KEY] || {}),
          supported,
          held: !!sentinel && sentinel.released !== true,
          visible: document.visibilityState === 'visible',
          secureContext: window.isSecureContext === true,
          lastUpdatedAt: Date.now(),
          ...patch,
        }
      } catch {}
    }

    const releaseCurrent = async (reason = 'release') => {
      const lock = sentinel
      sentinel = null
      publishState({ held: false, lastReason: reason })

      if (!lock || lock.released === true) return

      try {
        await lock.release()
      } catch {}
    }

    const acquire = async (reason = 'runtime') => {
      if (
        disposed ||
        !supported ||
        document.visibilityState !== 'visible'
      ) {
        publishState({
          held: false,
          lastReason: reason,
          lastError: supported ? '' : 'unsupported',
        })
        return false
      }

      if (sentinel && sentinel.released !== true) {
        publishState({ held: true, lastReason: reason, lastError: '' })
        return true
      }

      if (requestInFlight) return requestInFlight

      publishState({
        lastAttemptAt: Date.now(),
        lastReason: reason,
      })

      requestInFlight = navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (
            disposed ||
            document.visibilityState !== 'visible'
          ) {
            try { void lock.release() } catch {}
            return false
          }

          sentinel = lock
          publishState({
            held: true,
            lastGrantedAt: Date.now(),
            lastReason: reason,
            lastError: '',
          })

          lock.addEventListener(
            'release',
            () => {
              if (sentinel === lock) sentinel = null

              publishState({
                held: false,
                lastReleasedAt: Date.now(),
                lastReason: 'sentinel-release',
              })

              // Safari/iOS and the OS may revoke a previously granted lock.
              // No polling: one event-driven reacquire attempt while still visible.
              if (
                !disposed &&
                document.visibilityState === 'visible'
              ) {
                queueMicrotask(() => {
                  if (!disposed) void acquire('sentinel-release')
                })
              }
            },
            { once: true },
          )

          return true
        })
        .catch((error) => {
          publishState({
            held: false,
            lastFailedAt: Date.now(),
            lastReason: reason,
            lastError: `${error?.name || 'Error'}: ${error?.message || 'wake_lock_rejected'}`,
          })
          return false
        })
        .finally(() => {
          requestInFlight = null
        })

      return requestInFlight
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquire('visibility-visible')
        return
      }

      void releaseCurrent('visibility-hidden')
    }

    const onPageShow = () => {
      void acquire('pageshow')
    }

    const onFocus = () => {
      void acquire('focus')
    }

    // The original runtime only tried on mount/visibility. If Safari/WebView
    // rejects that early request, it never got another chance until a hide/show.
    // User input is a cheap event-driven retry and is especially useful on iOS.
    const onUserActivity = () => {
      void acquire('user-activity')
    }

    publishState({
      held: false,
      lastReason: 'mount',
      lastError: supported ? '' : 'unsupported',
    })

    if (supported) void acquire('mount')

    document.addEventListener('visibilitychange', onVisibilityChange, true)
    window.addEventListener('pageshow', onPageShow, true)
    window.addEventListener('focus', onFocus, true)
    window.addEventListener('pointerdown', onUserActivity, { passive: true, capture: true })
    window.addEventListener('touchstart', onUserActivity, { passive: true, capture: true })
    window.addEventListener('keydown', onUserActivity, true)

    return () => {
      disposed = true

      document.removeEventListener('visibilitychange', onVisibilityChange, true)
      window.removeEventListener('pageshow', onPageShow, true)
      window.removeEventListener('focus', onFocus, true)
      window.removeEventListener('pointerdown', onUserActivity, true)
      window.removeEventListener('touchstart', onUserActivity, true)
      window.removeEventListener('keydown', onUserActivity, true)

      void releaseCurrent('unmount')
    }
  }, [])

  return null
}
