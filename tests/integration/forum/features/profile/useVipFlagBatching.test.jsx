import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import useVipFlag, { queueVipProbes } from '../../../../../app/forum/features/profile/hooks/useVipFlag'

function okVipResponse(ids, checkedAt = Date.now()) {
  return {
    json: async () => ({
      ok: true,
      checkedAt,
      map: Object.fromEntries(
        ids.map((id) => [id, {
          available: true,
          active: false,
          untilISO: null,
          untilMs: 0,
          daysLeft: 0,
          checkedAt,
        }]),
      ),
      unavailableIds: [],
    }),
  }
}

describe('forum VIP batch broker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('coalesces one page into one request and suppresses queued/in-flight card duplicates', async () => {
    const pending = []
    const fetchMock = vi.fn(() => new Promise((resolve) => pending.push(resolve)))
    vi.stubGlobal('fetch', fetchMock)

    const pageIds = Array.from({ length: 40 }, (_, index) => `account:page-${index + 1}`)

    expect(queueVipProbes(pageIds)).toBe(40)
    expect(queueVipProbes([pageIds[0], pageIds[1], pageIds[0]])).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(119)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(firstBody.ids).toHaveLength(40)
    expect(new Set(firstBody.ids).size).toBe(40)

    // Cards can mount while the shared page probe is still waiting on the
    // server. Those identities must stay attached to the in-flight batch and
    // must not create another Vercel invocation.
    expect(queueVipProbes([pageIds[0], pageIds[1], pageIds[2]])).toBe(0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    pending.shift()(okVipResponse(pageIds))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const highWaterIds = Array.from({ length: 96 }, (_, index) => `account:high-water-${index + 1}`)
    expect(queueVipProbes(highWaterIds)).toBe(96)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(secondBody.ids).toHaveLength(96)
    expect(new Set(secondBody.ids).size).toBe(96)

    pending.shift()(okVipResponse(highWaterIds))
    await vi.advanceTimersByTimeAsync(0)
  })

  it('extends only the quiet window while keeping a hard 800ms maximum wait', async () => {
    const pending = []
    const fetchMock = vi.fn(() => new Promise((resolve) => pending.push(resolve)))
    vi.stubGlobal('fetch', fetchMock)

    for (let index = 0; index < 8; index += 1) {
      queueVipProbes([`account:drip-${index + 1}`])
      if (index < 7) {
        await vi.advanceTimersByTimeAsync(100)
        expect(fetchMock).not.toHaveBeenCalled()
      }
    }

    await vi.advanceTimersByTimeAsync(99)
    expect(fetchMock).not.toHaveBeenCalled()

    // First identity entered at t=0. Continuous additions may re-arm the
    // 120ms quiet window, but they can never push the shared batch past 800ms.
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.ids).toHaveLength(8)

    pending.shift()(okVipResponse(body.ids))
    await vi.advanceTimersByTimeAsync(0)
  })

  it('backs off unavailable identities and retries a still-mounted subscriber without hot-looping', async () => {
    const id = 'account:temporarily-unavailable'
    let attempt = 0
    const fetchMock = vi.fn(async () => {
      attempt += 1
      if (attempt === 1) {
        return {
          json: async () => ({
            ok: true,
            checkedAt: Date.now(),
            map: {},
            unavailableIds: [id],
          }),
        }
      }
      return okVipResponse([id], Date.now())
    })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderHook(() => useVipFlag(id, null))

    await act(async () => { await vi.advanceTimersByTimeAsync(120) })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // The same mounted card must not retry on every render/windowing pulse.
    await act(async () => { await vi.advanceTimersByTimeAsync(4999) })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // First unavailable retry becomes eligible at 5s, then uses the normal
    // shared quiet window instead of bypassing batching.
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    await act(async () => { await vi.advanceTimersByTimeAsync(119) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    unmount()
  })

})
