export const QL7_SUPPORT_TEMPORAL_CONTEXT_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }

export function normalizeQl7SupportTimeZoneV12(value = '') {
  const zone = str(value)
  if (!zone || zone.length > 80) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date('2026-01-01T00:00:00.000Z'))
    return zone
  } catch {
    return 'UTC'
  }
}

export function getQl7SupportLocalTimePartsV12({ now = Date.now(), timeZone = 'UTC', locale = 'en-US' } = {}) {
  const zone = normalizeQl7SupportTimeZoneV12(timeZone)
  const date = now instanceof Date ? now : new Date(now)
  const parts = new Intl.DateTimeFormat(locale || 'en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date).reduce((acc, item) => {
    if (item.type !== 'literal') acc[item.type] = item.value
    return acc
  }, {})
  const hour = Number(parts.hour || 0)
  return Object.freeze({
    timeZone: zone,
    year: Number(parts.year || 0),
    month: Number(parts.month || 0),
    day: Number(parts.day || 0),
    hour,
    minute: Number(parts.minute || 0),
    second: Number(parts.second || 0),
    isoSource: date.toISOString(),
    daypart: hour >= 5 && hour < 12 ? 'morning' : (hour >= 12 && hour < 18 ? 'day' : (hour >= 18 && hour < 23 ? 'evening' : 'neutral')),
  })
}

export function selectQl7SupportGreetingDaypartV12(input = {}) {
  const parts = getQl7SupportLocalTimePartsV12(input)
  return Object.freeze({
    ...parts,
    allowedDayparts: parts.daypart === 'neutral' ? Object.freeze(['neutral']) : Object.freeze([parts.daypart, 'neutral']),
    mustNotUse: parts.hour >= 5 && parts.hour < 12 ? Object.freeze(['evening', 'night']) : Object.freeze([]),
  })
}
