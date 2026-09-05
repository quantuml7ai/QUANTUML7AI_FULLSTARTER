'use client'

const MARGIN_PROFILES = Object.freeze({
  near100: '100px 0px 100px 0px',
  near50: '50px 0px 50px 0px',
})

const EXIT_HYSTERESIS_MS = 90
const DISCONNECTED_SWEEP_MS = 15000

const records = new WeakMap()
const nodes = new Set()
const observerPools = new Map()
const rootIds = new WeakMap()
const pendingExit = new WeakMap()
const runtimePausedWaapi = new WeakMap()
const runtimePausedCss = new WeakMap()
const datasetManagedScopes = new WeakSet()

let rootSeq = 0
let documentVisible = true
let reducedMotion = false
let visibilityListener = null
let mediaQuery = null
let mediaQueryListener = null
let disconnectedSweepId = 0
let installed = false

const counters = {
  registrations: 0,
  unregistrations: 0,
  observerCallbacks: 0,
  observerEntries: 0,
  datasetWrites: 0,
  animationStartRegistrations: 0,
  runtimePaused: 0,
  runtimeResumed: 0,
  loopRunning: 0,
  loopPaused: 0,
  duplicateChains: 0,
  startupScopeScanTargets: 0,
  forcedLayoutReads: 0,
  globalAnimationScans: 0,
  bodyMutationObservers: 0,
  descendantStateScans: 0,
  scopedAnimationScans: 0,
  animationTargetReconciles: 0,
}

function safeCall(fn, ...args) {
  try { return fn?.(...args) } catch { return undefined }
}

function profileName(value) {
  return value === 'near50' ? 'near50' : 'near100'
}

function profileMargin(value) {
  return MARGIN_PROFILES[profileName(value)]
}

function rootKey(root) {
  if (!root) return 'viewport'
  let key = rootIds.get(root)
  if (!key) {
    key = `root-${++rootSeq}`
    rootIds.set(root, key)
  }
  return key
}

function resolveMarkedScrollRoot(node, requestedRoot = null) {
  if (requestedRoot instanceof Element) return requestedRoot
  if (!(node instanceof Element)) return null
  try {
    const root = node.parentElement?.closest?.('[data-ql7-visual-scroll-root="1"]')
    return root instanceof Element ? root : null
  } catch {
    return null
  }
}

function observerKey(root, profile) {
  return `${rootKey(root)}:${profileName(profile)}`
}

function cleanupPoolIfEmpty(pool) {
  if (!pool || pool.targets.size) return
  safeCall(() => pool.observer.disconnect())
  observerPools.delete(pool.key)
}

function getObserver(root, profile) {
  if (typeof IntersectionObserver !== 'function') return null
  const key = observerKey(root, profile)
  const existing = observerPools.get(key)
  if (existing) return existing

  const observer = new IntersectionObserver((entries) => {
    counters.observerCallbacks += 1
    counters.observerEntries += entries.length
    for (const entry of entries) {
      const record = records.get(entry.target)
      if (!record) continue
      const nextNear = !!entry.isIntersecting
      if (nextNear) {
        const timer = pendingExit.get(record.node)
        if (timer) {
          clearTimeout(timer)
          pendingExit.delete(record.node)
        }
        if (!record.near) {
          record.near = true
          applyRecordState(record)
        }
        continue
      }

      const oldTimer = pendingExit.get(record.node)
      if (oldTimer) clearTimeout(oldTimer)
      const timer = setTimeout(() => {
        pendingExit.delete(record.node)
        const current = records.get(record.node)
        if (!current || !current.node?.isConnected || !current.near) return
        current.near = false
        applyRecordState(current)
      }, EXIT_HYSTERESIS_MS)
      pendingExit.set(record.node, timer)
    }
  }, {
    root: root || null,
    rootMargin: profileMargin(profile),
    threshold: [0, 0.001],
  })

  const pool = {
    key,
    root: root || null,
    profile: profileName(profile),
    observer,
    targets: new Set(),
  }
  observerPools.set(key, pool)
  return pool
}

function observeRecord(record) {
  // viewportPinned is an explicit contract for mounted UI that is structurally
  // pinned inside the viewport (for example the Forum header action row).
  // Those nodes must not depend on sticky/layout IntersectionObserver convergence.
  // Document visibility / reduced-motion / enabled-open-collapsed predicates still pause them.
  if (record.viewportPinned) {
    record.near = true
    record.poolKey = ''
    applyRecordState(record)
    return
  }

  const pool = getObserver(record.root, record.marginProfile)
  if (!pool) {
    record.near = true
    record.poolKey = ''
    applyRecordState(record)
    return
  }
  pool.targets.add(record.node)
  record.poolKey = pool.key
  safeCall(() => pool.observer.observe(record.node))
}

function unobserveRecord(record) {
  if (!record?.poolKey) return
  const pool = observerPools.get(record.poolKey)
  record.poolKey = ''
  if (!pool) return
  safeCall(() => pool.observer.unobserve(record.node))
  pool.targets.delete(record.node)
  cleanupPoolIfEmpty(pool)
}

function desiredState(record) {
  if (!record.node?.isConnected) return 'paused'
  if (!documentVisible) return 'paused'
  if (reducedMotion) return 'paused'
  if (!record.enabled || !record.open || record.collapsed) return 'paused'
  if (record.viewportPinned) return 'running'
  if (!record.near) return 'paused'
  return 'running'
}

function isCssKeyframeAnimation(animation) {
  try {
    if (typeof CSSAnimation === 'function' && animation instanceof CSSAnimation) return true
  } catch {}
  return String(animation?.constructor?.name || '') === 'CSSAnimation'
}

function animationTarget(animation) {
  try {
    const target = animation?.effect?.target
    return target instanceof Element ? target : null
  } catch {
    return null
  }
}

function animationBelongsToRecord(animation, record) {
  const target = animationTarget(animation)
  if (!(target instanceof Element) || !(record?.node instanceof Element)) return false
  if (target === record.node) return true
  try { return target.closest?.('[data-ql7-visual-scope]') === record.node } catch { return false }
}

function collectAnimations(record, target = null) {
  const source = target instanceof Element ? target : record?.node
  if (!(source instanceof Element) || typeof source.getAnimations !== 'function') return []
  if (target instanceof Element) {
    counters.animationTargetReconciles += 1
    return safeCall(() => source.getAnimations()) || []
  }
  counters.scopedAnimationScans += 1
  return safeCall(() => source.getAnimations({ subtree: true })) || []
}

function mergeTracked(map, node, additions) {
  if (!additions.length) return
  const existing = map.get(node) || []
  const merged = [...existing]
  for (const animation of additions) if (!merged.includes(animation)) merged.push(animation)
  map.set(node, merged)
}

function pauseOwnedCss(record, target = null) {
  if (!record.pauseCss) return
  const owned = []
  for (const animation of collectAnimations(record, target)) {
    if (!animation || !isCssKeyframeAnimation(animation) || animation.playState !== 'running') continue
    if (!animationBelongsToRecord(animation, record)) continue
    try {
      animation.pause()
      owned.push(animation)
      counters.runtimePaused += 1
    } catch {}
  }
  if (target instanceof Element) mergeTracked(runtimePausedCss, record.node, owned)
  else if (owned.length) runtimePausedCss.set(record.node, owned)
}

function resumeOwnedCss(record) {
  const owned = runtimePausedCss.get(record.node) || []
  runtimePausedCss.delete(record.node)
  for (const animation of owned) {
    try {
      if (animation.playState === 'paused') {
        animation.play()
        counters.runtimeResumed += 1
      }
    } catch {}
  }
}

function pauseOwnedWaapi(record, target = null) {
  if (!record.pauseJs) return
  const owned = []
  for (const animation of collectAnimations(record, target)) {
    if (!animation || isCssKeyframeAnimation(animation) || animation.playState !== 'running') continue
    if (!animationBelongsToRecord(animation, record)) continue
    try {
      animation.pause()
      owned.push(animation)
      counters.runtimePaused += 1
    } catch {}
  }
  if (target instanceof Element) mergeTracked(runtimePausedWaapi, record.node, owned)
  else if (owned.length) runtimePausedWaapi.set(record.node, owned)
}

function resumeOwnedWaapi(record) {
  const owned = runtimePausedWaapi.get(record.node) || []
  runtimePausedWaapi.delete(record.node)
  for (const animation of owned) {
    try {
      if (animation.playState === 'paused') {
        animation.play()
        counters.runtimeResumed += 1
      }
    } catch {}
  }
}

function setLoopState(subscriber, next) {
  if (!subscriber?.loop || subscriber.loopState === next) return
  if (subscriber.loopState === 'running' && counters.loopRunning > 0) counters.loopRunning -= 1
  if (subscriber.loopState === 'paused' && counters.loopPaused > 0) counters.loopPaused -= 1
  subscriber.loopState = next
  if (next === 'running') counters.loopRunning += 1
  if (next === 'paused') counters.loopPaused += 1
}

function notifySubscribers(record, next) {
  for (const subscriber of record.subscribers) {
    setLoopState(subscriber, next)
    if (next === 'running') safeCall(subscriber.onRun, record.node)
    else safeCall(subscriber.onPause, record.node)
  }
}

function applyRecordState(record) {
  if (!record || records.get(record.node) !== record) return
  const next = desiredState(record)
  const stateChanged = record.state !== next

  if (stateChanged && next === 'paused') {
    if (record.pauseCss) pauseOwnedCss(record)
    if (record.pauseJs) pauseOwnedWaapi(record)
  }
  if (stateChanged) record.state = next

  // Generic React-rendered visual scopes never receive an imperative
  // data-ql7-visual-state attribute.  That attribute was the source of the
  // real App-Router hydration race: a parent passive effect could mutate a
  // descendant that React had not hydrated yet.  Only an explicit ref-owned
  // component may opt in to state publication after its own commit.
  if (record.publishState) {
    const previous = record.node.dataset.ql7VisualState
    if (previous !== next) {
      record.node.dataset.ql7VisualState = next
      counters.datasetWrites += 1
    }
  }

  if (!stateChanged) return
  if (next === 'running') {
    resumeOwnedCss(record)
    resumeOwnedWaapi(record)
  }
  notifySubscribers(record, next)
}

function normalizedOptions(node, options = {}) {
  const marginProfile = profileName(options.marginProfile)
  const root = options.rootStrategy === 'viewport'
    ? null
    : resolveMarkedScrollRoot(node, options.root)
  return {
    kind: String(options.kind || node?.dataset?.ql7VisualScope || 'scope'),
    marginProfile,
    root,
    rootStrategy: options.rootStrategy === 'viewport' ? 'viewport' : 'nearest-marker',
    enabled: options.enabled !== false,
    open: options.open !== false,
    collapsed: options.collapsed === true,
    pauseCss: options.pauseCss !== false,
    pauseJs: options.pauseJs === true,
    publishState: options.publishState === true,
    viewportPinned: options.viewportPinned === true,
    initialNear: options.initialNear !== false,
  }
}

export function registerVisualScope(node, options = {}) {
  if (!(node instanceof Element)) return () => {}
  const existing = records.get(node)
  if (existing) {
    // An explicit ref/hook registration is authoritative over discovery from
    // data-ql7-visual-scope. Global startup discovery must never downgrade an
    // already-mounted owner (publishState, initialNear, root or subscribers).
    datasetManagedScopes.delete(node)
    updateVisualScope(node, options)
    return () => unregisterVisualScope(node)
  }

  datasetManagedScopes.delete(node)
  const normalized = normalizedOptions(node, options)
  const record = {
    node,
    ...normalized,
    near: normalized.initialNear,
    state: '',
    poolKey: '',
    subscribers: new Set(),
  }

  records.set(node, record)
  nodes.add(node)
  counters.registrations += 1
  if (!node.dataset.ql7VisualScope) node.dataset.ql7VisualScope = record.kind
  applyRecordState(record)
  observeRecord(record)
  return () => unregisterVisualScope(node)
}

export function updateVisualScope(node, patch = {}) {
  const record = records.get(node)
  if (!record) return registerVisualScope(node, patch)

  const next = normalizedOptions(node, {
    ...record,
    ...patch,
    initialNear: record.near,
  })
  const observerChanged = next.root !== record.root || next.marginProfile !== record.marginProfile || next.viewportPinned !== record.viewportPinned
  if (observerChanged) unobserveRecord(record)
  Object.assign(record, next)
  if (observerChanged) observeRecord(record)
  applyRecordState(record)
  return () => unregisterVisualScope(node)
}

export function unregisterVisualScope(node) {
  const record = records.get(node)
  if (!record) return
  const timer = pendingExit.get(node)
  if (timer) clearTimeout(timer)
  pendingExit.delete(node)
  unobserveRecord(record)
  if (node?.isConnected) {
    resumeOwnedCss(record)
    resumeOwnedWaapi(record)
  } else {
    runtimePausedCss.delete(node)
    runtimePausedWaapi.delete(node)
  }
  for (const subscriber of record.subscribers) setLoopState(subscriber, '')
  record.subscribers.clear()
  datasetManagedScopes.delete(node)
  records.delete(node)
  nodes.delete(node)
  counters.unregistrations += 1
}

export function subscribeVisualActivity(node, { onRun, onPause, loop = false } = {}) {
  if (!(node instanceof Element)) return () => {}
  let record = records.get(node)
  if (!record) {
    registerVisualScope(node, {
      kind: node.dataset.ql7VisualScope || 'visual-loop',
      marginProfile: node.dataset.ql7VisualMargin === 'near50' ? 'near50' : 'near100',
      rootStrategy: node.dataset.ql7VisualRoot === 'viewport' ? 'viewport' : 'nearest-marker',
      pauseCss: node.dataset.ql7VisualPauseCss !== '0',
      pauseJs: node.dataset.ql7VisualPauseJs === '1',
    })
    record = records.get(node)
  }

  const subscriber = { onRun, onPause, loop: loop === true, loopState: '' }
  if (subscriber.loop && [...record.subscribers].some((item) => item.loop)) counters.duplicateChains += 1
  record.subscribers.add(subscriber)
  const next = record.state === 'running' ? 'running' : 'paused'
  setLoopState(subscriber, next)
  if (next === 'running') safeCall(onRun, node)
  else safeCall(onPause, node)

  return () => {
    const current = records.get(node)
    if (!current?.subscribers?.has(subscriber)) return
    setLoopState(subscriber, '')
    current.subscribers.delete(subscriber)
  }
}

function datasetOptions(node) {
  // Dataset-only scopes deliberately keep lifecycle predicates out of the JS record.
  // open/collapsed/enabled are enforced directly by the global CSS selector so a
  // React attribute flip can resume before paint without a MutationObserver or a
  // second registry update. Explicit hook/subscription owners can still pass those
  // predicates through registerVisualScope/updateVisualScope when JS loop ownership
  // actually depends on them.
  return {
    kind: String(node.dataset.ql7VisualScope || 'scope'),
    marginProfile: node.dataset.ql7VisualMargin === 'near50' ? 'near50' : 'near100',
    rootStrategy: node.dataset.ql7VisualRoot === 'viewport' ? 'viewport' : 'nearest-marker',
    enabled: node.dataset.ql7VisualPinned === '1'
      ? node.dataset.ql7VisualPinnedActive !== '0'
      : true,
    open: true,
    collapsed: false,
    pauseCss: node.dataset.ql7VisualPauseCss !== '0',
    pauseJs: node.dataset.ql7VisualPauseJs === '1',
    publishState: false,
    viewportPinned: node.dataset.ql7VisualPinned === '1',
  }
}

export function registerDatasetScope(node) {
  if (!(node instanceof Element) || !node.dataset.ql7VisualScope) return () => {}
  const existing = records.get(node)
  if (existing) {
    // Dataset discovery is subordinate to an explicit component/hook owner.
    // This is critical for hydration-safe ref-owned nodes: the root controller
    // may discover their structural scope after commit, but must not replace
    // publishState=true or initialNear=false with generic dataset defaults.
    if (datasetManagedScopes.has(node)) updateVisualScope(node, datasetOptions(node))
    return () => {}
  }
  const cleanup = registerVisualScope(node, datasetOptions(node))
  datasetManagedScopes.add(node)
  return () => {
    if (!datasetManagedScopes.has(node)) return
    datasetManagedScopes.delete(node)
    cleanup?.()
  }
}

export function refreshDatasetScope(node) {
  if (!(node instanceof Element) || !node.dataset.ql7VisualScope) return
  if (!datasetManagedScopes.has(node)) return
  updateVisualScope(node, datasetOptions(node))
}

export function registerNearestDatasetScope(target, { fromAnimationStart = false } = {}) {
  if (!(target instanceof Element)) return null
  const scope = target.closest?.('[data-ql7-visual-scope]')
  if (!(scope instanceof Element)) return null
  if (fromAnimationStart) counters.animationStartRegistrations += 1
  if (!records.has(scope)) registerDatasetScope(scope)
  return scope
}

export function reconcileVisualScopeAnimationTarget(scope, target) {
  const record = records.get(scope)
  if (!record || !(target instanceof Element)) return
  if (desiredState(record) !== 'paused') return
  if (record.pauseCss) pauseOwnedCss(record, target)
  if (record.pauseJs) pauseOwnedWaapi(record, target)
}

export function noteStartupScopeScan(count) {
  counters.startupScopeScanTargets = Math.max(0, Number(count || 0))
}

function sweepDisconnected() {
  for (const node of [...nodes]) {
    if (!node?.isConnected) unregisterVisualScope(node)
  }
}

export function installVisualRegistryDocumentController() {
  if (installed || typeof document === 'undefined') return () => {}
  installed = true
  documentVisible = document.visibilityState === 'visible'

  try {
    mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null
    reducedMotion = !!mediaQuery?.matches
  } catch {
    reducedMotion = false
  }

  visibilityListener = () => {
    documentVisible = document.visibilityState === 'visible'
    document.documentElement?.toggleAttribute?.('data-ql7-document-hidden', !documentVisible)
    for (const node of nodes) applyRecordState(records.get(node))
  }
  document.addEventListener('visibilitychange', visibilityListener, { passive: true })
  document.documentElement?.toggleAttribute?.('data-ql7-document-hidden', !documentVisible)

  mediaQueryListener = (event) => {
    reducedMotion = !!event?.matches
    for (const node of nodes) applyRecordState(records.get(node))
  }
  try { mediaQuery?.addEventListener?.('change', mediaQueryListener) } catch {}

  // Reconcile scopes that registered before the document controller effect.
  // This applies initial visibility/reduced-motion policy without publishing
  // attributes into generic React-owned markup.
  for (const node of nodes) applyRecordState(records.get(node))

  disconnectedSweepId = window.setInterval(sweepDisconnected, DISCONNECTED_SWEEP_MS)

  return () => {
    try { document.removeEventListener('visibilitychange', visibilityListener) } catch {}
    try { mediaQuery?.removeEventListener?.('change', mediaQueryListener) } catch {}
    if (disconnectedSweepId) clearInterval(disconnectedSweepId)
    disconnectedSweepId = 0
    mediaQuery = null
    mediaQueryListener = null
    visibilityListener = null
    installed = false
  }
}

function effectiveSnapshotState(record) {
  if (!record?.node?.isConnected) return 'paused'
  const ds = record.node.dataset || {}
  if (!documentVisible || reducedMotion) return 'paused'
  if (ds.ql7VisualOpen === '0' || ds.ql7VisualOpen === 'false') return 'paused'
  if (ds.ql7VisualCollapsed === '1' || ds.ql7VisualCollapsed === 'true') return 'paused'
  if (ds.ql7VisualEnabled === '0' || ds.ql7VisualEnabled === 'false') return 'paused'
  if (ds.ql7VisualPinned === '1' && ds.ql7VisualPinnedActive === '0') return 'paused'
  return record.state === 'running' ? 'running' : 'paused'
}

export function getVisualActivityFor(node) {
  const record = records.get(node)
  if (!record) return null
  return {
    kind: record.kind,
    state: effectiveSnapshotState(record),
    near: !!record.near,
    marginProfile: record.marginProfile,
    rootType: record.root ? 'marked-scroll-root' : 'viewport',
    connected: !!record.node?.isConnected,
    enabled: !!record.enabled,
    open: !!record.open,
    collapsed: !!record.collapsed,
    viewportPinned: !!record.viewportPinned,
  }
}

export function getVisualActivitySnapshot() {
  const byKind = {}
  let running = 0
  let paused = 0
  let disconnected = 0
  for (const node of nodes) {
    const record = records.get(node)
    if (!record) continue
    if (!node.isConnected) disconnected += 1
    if (effectiveSnapshotState(record) === 'running') running += 1
    else paused += 1
    byKind[record.kind] = (byKind[record.kind] || 0) + 1
  }

  return {
    scopes: {
      total: nodes.size,
      running,
      paused,
      disconnected,
      byKind,
    },
    observers: {
      pools: observerPools.size,
      targets: [...observerPools.values()].reduce((sum, pool) => sum + pool.targets.size, 0),
      profiles: [...observerPools.values()].map((pool) => ({
        profile: pool.profile,
        rootType: pool.root ? 'marked-scroll-root' : 'viewport',
        targets: pool.targets.size,
      })),
    },
    animations: {
      runtimePaused: counters.runtimePaused,
      runtimeResumed: counters.runtimeResumed,
    },
    loops: {
      running: counters.loopRunning,
      paused: counters.loopPaused,
      duplicateChains: counters.duplicateChains,
    },
    runtimeCostGuards: {
      startupScopeScanTargets: counters.startupScopeScanTargets,
      animationStartRegistrations: counters.animationStartRegistrations,
      observerCallbacks: counters.observerCallbacks,
      observerEntries: counters.observerEntries,
      datasetWrites: counters.datasetWrites,
      forcedLayoutReads: counters.forcedLayoutReads,
      globalAnimationScans: counters.globalAnimationScans,
      bodyMutationObservers: counters.bodyMutationObservers,
      descendantStateScans: counters.descendantStateScans,
      scopedAnimationScans: counters.scopedAnimationScans,
      animationTargetReconciles: counters.animationTargetReconciles,
    },
    lifecycle: {
      registrations: counters.registrations,
      unregistrations: counters.unregistrations,
      documentVisible,
      reducedMotion,
    },
  }
}

export function teardownVisualActivityRegistry() {
  if (disconnectedSweepId) clearInterval(disconnectedSweepId)
  disconnectedSweepId = 0
  for (const node of [...nodes]) unregisterVisualScope(node)
  for (const pool of observerPools.values()) safeCall(() => pool.observer.disconnect())
  observerPools.clear()
  try { document.documentElement?.removeAttribute?.('data-ql7-document-hidden') } catch {}
}
