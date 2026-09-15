import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildQuestStorageKeys } from '../utils/progress'

export default function useQuestStorageState(meUid) {
  const { questLsKey: QUEST_LS, questTimersLsKey: QUEST_TIMERS_LS } = useMemo(
    () => buildQuestStorageKeys(meUid),
    [meUid]
  )

  const [questProg, setQuestProg] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEST_LS) || '{}')
    } catch {
      return {}
    }
  })

  const writeQuestProg = useCallback((patch) => {
    setQuestProg((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : ({ ...prev, ...patch })
      try {
        localStorage.setItem(QUEST_LS, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [QUEST_LS])

  const [taskTimers, setTaskTimers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEST_TIMERS_LS) || '{}')
    } catch {
      return {}
    }
  })

  const writeTimers = useCallback((patch) => {
    setTaskTimers((prev) => {
      const next = (typeof patch === 'function') ? patch(prev) : ({ ...prev, ...patch })
      try {
        localStorage.setItem(QUEST_TIMERS_LS, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [QUEST_TIMERS_LS])

  useEffect(() => {
    try {
      setQuestProg(JSON.parse(localStorage.getItem(QUEST_LS) || '{}'))
    } catch {
      setQuestProg({})
    }
  }, [QUEST_LS])

  useEffect(() => {
    try {
      setTaskTimers(JSON.parse(localStorage.getItem(QUEST_TIMERS_LS) || '{}'))
    } catch {
      setTaskTimers({})
    }
  }, [QUEST_TIMERS_LS])

  return {
    QUEST_LS,
    QUEST_TIMERS_LS,
    questProg,
    setQuestProg,
    writeQuestProg,
    taskTimers,
    setTaskTimers,
    writeTimers,
  }
}
