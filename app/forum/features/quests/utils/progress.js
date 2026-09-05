export function buildQuestStorageKeys(uid) {
  const key = String(uid || '').trim()
  return {
    questLsKey: key ? `quest:v1:${key}` : 'quest:v1:anonymous',
    questTimersLsKey: key ? `questTimers:v1:${key}` : 'questTimers:v1:anonymous',
  }
}

export function normalizeQuestCardId(value) {
  const m = String(value ?? '').match(/(\d+)$/)
  return m ? String(Number(m[1])) : String(value ?? '')
}

export function doubleQuestDecimal(value) {
  try {
    const str = String(value ?? '0')
    const [i, f = ''] = str.split('.')
    const n = BigInt((i || '0') + f)
    const d = (n * 2n).toString()
    return f
      ? (d.slice(0, -f.length) || '0') + '.' + d.slice(-f.length).padStart(f.length, '0')
      : d
  } catch {
    return value
  }
}

export function resolveQuestTotalTasks(card, readEnv) {
  const idNum = Number(String(card?.id || '').match(/(\d+)$/)?.[1] || NaN)
  const perCardRaw =
    Number.isFinite(idNum) && typeof readEnv === 'function'
      ? readEnv(`NEXT_PUBLIC_QUEST_CARD_${idNum}_TASK_COUNT`, '')
      : ''
  const perCard = Number(perCardRaw || '')

  const globalRaw =
    typeof readEnv === 'function'
      ? readEnv('NEXT_PUBLIC_QUEST_TASKS_PER_CARD', readEnv('NEXT_PUBLIC_QUEST_TASKS', '10'))
      : '10'
  const global = Number(globalRaw || '10')

  if (Number.isFinite(perCard) && perCard > 0) return perCard
  if (Array.isArray(card?.tasks) && card.tasks.length > 0) return card.tasks.length
  return Number.isFinite(global) && global > 0 ? global : 10
}
