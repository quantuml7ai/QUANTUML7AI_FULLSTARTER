export const QL7_SUPPORT_ACTIVE_ENV_NAME = 'SUPPORT_ACTIVE'
export const QL7_SUPPORT_DISABLED_CODE = 'ql7_support_disabled'

function rawSupportActiveValue() {
  try { return String(process?.env?.SUPPORT_ACTIVE ?? '').trim() } catch { return '' }
}

export function isQl7SupportActive() {
  return rawSupportActiveValue() === '1'
}

export function getQl7SupportFeatureState() {
  const raw = rawSupportActiveValue()
  return Object.freeze({
    active: raw === '1',
    explicit: raw === '0' || raw === '1',
    raw: raw === '1' ? '1' : (raw === '0' ? '0' : ''),
    envName: QL7_SUPPORT_ACTIVE_ENV_NAME,
    disabledCode: QL7_SUPPORT_DISABLED_CODE,
  })
}

export function assertQl7SupportActive() {
  if (isQl7SupportActive()) return true
  const error = new Error(QL7_SUPPORT_DISABLED_CODE)
  error.code = QL7_SUPPORT_DISABLED_CODE
  error.status = 404
  throw error
}

export function ql7SupportDisabledPayload() {
  return Object.freeze({ ok: false, error: QL7_SUPPORT_DISABLED_CODE, supportActive: false })
}
