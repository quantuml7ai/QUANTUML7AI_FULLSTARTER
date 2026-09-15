'use client'

const COUNT_UNITS = Object.freeze([
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
])

function toFiniteNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  if (typeof input === 'bigint') {
    const parsed = Number(input)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const raw = String(input ?? '').trim()
  if (!raw) return 0
  const normalized = raw.replace(/[\s_]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function trimCountDecimal(value) {
  return String(value)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*[1-9])0+$/, '$1')
}

export function formatCount(input) {
  const x = toFiniteNumber(input)
  const sign = x < 0 ? '-' : ''
  const abs = Math.abs(x)

  if (abs < 1000) return `${sign}${Math.trunc(abs)}`

  for (let i = 0; i < COUNT_UNITS.length; i += 1) {
    const unit = COUNT_UNITS[i]
    if (abs < unit.value) continue

    const scaled = abs / unit.value
    const decimals = scaled >= 10 ? 0 : 1
    let rounded = Number(scaled.toFixed(decimals))
    let suffix = unit.suffix

    // Не отдаём 1000K / 1000M: поднимаем число на следующий уровень.
    if (rounded >= 1000 && i > 0) {
      const nextUnit = COUNT_UNITS[i - 1]
      const nextScaled = abs / nextUnit.value
      const nextDecimals = nextScaled >= 10 ? 0 : 1
      rounded = Number(nextScaled.toFixed(nextDecimals))
      suffix = nextUnit.suffix
    }

    return `${sign}${trimCountDecimal(rounded)}${suffix}`
  }

  return `${sign}${Math.trunc(abs)}`
}
