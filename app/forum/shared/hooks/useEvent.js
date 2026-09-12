'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Stable event callback that always calls the latest handler.
 * Useful for effects/timers/listeners without stale closures.
 */
export function useEvent(handler) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  return useCallback((...args) => handlerRef.current?.(...args), [])
}

export default useEvent
