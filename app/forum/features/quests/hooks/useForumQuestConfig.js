import { useCallback, useEffect, useMemo, useState } from 'react'

export default function useForumQuestConfig() {
  const [questEnv, setQuestEnv] = useState(null)
  const [questMeta, setQuestMeta] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/quest/env', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!alive) return
        setQuestEnv(j?.env || {})
        setQuestMeta(j?.meta || null)
      } catch {
        if (!alive) return
        setQuestEnv({})
        setQuestMeta(null)
      }
    })()
    return () => { alive = false }
  }, [])

  const readEnv = useCallback((k, def = '') => {
    try {
      if (questEnv && Object.prototype.hasOwnProperty.call(questEnv, k)) {
        const v = questEnv[k]
        return v == null ? def : String(v)
      }
      const v = process?.env?.[k]
      return v == null ? def : String(v)
    } catch {
      return def
    }
  }, [questEnv])

  const isCardEnabled = useCallback((n) => (
    readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_ENABLED`, '1') === '1'
  ), [readEnv])

  const cardMediaExt = useCallback((n) => (
    readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_MEDIA_EXT`, 'png') || 'png'
  ).toLowerCase(), [readEnv])

  const cardMediaName = useCallback((n) => (
    readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_MEDIA_NAME`, `q${n}`) || `q${n}`
  ), [readEnv])

  const taskMediaExt = useCallback((n) => {
    const fallback = cardMediaExt(n)
    return (
      readEnv(`NEXT_PUBLIC_QUEST_CARD_${n}_TASK_MEDIA_EXT`, fallback) ||
      fallback
    ).toLowerCase()
  }, [cardMediaExt, readEnv])

  const questEnabled = readEnv('NEXT_PUBLIC_QUEST_ENABLED', '1') === '1'
  const questCards = Math.max(0, Number(readEnv('NEXT_PUBLIC_QUEST_CARDS', '10')) || 10)

  const tasksPerCard = useCallback((n) => {
    const kPer = `NEXT_PUBLIC_QUEST_CARD_${n}_TASK_COUNT`
    const vPer = Number(readEnv(kPer, 'NaN'))
    if (Number.isFinite(vPer) && vPer > 0) return Math.max(1, vPer)
    const vGlob1 = Number(readEnv('NEXT_PUBLIC_QUEST_TASKS_PER_CARD', 'NaN'))
    const vGlob2 = Number(readEnv('NEXT_PUBLIC_QUEST_TASKS', 'NaN'))
    const g = Number.isFinite(vGlob1) ? vGlob1 : vGlob2
    return Math.max(1, Number.isFinite(g) ? g : 10)
  }, [readEnv])

  const quests = useMemo(() => {
    try {
      const raw = readEnv('NEXT_PUBLIC_QUESTS', '')
      if (raw) {
        const j = JSON.parse(raw)
        if (Array.isArray(j) && j.length) return j
      }
    } catch {}

    const mk = (n) => {
      const base = cardMediaName(n)
      const extCard = cardMediaExt(n)
      const extTask = taskMediaExt(n)
      const cover = `/Quest/${base}.${extCard}`
      const coverType = extCard === 'mp4' ? 'mp4' : (extCard === 'gif' ? 'gif' : 'img')
      const m = tasksPerCard(n)
      return {
        id: `quest-${n}`,
        i18nKey: `quest_card_${n}`,
        rewardKey: `NEXT_PUBLIC_QUEST${n}_REWARD`,
        cover,
        coverType,
        tasks: Array.from({ length: m }, (_, i) => ({
          id: String(i + 1),
          i18nKey: `quest_${n}_t${i + 1}`,
          urlKey: `NEXT_PUBLIC_QUEST${n}_T${i + 1}_URL`,
          cover: `/Quest/q${n}/${i + 1}.${extTask}`,
        })),
      }
    }

    const all = Array.from({ length: questCards }, (_, i) => mk(i + 1))
    return all.filter((_, i) => isCardEnabled(i + 1))
  }, [readEnv, tasksPerCard, questCards, cardMediaExt, cardMediaName, isCardEnabled, taskMediaExt])

  return {
    questEnv,
    questMeta,
    readEnv,
    questEnabled,
    questCards,
    tasksPerCard,
    quests,
  }
}
