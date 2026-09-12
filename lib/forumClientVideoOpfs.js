import { QL7_MOBILE_VIDEO_CHUNK_BYTES } from './forumClientVideoRuntime'

export const QL7_MOBILE_VIDEO_OPFS_ID = 'ql7-mobile-opfs-positional-v15-safari-probed'
export const QL7_MOBILE_VIDEO_OPFS_PROBE_MARKER = 'QL7_MOBILE_VIDEO_OPFS_RUNTIME_PROBE_V15'

function assertWorkerOpfs() {
  if (typeof globalThis.navigator?.storage?.getDirectory !== 'function') {
    const error = new Error('OPFS is unavailable in the mobile worker.')
    error.name = 'Ql7MobileOpfsError'
    error.code = 'QL7_VIDEO_MOBILE_OPFS_UNAVAILABLE'
    throw error
  }
}

function opfsError(code, message, cause = null) {
  const error = new Error(message || code)
  error.name = 'Ql7MobileOpfsError'
  error.code = code
  error.details = cause ? {
    causeName: String(cause?.name || ''),
    causeMessage: String(cause?.message || cause || ''),
  } : null
  return error
}

function safeName(value) {
  return String(value || 'video-job').replace(/[^A-Za-z0-9_.-]+/g, '_').slice(0, 120) || 'video-job'
}

async function openVideoDir() {
  assertWorkerOpfs()
  const root = await globalThis.navigator.storage.getDirectory()
  const dir = await root.getDirectoryHandle('ql7-video-v15', { create: true })
  return { root, dir }
}

async function verifyProbeFile(fileHandle, expected) {
  const file = await fileHandle.getFile()
  if (file.size !== expected.byteLength) throw opfsError('QL7_VIDEO_MOBILE_OPFS_PROBE_SIZE_MISMATCH', 'OPFS probe size did not persist.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.byteLength !== expected.byteLength) throw opfsError('QL7_VIDEO_MOBILE_OPFS_PROBE_READ_MISMATCH', 'OPFS probe could not be read back.')
  for (let i = 0; i < bytes.byteLength; i += 1) {
    if (bytes[i] !== expected[i]) throw opfsError('QL7_VIDEO_MOBILE_OPFS_PROBE_CONTENT_MISMATCH', 'OPFS probe content did not persist.')
  }
}

export async function probeQl7MobileOpfsRuntime() {
  const expected = Uint8Array.from([0x51, 0x4c, 0x37, 0x2d, 0x56, 0x31, 0x35])
  let lastError = null

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let dir = null
    let name = ''
    let accessHandle = null
    try {
      const opened = await openVideoDir()
      dir = opened.dir
      name = `__probe-${Date.now()}-${attempt}-${Math.random().toString(16).slice(2)}.bin`
      const fileHandle = await dir.getFileHandle(name, { create: true })
      accessHandle = await fileHandle.createSyncAccessHandle()
      accessHandle.truncate(0)
      const first = Number(accessHandle.write(expected.subarray(0, 3), { at: 0 }))
      const second = Number(accessHandle.write(expected.subarray(3), { at: 3 }))
      if (first !== 3 || second !== expected.byteLength - 3) {
        throw opfsError('QL7_VIDEO_MOBILE_OPFS_PROBE_SHORT_WRITE', 'OPFS runtime probe performed a short write.')
      }
      accessHandle.flush()
      accessHandle.close()
      accessHandle = null
      await verifyProbeFile(fileHandle, expected)
      try { await dir.removeEntry(name) } catch {}
      return Object.freeze({ ok: true, marker: QL7_MOBILE_VIDEO_OPFS_PROBE_MARKER, attempt })
    } catch (error) {
      lastError = error
      try { accessHandle?.close?.() } catch {}
      if (dir && name) {
        try { await dir.removeEntry(name) } catch {}
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  throw opfsError(
    'QL7_VIDEO_MOBILE_OPFS_PROBE_FAILED',
    'OPFS exists but failed a real worker write/flush/readback probe.',
    lastError,
  )
}

export async function createQl7MobileOpfsWorkspace(jobId) {
  const { root, dir } = await openVideoDir()
  const prefix = safeName(jobId)
  const names = new Set()

  const createFile = async (label) => {
    const name = `${prefix}-${safeName(label)}.mp4`
    names.add(name)
    const fileHandle = await dir.getFileHandle(name, { create: true })
    const accessHandle = await fileHandle.createSyncAccessHandle()
    accessHandle.truncate(0)
    return { name, fileHandle, accessHandle }
  }

  const remove = async (name) => {
    if (!name) return
    try { await dir.removeEntry(name) } catch {}
    names.delete(name)
  }

  const cleanup = async () => {
    for (const name of [...names]) await remove(name)
  }

  return { root, dir, createFile, remove, cleanup }
}

export function createQl7OpfsWritable(accessHandle) {
  if (!accessHandle || typeof accessHandle.write !== 'function') throw opfsError('QL7_VIDEO_MOBILE_OPFS_HANDLE_INVALID', 'OPFS access handle is invalid.')

  return new WritableStream({
    write(chunk) {
      const data = chunk?.data
      const position = Number(chunk?.position)
      if (!(data instanceof Uint8Array) || !Number.isSafeInteger(position) || position < 0) {
        throw opfsError('QL7_VIDEO_MOBILE_OPFS_CHUNK_INVALID', 'OPFS received an invalid positional chunk.')
      }
      let offset = 0
      while (offset < data.byteLength) {
        const part = offset === 0 ? data : data.subarray(offset)
        const written = Number(accessHandle.write(part, { at: position + offset }))
        if (!Number.isInteger(written) || written <= 0 || written > part.byteLength) {
          throw opfsError('QL7_VIDEO_MOBILE_OPFS_SHORT_WRITE', 'OPFS performed a short positional write.')
        }
        offset += written
      }
    },
    close() {
      accessHandle.flush()
    },
    abort() {
      try { accessHandle.flush() } catch {}
    },
  }, {
    highWaterMark: 1,
  })
}

export function ql7MobileStreamTargetOptions() {
  return Object.freeze({
    chunked: true,
    chunkSize: QL7_MOBILE_VIDEO_CHUNK_BYTES,
  })
}
