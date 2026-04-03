export async function openAuthFlow({ readAuth, timeoutMs = 15000 } = {}) {
  try {
    window.dispatchEvent(new CustomEvent('open-auth'))
  } catch {}
  ;(document.querySelector('[data-auth-open]') || document.querySelector('#nav-auth-btn'))?.click?.()

  return new Promise((resolve) => {
    let done = false
    const finish = (val) => {
      if (done) return
      done = true
      cleanup()
      resolve(val)
    }

    const ok = () => finish(readAuth?.() || null)
    const cancel = () => finish(null)
    const cleanup = () => {
      window.removeEventListener('auth:ok', ok)
      window.removeEventListener('auth:success', ok)
      window.removeEventListener('auth:cancel', cancel)
      window.removeEventListener('auth:fail', cancel)
      clearTimeout(timer)
    }

    window.addEventListener('auth:ok', ok, { once: true })
    window.addEventListener('auth:success', ok, { once: true })
    window.addEventListener('auth:cancel', cancel, { once: true })
    window.addEventListener('auth:fail', cancel, { once: true })

    const timer = setTimeout(() => cancel(), timeoutMs)
  })
}
