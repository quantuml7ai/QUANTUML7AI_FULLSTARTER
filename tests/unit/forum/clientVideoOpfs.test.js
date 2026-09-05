import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  createQl7OpfsWritable,
  probeQl7MobileOpfsRuntime,
  QL7_MOBILE_VIDEO_OPFS_ID,
  QL7_MOBILE_VIDEO_OPFS_PROBE_MARKER,
  ql7MobileStreamTargetOptions,
} from '../../../lib/forumClientVideoOpfs'

const originalNavigator = globalThis.navigator

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalNavigator !== undefined) vi.stubGlobal('navigator', originalNavigator)
})

describe('mobile OPFS positional writer V15 Safari resilience', () => {
  test('honors StreamTarget byte positions and partial writes', async () => {
    const bytes = new Uint8Array(16)
    const handle = {
      write(data, { at }) {
        const count = Math.max(1, Math.floor(data.byteLength / 2))
        bytes.set(data.subarray(0, count), at)
        return count
      },
      flush() {},
    }
    const writable = createQl7OpfsWritable(handle)
    const writer = writable.getWriter()
    await writer.write({ type: 'write', data: Uint8Array.from([5, 6, 7, 8]), position: 6 })
    await writer.write({ type: 'write', data: Uint8Array.from([1, 2, 3]), position: 1 })
    await writer.close()
    expect([...bytes.slice(1, 4)]).toEqual([1, 2, 3])
    expect([...bytes.slice(6, 10)]).toEqual([5, 6, 7, 8])
  })

  test('pins one-megabyte chunked writes and the Safari-probed OPFS identity', () => {
    expect(QL7_MOBILE_VIDEO_OPFS_ID).toBe('ql7-mobile-opfs-positional-v15-safari-probed')
    expect(QL7_MOBILE_VIDEO_OPFS_PROBE_MARKER).toBe('QL7_MOBILE_VIDEO_OPFS_RUNTIME_PROBE_V15')
    expect(ql7MobileStreamTargetOptions()).toEqual({ chunked: true, chunkSize: 1024 * 1024 })
  })

  test('performs a real worker-style write flush close and readback probe', async () => {
    const storage = new Map()
    const makeFileHandle = (name) => ({
      async createSyncAccessHandle() {
        return {
          truncate(size) {
            storage.set(name, new Uint8Array(size))
          },
          write(data, { at }) {
            const current = storage.get(name) || new Uint8Array(0)
            const needed = Math.max(current.byteLength, at + data.byteLength)
            const next = new Uint8Array(needed)
            next.set(current)
            next.set(data, at)
            storage.set(name, next)
            return data.byteLength
          },
          flush() {},
          close() {},
        }
      },
      async getFile() {
        return new Blob([storage.get(name) || new Uint8Array(0)])
      },
    })
    const dir = {
      async getFileHandle(name) { return makeFileHandle(name) },
      async removeEntry(name) { storage.delete(name) },
    }
    vi.stubGlobal('navigator', {
      storage: {
        async getDirectory() {
          return {
            async getDirectoryHandle() { return dir },
          }
        },
      },
    })

    const result = await probeQl7MobileOpfsRuntime()
    expect(result.ok).toBe(true)
    expect(result.marker).toBe('QL7_MOBILE_VIDEO_OPFS_RUNTIME_PROBE_V15')
    expect(storage.size).toBe(0)
  })
})
