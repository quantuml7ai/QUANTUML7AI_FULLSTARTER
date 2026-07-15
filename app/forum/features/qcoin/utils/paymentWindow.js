export function openPaymentWindow(url) {
  if (!url) return

  try {
    console.log('[PAY] redirect to', url)
    window.location.href = url
  } catch {
    try {
      window.location.assign(url)
    } catch {}
  }
}
