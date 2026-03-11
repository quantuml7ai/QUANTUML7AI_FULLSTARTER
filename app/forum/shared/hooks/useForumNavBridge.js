import { useCallback, useRef } from 'react'

import { useEvent } from './useEvent'

const DEFAULT_NAV_ACTIONS = {
  getScrollEl: () => null,
  alignInboxStartUnderTabs: () => {},
  pushNavState: () => {},
}

export default function useForumNavBridge() {
  const navActionsRef = useRef(DEFAULT_NAV_ACTIONS)

  const bindNavActions = useCallback((actions) => {
    navActionsRef.current = actions || DEFAULT_NAV_ACTIONS
  }, [])

  const getScrollEl = useCallback(() => {
    try {
      return navActionsRef.current.getScrollEl?.() || null
    } catch {
      return null
    }
  }, [])

  const alignInboxStartUnderTabs = useCallback((attempt = 0) => {
    try {
      navActionsRef.current.alignInboxStartUnderTabs?.(attempt)
    } catch {}
  }, [])

  const pushNavState = useCallback((entryId) => {
    try {
      navActionsRef.current.pushNavState?.(entryId)
    } catch {}
  }, [])

  const pushNavStateStable = useEvent((entryId) => pushNavState(entryId))

  return {
    bindNavActions,
    getScrollEl,
    alignInboxStartUnderTabs,
    pushNavState,
    pushNavStateStable,
  }
}
