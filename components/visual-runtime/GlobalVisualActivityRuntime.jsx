'use client'

import { useEffect } from 'react'
import {
  getVisualActivityFor,
  getVisualActivitySnapshot,
  installVisualRegistryDocumentController,
  noteStartupScopeScan,
  reconcileVisualScopeAnimationTarget,
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

    // Registration is safe during the root passive effect because generic
    // dataset scopes no longer publish React-unknown visual-state attributes.
    // Product/browser state remains owned by its product components; the visual
    // runtime owns only animation lifecycle.
    const startupScopes = [...document.querySelectorAll('[data-ql7-visual-scope]')]
    noteStartupScopeScan(startupScopes.length)
    for (const scope of startupScopes) registerDatasetScope(scope)

    // Dynamic surfaces register lazily when an animation actually starts inside
    // their nearest explicit scope. If that scope is currently paused, reconcile
    // only the animation target instead of scanning the document or mutating DOM
    // attributes that React owns.
    const onAnimationStart = (event) => {
      const target = event?.target
      if (!(target instanceof Element)) return
      const scope = registerNearestDatasetScope(target, { fromAnimationStart: true })
      if (scope) reconcileVisualScopeAnimationTarget(scope, target)
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
