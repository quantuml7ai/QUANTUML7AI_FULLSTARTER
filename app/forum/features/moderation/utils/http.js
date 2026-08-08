export function buildModerationFormData(blobs, meta = {}) {
  const fd = new FormData()
  for (const item of blobs || []) {
    if (!item?.blob) continue
    fd.append('files', item.blob, item.name || `frame-${Date.now()}.jpg`)
  }

  if (meta?.source) fd.append('source', String(meta.source))
  if (meta?.clientRequestId) fd.append('clientRequestId', String(meta.clientRequestId))
  return fd
}

export function ensureModerationResponse(response, payload) {
  if (response?.ok && payload) return payload

  const errMsg = payload?.error ? String(payload.error) : 'moderation_http_error'
  const err = new Error(errMsg)
  err.status = Number(response?.status || 0)
  throw err
}
