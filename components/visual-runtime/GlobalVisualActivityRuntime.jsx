'use client'

import { useEffect } from 'react'
import {
  getVisualActivityFor,
  getVisualActivitySnapshot,
  installVisualRegistryDocumentController,
  noteStartupScopeScan,
  registerDatasetScope,
  registerNearestDatasetScope,
  teardownVisualActivityRegistry,
} from '../../lib/visual-runtime/visualActivityRegistry'
import { getAnimatedAssetSnapshot } from '../../lib/visual-runtime/animatedAssetRegistry'

let controllerGeneration = 0
let pendingDestructiveTeardown = 0

function cancelPendingDestructiveTeardown() {
  if (!pendingDestructiveTeardown || typeof window === 'undefined') return
  window.clearTimeout(pendingDestructiveTeardown)
  pendingDestructiveTeardown = 0
}

function scheduleDestructiveTeardown(generation) {
  if (typeof window === 'undefined') return
  cancelPendingDestructiveTeardown()
  pendingDestructiveTeardown = window.setTimeout(() => {
    pendingDestructiveTeardown = 0
    if (controllerGeneration !== generation) return
    teardownVisualActivityRegistry()
  }, 0)
}

export default function GlobalVisualActivityRuntime() {
  useEffect(() => {
    const generation = ++controllerGeneration
    cancelPendingDestructiveTeardown()
    const uninstallDocument = installVisualRegistryDocumentController()

    // One bounded startup pass over explicit scope roots only. There is no
    // document.getAnimations census, no body-wide MutationObserver and no img scan.
    const startupScopes = [...document.querySelectorAll('[data-ql7-visual-scope]')]
    noteStartupScopeScan(startupScopes.length)
    for (const scope of startupScopes) registerDatasetScope(scope)

    // Dynamic surfaces register lazily when an animation actually starts inside
    // their nearest explicit scope. This keeps portals/cards cheap when idle.
    const onAnimationStart = (event) => {
      const target = event?.target
      if (!(target instanceof Element)) return
      registerNearestDatasetScope(target, { fromAnimationStart: true })
    }
    document.addEventListener('animationstart', onAnimationStart, true)

    window.__ql7VisualActivitySnapshot = getVisualActivitySnapshot
    window.__ql7VisualActivityFor = getVisualActivityFor
    window.__ql7AnimatedAssetSnapshot = getAnimatedAssetSnapshot

    return () => {
      document.removeEventListener('animationstart', onAnimationStart, true)
      uninstallDocument?.()
      try { delete window.__ql7VisualActivitySnapshot } catch {}
      try { delete window.__ql7VisualActivityFor } catch {}
      try { delete window.__ql7AnimatedAssetSnapshot } catch {}

      // React StrictMode replays passive effects in development. Destructive
      // teardown must wait one task so the immediate replay can cancel it;
      // otherwise component-owned visual subscribers are silently erased while
      // their mounted DOM nodes remain alive.
      scheduleDestructiveTeardown(generation)
    }
  }, [])

  return null
}
