'use client'

import { useEffect, useLayoutEffect } from 'react'
import { registerVisualScope } from '../../lib/visual-runtime/visualActivityRegistry'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function useRenderManagedScope(ref, {
  kind = 'card',
  marginProfile = 'near100',
  rootStrategy = 'nearest-marker',
  initialNear = true,
  pauseCss = true,
  pauseJs = false,
} = {}) {
  useBrowserLayoutEffect(() => {
    const node = ref?.current
    if (!(node instanceof Element)) return undefined

    return registerVisualScope(node, {
      kind,
      marginProfile,
      rootStrategy,
      initialNear,
      pauseCss,
      pauseJs,
      publishState: false,
      renderManaged: true,
    })
  }, [ref, kind, marginProfile, rootStrategy, initialNear, pauseCss, pauseJs])
}
