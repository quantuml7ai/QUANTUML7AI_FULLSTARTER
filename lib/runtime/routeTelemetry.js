const ALLOWED_COUNTERS = new Set(['mongo', 'redis', 'upstream', 'result'])

const NOOP_CONTEXT = Object.freeze({
  count() {},
  setResultCount() {},
})

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boundedText(value, fallback, maxLength = 80) {
  const text = String(value || '').trim()
  if (!text || !/^[a-z0-9_.:-]+$/iu.test(text)) return fallback
  return text.slice(0, maxLength)
}

function roundMetric(value) {
  return Math.round(finiteNumber(value, 0) * 1000) / 1000
}

export function resolveRouteTelemetrySampleRate(env = process.env) {
  const configured = String(env?.QL7_ROUTE_TELEMETRY_SAMPLE_RATE || '').trim()
  if (!configured) return String(env?.VERCEL || '').trim() === '1' ? 0.01 : 0
  return Math.max(0, Math.min(1, finiteNumber(configured, 0)))
}

export function shouldSampleRouteTelemetry({ sampleRate, random = Math.random } = {}) {
  const rate = Math.max(0, Math.min(1, finiteNumber(sampleRate, 0)))
  if (rate <= 0) return false
  if (rate >= 1) return true
  return finiteNumber(random(), 1) < rate
}

function defaultSink(event) {
  console.info('[ql7-route-telemetry]', JSON.stringify(event))
}

export async function withRouteTelemetry(options = {}, handler) {
  if (typeof handler !== 'function') throw new TypeError('route_telemetry_handler_required')

  const sampleRate = options.sampleRate ?? resolveRouteTelemetrySampleRate()
  if (!shouldSampleRouteTelemetry({ sampleRate, random: options.random })) {
    return handler(NOOP_CONTEXT)
  }

  const clock = typeof options.clock === 'function' ? options.clock : () => performance.now()
  const cpuUsage = typeof options.cpuUsage === 'function' ? options.cpuUsage : process.cpuUsage.bind(process)
  const memoryUsage = typeof options.memoryUsage === 'function' ? options.memoryUsage : process.memoryUsage.bind(process)
  const sink = typeof options.sink === 'function' ? options.sink : defaultSink
  const counters = Object.create(null)
  let resultCount = null
  let response = null
  let thrown = null

  const context = Object.freeze({
    count(name, amount = 1) {
      const key = String(name || '').trim().toLowerCase()
      if (!ALLOWED_COUNTERS.has(key)) return
      counters[key] = Math.max(0, finiteNumber(counters[key], 0) + finiteNumber(amount, 0))
    },
    setResultCount(value) {
      const count = finiteNumber(value, -1)
      if (count >= 0) resultCount = Math.floor(count)
    },
  })

  const startedAt = clock()
  const startedCpu = cpuUsage()
  const startedRss = finiteNumber(memoryUsage()?.rss, 0)

  try {
    response = await handler(context)
    return response
  } catch (error) {
    thrown = error
    throw error
  } finally {
    const durationMs = Math.max(0, finiteNumber(clock(), startedAt) - startedAt)
    const cpu = cpuUsage(startedCpu) || {}
    const rssDeltaBytes = finiteNumber(memoryUsage()?.rss, startedRss) - startedRss
    const status = Number(response?.status || (thrown ? 500 : 200)) || 500
    const event = Object.freeze({
      schema: 1,
      kind: 'ql7.route.sample',
      route: boundedText(options.route, 'unknown'),
      method: boundedText(options.method, 'GET', 12).toUpperCase(),
      variant: boundedText(options.variant, 'default', 40),
      region: boundedText(process.env.VERCEL_REGION, 'local', 32),
      status,
      ok: status < 400 && !thrown,
      durationMs: roundMetric(durationMs),
      cpuMs: roundMetric((finiteNumber(cpu.user, 0) + finiteNumber(cpu.system, 0)) / 1000),
      rssDeltaBytes: Math.round(rssDeltaBytes),
      resultCount,
      counters: Object.freeze({ ...counters }),
    })

    try {
      const metric = `ql7_route;dur=${event.durationMs}`
      const previous = response?.headers?.get?.('server-timing') || ''
      response?.headers?.set?.('server-timing', previous ? `${previous}, ${metric}` : metric)
    } catch {}

    try { sink(event) } catch {}
  }
}
