'use client'

export const PAYMENT_METHOD_OPEN_EVENT = 'ql7:payment-method:open'
export const PAYMENT_METHOD_RESULT_EVENT = 'ql7:payment-method:result'

function createRequestId() {
  try {
    if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID()
  } catch {}
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`
}

export function openPaymentMethodPopover({ accountId, purpose = 'vip', adsPackage = null } = {}) {
  if (typeof window === 'undefined') return Promise.resolve(null)

  const requestId = createRequestId()
  return new Promise((resolve) => {
    const onResult = (event) => {
      if (event?.detail?.requestId !== requestId) return
      window.removeEventListener(PAYMENT_METHOD_RESULT_EVENT, onResult)
      resolve(event.detail.result || null)
    }

    window.addEventListener(PAYMENT_METHOD_RESULT_EVENT, onResult)
    window.dispatchEvent(new CustomEvent(PAYMENT_METHOD_OPEN_EVENT, {
      detail: {
        requestId,
        accountId: String(accountId || '').trim(),
        purpose: String(purpose || '').trim().toLowerCase(),
        adsPackage: adsPackage ? String(adsPackage).trim().toUpperCase() : null,
      },
    }))
  })
}
