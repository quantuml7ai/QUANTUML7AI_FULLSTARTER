import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildQuestStorageKeys, normalizeQuestCardId } from '../utils/progress'
import useQuestStorageState from './useQuestStorageState'

export default function useForumQuestProgress({
  auth,
  readEnv,
  quests,
  setQuestSel,
  pushNavStateStable,
  requireAuthStrict,
  openAuth,
  toast,
  t,
  vipActive,
}) {
  const meUid = auth?.accountId || auth?.asherId || ''
  const [claimFx, setClaimFx] = useState({ open: false, cardId: '', amount: '', pieces: [] })
  const [claimClockTick, setClaimClockTick] = useState(0)
  const {
    QUEST_LS,
    QUEST_TIMERS_LS,
    questProg,
    setQuestProg,
    writeQuestProg,
    taskTimers,
    setTaskTimers,
    writeTimers,
  } = useQuestStorageState(meUid)
  void QUEST_LS
  void QUEST_TIMERS_LS

  useEffect(() => {
    const uid = auth?.accountId || auth?.asherId || ''
    const { questLsKey, questTimersLsKey } = buildQuestStorageKeys(uid)
    ;(async () => {
      try {
        const res = await fetch('/api/quest/progress', { method: 'GET', cache: 'no-store' })
        const j = await res.json().catch(() => ({}))
        const serverEmpty = !j?.progress || Object.keys(j.progress).length === 0
        if (serverEmpty) {
          try { localStorage.removeItem(questLsKey) } catch {}
          try { localStorage.removeItem(questTimersLsKey) } catch {}
          setQuestProg({})
          setTaskTimers({})
        }
      } catch {}
    })()
  }, [auth?.accountId, auth?.asherId, setQuestProg, setTaskTimers])

  const normalizeCardId = useCallback((x) => {
    return normalizeQuestCardId(x)
  }, [])

  const taskPostInflightRef = useRef(new Set())

  const openQuestCardChecked = useCallback(async (card) => {
    try {
      let uid = auth?.accountId || auth?.asherId || ''
      if (!uid) {
        const ok = await (typeof requireAuthStrict === 'function' ? requireAuthStrict() : openAuth?.())
        if (!ok) return
        uid = auth?.accountId || auth?.asherId || ''
        if (!uid) return
      }

      const serverCardId = normalizeCardId(card?.id)
      if (!serverCardId || serverCardId === '0') return

      const r = await fetch(`/api/quest/status?cardId=${encodeURIComponent(serverCardId)}`, {
        method: 'GET',
        headers: { 'x-forum-user': uid, 'cache-control': 'no-store' },
        cache: 'no-store',
      })
      const j = await r.json().catch(() => null)

      if (j?.ok && j.claimed) {
        writeQuestProg((prev) => ({
          ...prev,
          [card.id]: {
            ...(prev[card.id] || {}),
            claimed: true,
            claimTs: Date.now(),
          },
        }))
        try { toast?.ok?.(t('quest_done')) } catch {}
        return
      }

      try { pushNavStateStable(`quest_card_${String(card?.id || '')}`) } catch {}
      setQuestSel(card)
    } catch {
      try { pushNavStateStable(`quest_card_${String(card?.id || '')}`) } catch {}
      setQuestSel(card)
    }
  }, [
    auth?.accountId,
    auth?.asherId,
    normalizeCardId,
    openAuth,
    pushNavStateStable,
    requireAuthStrict,
    setQuestSel,
    t,
    toast,
    writeQuestProg,
  ])

  const taskDelayMs = useMemo(() => {
    const g1 = Number(readEnv?.('NEXT_PUBLIC_QUEST_TASK_DELAY_MS', 'NaN'))
    const g2 = Number(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_TASK_DELAY_MS', 'NaN'))
    const g3 = Number(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS', 'NaN'))
    const pick = [g1, g2, g3].find((n) => Number.isFinite(n) && n >= 0)
    return Math.max(0, pick ?? 15000)
  }, [readEnv])

  const getTaskFirstTs = useCallback((qid, tid) => {
    const c = taskTimers?.[qid]
    if (!c) return 0
    return Number(c[tid] || 0)
  }, [taskTimers])

  const getTaskRemainMs = useCallback((qid, tid) => {
    const ts = getTaskFirstTs(qid, tid)
    if (!ts) return taskDelayMs
    return Math.max(0, taskDelayMs - (Date.now() - ts))
  }, [getTaskFirstTs, taskDelayMs])

  const isTaskReady = useCallback((qid, tid) => getTaskRemainMs(qid, tid) <= 0, [getTaskRemainMs])

  const spawnCoins = useCallback((count = 28) => {
    const out = []
    for (let i = 0; i < count; i += 1) {
      const x = (Math.random() * 80 - 40)
      const delay = Math.random() * 320
      const size = 14 + Math.round(Math.random() * 10)
      out.push({ id: `c${i}`, x, delay, size })
    }
    return out
  }, [])

  const getCardTotalTasks = useCallback((qid) => {
    const card = quests?.find((q) => String(q.id) === String(qid))
    if (Array.isArray(card?.tasks) && card.tasks.length) return card.tasks.length

    const m = String(qid || '').match(/(\d+)$/)
    const idx = m ? Number(m[1]) : NaN
    const perCard = Number(readEnv?.(`NEXT_PUBLIC_QUEST_CARD_${idx}_TASK_COUNT`, 'NaN'))
    if (Number.isFinite(perCard) && perCard > 0) return perCard

    const g1 = Number(readEnv?.('NEXT_PUBLIC_QUEST_TASKS_PER_CARD', 'NaN'))
    const g2 = Number(readEnv?.('NEXT_PUBLIC_QUEST_TASKS', 'NaN'))
    const global = Number.isFinite(g1) ? g1 : g2
    return Math.max(1, Number.isFinite(global) && global > 0 ? global : 10)
  }, [quests, readEnv])

  const markTaskDone = useCallback(async (qid, tid) => {
    writeQuestProg((prev) => {
      const cardPrev = { ...(prev[qid] || {}) }
      const done = new Set(cardPrev.done || [])
      done.add(String(tid))
      const next = { ...cardPrev, done: Array.from(done), ts: Date.now() }
      const total = getCardTotalTasks(qid)
      if ((cardPrev.done?.length || 0) < total && next.done.length >= total && !next.claimReadyTs) {
        next.claimReadyTs = Date.now()
      }
      return { ...prev, [qid]: next }
    })

    writeTimers((prev) => {
      const card = { ...(prev[qid] || {}) }
      if (!card[String(tid)]) card[String(tid)] = Date.now()
      return { ...prev, [qid]: card }
    })

    try {
      const uid = auth?.accountId || auth?.asherId || ''
      if (!uid) return

      const serverCardId = normalizeCardId(qid)
      const taskNum = String(tid)
      if (!serverCardId || !taskNum) return

      const flightKey = `${uid}::${serverCardId}::${taskNum}`
      if (taskPostInflightRef.current.has(flightKey)) return
      taskPostInflightRef.current.add(flightKey)

      const r = await fetch('/api/quest/progress', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forum-user': uid,
          'x-forum-vip': vipActive ? '1' : '0',
        },
        cache: 'no-store',
        body: JSON.stringify({ cardId: serverCardId, taskId: taskNum, accountId: uid }),
      })
      let j = null
      try { j = await r.json() } catch {}

      if (j?.ok && j?.serverClaimable) {
        writeQuestProg((prev) => {
          const card = { ...(prev[qid] || {}) }
          if (!card.claimReadyTs) card.claimReadyTs = Date.now()
          return { ...prev, [qid]: card }
        })
      }
    } catch {
      // no-op
    } finally {
      try {
        const uid = auth?.accountId || auth?.asherId || ''
        if (uid) {
          const serverCardId = normalizeCardId(qid)
          const flightKey = `${uid}::${serverCardId}::${String(tid)}`
          taskPostInflightRef.current.delete(flightKey)
        }
      } catch {}
    }
  }, [
    auth?.accountId,
    auth?.asherId,
    getCardTotalTasks,
    normalizeCardId,
    vipActive,
    writeQuestProg,
    writeTimers,
  ])

  const isCardCompleted = useCallback((qid) => {
    const card = questProg?.[qid]
    const total = getCardTotalTasks(qid)
    return !!(card && Array.isArray(card.done) && card.done.length >= total)
  }, [getCardTotalTasks, questProg])

  const minClaimDelayMs = useMemo(() => {
    const raw = String(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_OVERLAY_DELAY_MS', '0') || '0')
    const normalized = raw.replace(/[\s_]+/g, '')
    const parsed = Number(normalized)
    return Math.max(0, Number.isFinite(parsed) ? parsed : 0)
  }, [readEnv])

  const isCardClaimable = useCallback((qid) => {
    const card = questProg?.[qid]
    const total = getCardTotalTasks(qid)
    if (!card || !Array.isArray(card.done) || card.done.length < total) return false
    const allIds = Array.from({ length: total }, (_, i) => String(i + 1))
    const allReady = allIds.every((tid) => isTaskReady(qid, tid))
    if (!allReady) return false
    const ts = Number(card.claimReadyTs || 0)
    return !!ts && (Date.now() - ts) >= minClaimDelayMs
  }, [getCardTotalTasks, isTaskReady, minClaimDelayMs, questProg])

  const hasPendingClaimCards = useMemo(() => {
    return Object.entries(questProg || {}).some(([qid, v]) => {
      const total = getCardTotalTasks(qid)
      return Array.isArray(v?.done) && v.done.length >= total && !v.claimed
    })
  }, [getCardTotalTasks, questProg])

  useEffect(() => {
    if (!hasPendingClaimCards) return undefined
    const id = setInterval(() => {
      setClaimClockTick((v) => (v + 1) & 4095)
    }, 1000)
    return () => clearInterval(id)
  }, [hasPendingClaimCards])

  useEffect(() => {
    const entry = Object.entries(questProg || {}).find(([qid, v]) => {
      const total = getCardTotalTasks(qid)
      const allIds = Array.from({ length: total }, (_, i) => String(i + 1))
      const allReady = allIds.every((tid) => isTaskReady(qid, tid))
      return (
        Array.isArray(v?.done) &&
        v.done.length >= total &&
        v.claimReadyTs &&
        !v.claimed &&
        allReady &&
        (Date.now() - v.claimReadyTs) >= minClaimDelayMs
      )
    })
    if (!entry) return

    const [cardId] = entry
    const qq = quests.find((q) => q.id === cardId)
    if (!qq) return
    const base = (readEnv?.(qq.rewardKey, '') || '0').trim()
    if (!base || base === '0') return
    const amount = vipActive ? String(Number(base) * 2) : base
    setClaimFx({ open: true, cardId, amount, pieces: spawnCoins(28) })
  }, [claimClockTick, getCardTotalTasks, isTaskReady, minClaimDelayMs, questProg, quests, readEnv, spawnCoins, vipActive])

  return {
    meUid,
    claimFx,
    setClaimFx,
    questProg,
    writeQuestProg,
    taskTimers,
    writeTimers,
    readEnv,
    openQuestCardChecked,
    taskDelayMs,
    getTaskRemainMs,
    markTaskDone,
    isCardCompleted,
    isCardClaimable,
    getCardTotalTasks,
    normalizeCardId,
  }
}
