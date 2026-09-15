import { describe, expect, test, vi } from 'vitest'
import {
  resolveRouteTelemetrySampleRate,
  shouldSampleRouteTelemetry,
  withRouteTelemetry,
} from '../../../lib/runtime/routeTelemetry.js'

describe('sampled route telemetry', () => {
  test('is disabled locally, defaults to one percent on Vercel, and clamps overrides', () => {
    expect(resolveRouteTelemetrySampleRate({})).toBe(0)
    expect(resolveRouteTelemetrySampleRate({ VERCEL: '1' })).toBe(0.01)
    expect(resolveRouteTelemetrySampleRate({ QL7_ROUTE_TELEMETRY_SAMPLE_RATE: '2' })).toBe(1)
    expect(resolveRouteTelemetrySampleRate({ QL7_ROUTE_TELEMETRY_SAMPLE_RATE: '-1' })).toBe(0)
    expect(shouldSampleRouteTelemetry({ sampleRate: 0.1, random: () => 0.09 })).toBe(true)
    expect(shouldSampleRouteTelemetry({ sampleRate: 0.1, random: () => 0.1 })).toBe(false)
  })

  test('adds no metrics or logs on the unsampled fast path', async () => {
    const sink = vi.fn()
    const response = await withRouteTelemetry({ sampleRate: 0, sink }, async (telemetry) => {
      telemetry.count('mongo')
      return new Response('ok', { status: 200 })
    })

    expect(response.status).toBe(200)
    expect(response.headers.has('server-timing')).toBe(false)
    expect(sink).not.toHaveBeenCalled()
  })

  test('emits only bounded aggregate fields and a Server-Timing sample', async () => {
    const sink = vi.fn()
    const clock = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(22.5)
    const cpuUsage = vi.fn()
      .mockReturnValueOnce({ user: 10, system: 20 })
      .mockReturnValueOnce({ user: 3000, system: 2000 })
    const memoryUsage = vi.fn()
      .mockReturnValueOnce({ rss: 1000 })
      .mockReturnValueOnce({ rss: 1256 })

    const response = await withRouteTelemetry({
      route: 'api.forum.feed.page',
      method: 'POST',
      variant: 'geo',
      sampleRate: 1,
      sink,
      clock,
      cpuUsage,
      memoryUsage,
    }, async (telemetry) => {
      telemetry.count('mongo', 2)
      telemetry.count('not-allowed', 999)
      telemetry.setResultCount(15)
      return new Response('ok', { status: 200 })
    })

    expect(response.headers.get('server-timing')).toBe('ql7_route;dur=12.5')
    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink.mock.calls[0][0]).toEqual({
      schema: 1,
      kind: 'ql7.route.sample',
      route: 'api.forum.feed.page',
      method: 'POST',
      variant: 'geo',
      region: 'local',
      status: 200,
      ok: true,
      durationMs: 12.5,
      cpuMs: 5,
      rssDeltaBytes: 256,
      resultCount: 15,
      counters: { mongo: 2 },
    })
    expect(JSON.stringify(sink.mock.calls[0][0])).not.toContain('account')
    expect(JSON.stringify(sink.mock.calls[0][0])).not.toContain('wallet')
  })

  test('records a sampled failure and preserves the original exception', async () => {
    const sink = vi.fn()
    const failure = new Error('expected_failure')

    await expect(withRouteTelemetry({ sampleRate: 1, sink }, async () => {
      throw failure
    })).rejects.toBe(failure)

    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink.mock.calls[0][0]).toMatchObject({ status: 500, ok: false })
  })

  test('classifies a completed client rejection as non-ok without changing its response', async () => {
    const sink = vi.fn()
    const response = await withRouteTelemetry({ sampleRate: 1, sink }, async () => (
      new Response('invalid', { status: 400 })
    ))

    expect(response.status).toBe(400)
    expect(sink.mock.calls[0][0]).toMatchObject({ status: 400, ok: false })
  })
})
