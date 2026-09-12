import { afterEach, describe, expect, it, vi } from 'vitest'
import { readAudioDurationSec } from '../../../../../../app/forum/features/media/utils/mediaRuntime.js'

describe('readAudioDurationSec', () => {
  const originalDocument = globalThis.document

  afterEach(() => {
    if (typeof originalDocument === 'undefined') delete globalThis.document
    else globalThis.document = originalDocument
    vi.useRealTimers()
  })

  function installFakeAudio({ onInit }) {
    globalThis.document = {
      createElement: vi.fn((tagName) => {
        if (tagName !== 'audio') return {}
        const listeners = new Map()
        const audio = {
          duration: 0,
          currentTime: 0,
          readyState: 0,
          seekable: {
            length: 0,
            end: () => 0,
          },
          preload: 'metadata',
          addEventListener(name, handler) {
            const list = listeners.get(name) || []
            list.push(handler)
            listeners.set(name, list)
          },
          removeEventListener(name, handler) {
            const list = listeners.get(name) || []
            listeners.set(name, list.filter((item) => item !== handler))
          },
          pause() {},
          removeAttribute() {},
          load() {},
        }
        Object.defineProperty(audio, 'src', {
          configurable: true,
          enumerable: true,
          get() {
            return this._src || ''
          },
          set(value) {
            this._src = value
          },
        })
        const emit = (name) => {
          const list = listeners.get(name) || []
          list.forEach((handler) => handler())
        }
        onInit?.(audio, emit)
        return audio
      }),
    }
  }

  it('resolves when duration becomes available after durationchange', async () => {
    vi.useFakeTimers()
    installFakeAudio({
      onInit(audio, emit) {
        setTimeout(() => {
          audio.duration = 12.4
          audio.readyState = 2
          emit('durationchange')
        }, 20)
      },
    })

    const promise = readAudioDurationSec('https://cdn.example.com/voice.webm', 200)
    await vi.advanceTimersByTimeAsync(30)

    await expect(promise).resolves.toBe(12.4)
  })

  it('falls back to seekable range when direct duration stays unavailable', async () => {
    vi.useFakeTimers()
    installFakeAudio({
      onInit(audio, emit) {
        setTimeout(() => {
          audio.duration = Number.POSITIVE_INFINITY
          audio.readyState = 2
          audio.seekable = {
            length: 1,
            end: () => 9.25,
          }
          emit('loadeddata')
        }, 20)
      },
    })

    const promise = readAudioDurationSec('https://cdn.example.com/voice.webm', 200)
    await vi.advanceTimersByTimeAsync(30)

    await expect(promise).resolves.toBe(9.25)
  })
})
