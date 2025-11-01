// app/api/quest/env/route.js
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// ===== Allow-list публичных ключей (и легаси) =====
const ALLOWED_PREFIXES = [
  'NEXT_PUBLIC_QUEST',  // всё новое
  'QUEST_CARD_',        // LEGACY: QUEST_CARD_{n}_REWARD
  'QUEST_TASK_',        // LEGACY: QUEST_TASK_{n}_T{m}_URL
]

// ===== utils =====
const clean = (v) => String(v ?? '').trim()

const toInt = (v, d = 0) => {
  const n = Number.parseInt(clean(v), 10)
  return Number.isFinite(n) ? n : d
}
const toNum = (v, d = 0) => {
  const n = Number(clean(v))
  return Number.isFinite(n) ? n : d
}
const toBool = (v, d = false) => {
  const s = clean(v)
  if (s === '') return d
  const low = s.toLowerCase()
  return s === '1' || low === 'true' || low === 'yes' || low === 'on'
}

function pickEnv() {
  const out = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (!v) continue
    if (ALLOWED_PREFIXES.some((p) => k.startsWith(p))) out[k] = String(v)
  }
  return out
}

// ===== helpers for specific keys =====
function getTaskUrl(env, cardIndex, taskIndex) {
  const k1 = `NEXT_PUBLIC_QUEST${cardIndex}_T${taskIndex}_URL`
  if (env[k1]) return clean(env[k1])
  const k2 = `QUEST_TASK_${cardIndex}_T${taskIndex}_URL` // legacy
  if (env[k2]) return clean(env[k2])
  return ''
}
function getReward(env, cardIndex) {
  const k1 = `NEXT_PUBLIC_QUEST${cardIndex}_REWARD`
  if (env[k1]) return clean(env[k1])
  const k2 = `QUEST_CARD_${cardIndex}_REWARD` // legacy
  if (env[k2]) return clean(env[k2])
  return '0'
}

// ===== авто-детект по ключам =====
function detectMaxCardIndex(env) {
  let max = 0
  const reNew = /^NEXT_PUBLIC_QUEST(\d+)_(?:REWARD|T\d+_URL|CARD_\d+_.*|MEDIA_.*|TASK_.*)$/i
  const reLegacyReward = /^QUEST_CARD_(\d+)_REWARD$/i
  const reLegacyTask = /^QUEST_TASK_(\d+)_T\d+_URL$/i
  for (const k of Object.keys(env)) {
    let m = k.match(reNew) || k.match(reLegacyReward) || k.match(reLegacyTask)
    if (m) max = Math.max(max, Number(m[1] || 0))
  }
  return max
}
function detectTaskCountForCard(env, n, fallback) {
  // 1) явный per-card
  const per = toInt(env[`NEXT_PUBLIC_QUEST_CARD_${n}_TASK_COUNT`], NaN)
  if (Number.isFinite(per) && per >= 0) return per
  // 2) по наличию URL-ключей
  let max = 0
  const re = new RegExp(`^NEXT_PUBLIC_QUEST${n}_T(\\d+)_URL$`, 'i')
  for (const k of Object.keys(env)) {
    const m = k.match(re)
    if (m) max = Math.max(max, Number(m[1] || 0))
  }
  if (max > 0) return max
  // legacy
  let maxLegacy = 0
  const reL = new RegExp(`^QUEST_TASK_${n}_T(\\d+)_URL$`, 'i')
  for (const k of Object.keys(env)) {
    const m = k.match(reL)
    if (m) maxLegacy = Math.max(maxLegacy, Number(m[1] || 0))
  }
  if (maxLegacy > 0) return maxLegacy
  // 3) дефолт
  return fallback
}

// ===== core builder =====
function buildMeta(env) {
  const enabled = toBool(env.NEXT_PUBLIC_QUEST_ENABLED, true)

  // global defaults
  const defaultTasksPerCard = Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASKS_PER_CARD, 10))
  const defaultTaskDelayMs  = Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_TASK_DELAY_MS, 15000))
  const claimDelayMs        = Math.max(0, toInt(env.NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS, 0))

  // cards count: явный -> fallback -> авто-детект
  let cardCount = toInt(env.NEXT_PUBLIC_QUEST_CARD_COUNT,
                   toInt(env.NEXT_PUBLIC_QUEST_CARDS, 0))
  if (cardCount <= 0) cardCount = detectMaxCardIndex(env)

  const cards = []
  const missing = [] // список ожидаемых, но отсутствующих ключей (для дебага UI)

  for (let n = 1; n <= cardCount; n++) {
    const cardEnabled = toBool(env[`NEXT_PUBLIC_QUEST_CARD_${n}_ENABLED`], true)

    const taskCount = Math.max(
      0,
      detectTaskCountForCard(env, n, defaultTasksPerCard)
    )
    const taskDelay = Math.max(
      0,
      toInt(env[`NEXT_PUBLIC_QUEST_CARD_${n}_TASK_DELAY_MS`], defaultTaskDelayMs)
    )

    const reward = getReward(env, n)
    if (reward === '0') {
      const rk = `NEXT_PUBLIC_QUEST${n}_REWARD`
      if (!env[rk] && !env[`QUEST_CARD_${n}_REWARD`]) {
        missing.push(rk) // подсветим что забыли
      }
    }

    const media = {
      name: clean(env[`NEXT_PUBLIC_QUEST_CARD_${n}_MEDIA_NAME`]),
      ext : clean(env[`NEXT_PUBLIC_QUEST_CARD_${n}_MEDIA_EXT`]),
    }

    const tasks = []
    for (let m = 1; m <= taskCount; m++) {
      const url = getTaskUrl(env, n, m)
      if (!url) {
        const k = `NEXT_PUBLIC_QUEST${n}_T${m}_URL`
        if (!env[k] && !env[`QUEST_TASK_${n}_T${m}_URL`]) missing.push(k)
      }
      tasks.push({ index: m, url })
    }

    cards.push({
      id: n,
      enabled: cardEnabled,
      reward,
      taskCount,
      taskDelayMs: taskDelay,
      claimDelayMs, // совместимость
      media,
      tasks,
    })
  }

  return {
    enabled,
    cardCount,
    defaults: {
      tasksPerCard: defaultTasksPerCard,
      taskDelayMs : defaultTaskDelayMs,
      claimDelayMs,
    },
    cards,
    missing, // можно скрыть на проде, если не нужно
  }
}

// ===== handler =====
export async function GET() {
  try {
    const env = pickEnv()
    const meta = buildMeta(env)

    return NextResponse.json(
      { ok: true, env, meta },
      {
        status: 200,
        headers: {
          'cache-control': 'no-store, max-age=0',
          // чтобы браузер/веркел не закешировали JSON
          'x-quest-env': 'runtime',
        },
      },
    )
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}
