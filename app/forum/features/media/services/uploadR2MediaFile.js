// app/forum/features/media/services/uploadR2MediaFile.js

function parseUploadErrorPayload(payload, fallback) {
  if (!payload || typeof payload !== 'object') return fallback

  const direct = payload.message || payload.errorMessage || payload.error
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const nested = payload.error
  if (nested && typeof nested === 'object') {
    const message = nested.message || nested.code
    if (typeof message === 'string' && message.trim()) return message.trim()
  }

  return fallback
}

function createAbortError() {
  const error = new Error('R2 upload aborted')
  error.name = 'AbortError'
  return error
}

async function readJsonResponse(response) {
  const text = await response.text().catch(() => '')
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

function normalizeUploadHeaders(headers) {
  const normalized = {}

  if (!headers || typeof headers !== 'object') return normalized

  Object.entries(headers).forEach(([name, value]) => {
    const cleanName = String(name || '').trim()
    if (!cleanName) return
    if (value == null) return

    const cleanValue = String(value).trim()
    if (!cleanValue) return

    normalized[cleanName] = cleanValue
  })

  return normalized
}

function putFileWithProgress({
  uploadUrl,
  file,
  headers = {},
  signal,
  onUploadProgress,
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let settled = false

    const settleResolve = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    const settleReject = (error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const onAbortSignal = () => {
      try {
        xhr.abort()
      } catch {}
      settleReject(createAbortError())
    }

    const cleanup = () => {
      if (signal) {
        try {
          signal.removeEventListener('abort', onAbortSignal)
        } catch {}
      }
    }

    if (signal?.aborted) {
      settleReject(createAbortError())
      return
    }

    if (signal) {
      try {
        signal.addEventListener('abort', onAbortSignal, { once: true })
      } catch {}
    }

    xhr.open('PUT', uploadUrl, true)

    const uploadHeaders = normalizeUploadHeaders(headers)
    Object.entries(uploadHeaders).forEach(([name, value]) => {
      try {
        xhr.setRequestHeader(name, value)
      } catch {}
    })

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !event.total) return

      const pct = Math.max(0, Math.min(100, (event.loaded / event.total) * 100))
      try {
        onUploadProgress?.(pct)
      } catch {}
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          onUploadProgress?.(100)
        } catch {}
        settleResolve()
        return
      }

      settleReject(
        new Error(
          `R2 upload failed with HTTP ${xhr.status}${xhr.responseText ? `: ${xhr.responseText}` : ''}`,
        ),
      )
    }

    xhr.onerror = () => {
      settleReject(
        new Error(
          'R2 upload failed: network/CORS error. Check Cloudflare R2 bucket CORS Policy for PUT from the current site.',
        ),
      )
    }

    xhr.onabort = () => {
      settleReject(createAbortError())
    }

    xhr.send(file)
  })
}

export default async function uploadR2MediaFile({
  file,
  kind = 'forum_video',
  userId = '',
  filename = '',
  contentType = '',
  signal,
  onUploadProgress,
} = {}) {
  if (!file) {
    throw new Error('R2 upload file is required')
  }

  const resolvedFilename = String(filename || file?.name || 'media').trim() || 'media'
  const resolvedContentType = String(contentType || file?.type || 'application/octet-stream').trim()
  const size = Number(file?.size || 0)

  const signResponse = await fetch('/api/forum/blobUploadUrl', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(userId ? { 'x-forum-user-id': String(userId) } : {}),
    },
    body: JSON.stringify({
      filename: resolvedFilename,
      name: resolvedFilename,
      contentType: resolvedContentType,
      mime: resolvedContentType,
      size,
      kind,
      userId,
    }),
    signal,
  })

  const signPayload = await readJsonResponse(signResponse)
  if (!signResponse.ok || !signPayload?.ok) {
    throw new Error(parseUploadErrorPayload(signPayload, `R2 sign failed with HTTP ${signResponse.status}`))
  }

  const uploadUrl = String(signPayload.uploadUrl || '').trim()
  const publicUrl = String(signPayload.publicUrl || signPayload.url || '').trim()
  const key = String(signPayload.key || signPayload.pathname || '').trim()

  if (!uploadUrl || !publicUrl) {
    throw new Error('R2 sign response is missing uploadUrl or publicUrl')
  }

  await putFileWithProgress({
    uploadUrl,
    file,
    headers: signPayload.headers || {},
    signal,
    onUploadProgress,
  })

  return {
    ok: true,
    key,
    url: publicUrl,
    publicUrl,
    pathname: key,
  }
}
