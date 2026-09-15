'use client'

const PREWARM_SELECTOR = 'img,video[poster]'
const MAX_COMPLETED_KEYS = 640
const MAX_QUEUE = 192
const RESIZE_DEBOUNCE_MS = 220

const stateByNode = new WeakMap()
const trackedNodes = new Set()
const completedKeys = new Map()
const queuedKeys = new Set()
const inflightKeys = new Set()
const queuedJobsByKey = new Map()
const queue = []
const pendingMutationAdditions = new Set()
const pendingMutationRemovals = new Set()
const pendingMutationRefreshes = new Set()

let prewarmObserver = null
let nearObserver = null
let mutationObserver = null
let resizeTimer = 0
let mutationFlushHandle = 0
let mutationFlushUsesIdleCallback = false
let installed = false
let documentVisible = true
let activeLoads = 0
let currentPolicy = null

const counters = {
  installs: 0,
  uninstalls: 0,
  discovered: 0,
  observed: 0,
  removed: 0,
  mutationBatches: 0,
  mutationNodes: 0,
  mutationFlushes: 0,
  mutationCoalescedBatches: 0,
  noopRefreshSkips: 0,
  prewarmEntries: 0,
  nearEntries: 0,
  queueAccepted: 0,
  queueDropped: 0,
  deduped: 0,
  started: 0,
  loaded: 0,
  decoded: 0,
  errors: 0,
  nearPromotions: 0,
  posterPrewarms: 0,
  imagePrewarms: 0,
  skippedAnimated: 0,
  skippedUnsupported: 0,
  hintBatches: 0,
  hintCandidates: 0,
  hintAccepted: 0,
  policyRebuilds: 0,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function coarsePointer() {
  try { return !!window.matchMedia?.('(pointer: coarse)')?.matches } catch { return false }
}

function connectionProfile() {
  try {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    return {
      saveData: !!conn?.saveData,
      effectiveType: String(conn?.effectiveType || '').toLowerCase(),
    }
  } catch {
    return { saveData: false, effectiveType: '' }
  }
}

export function computeResourcePrewarmPolicy({
  width = 1280,
  height = 720,
  coarse = false,
  saveData = false,
  effectiveType = '',
  deviceMemory = 8,
} = {}) {
  const w = clamp(Number(width) || 1280, 320, 7680)
  const h = clamp(Number(height) || 720, 320, 4320)
  const slowNetwork = /(^|-)2g$/.test(String(effectiveType || '').toLowerCase()) || effectiveType === 'slow-2g'
  const constrainedMemory = Number(deviceMemory || 0) > 0 && Number(deviceMemory) <= 4
  const mobileLike = !!coarse || w <= 900

  if (saveData || slowNetwork) {
    return {
      prewarmX: clamp(Math.round(w * 0.75), 420, 900),
      prewarmY: clamp(Math.round(h * 0.75), 520, 1000),
      nearX: clamp(Math.round(w * 0.28), 180, 360),
      nearY: clamp(Math.round(h * 0.34), 220, 440),
      concurrency: 1,
      mode: 'conservative',
    }
  }

  if (mobileLike) {
    return {
      prewarmX: clamp(Math.round(w * 2.2), 760, 1560),
      prewarmY: clamp(Math.round(h * (constrainedMemory ? 1.45 : 2.05)), 980, constrainedMemory ? 1580 : 2200),
      nearX: clamp(Math.round(w * 0.9), 360, 820),
      nearY: clamp(Math.round(h * (constrainedMemory ? 0.68 : 0.85)), 480, constrainedMemory ? 760 : 980),
      concurrency: constrainedMemory ? 2 : 3,
      mode: constrainedMemory ? 'mobile-constrained' : 'mobile-premium',
    }
  }

  return {
    prewarmX: clamp(Math.round(w * 0.85), 900, 1800),
    prewarmY: clamp(Math.round(h * 1.35), 1000, 2000),
    nearX: clamp(Math.round(w * 0.32), 360, 760),
    nearY: clamp(Math.round(h * 0.46), 420, 900),
    concurrency: 4,
    mode: 'desktop-premium',
  }
}

function snapshotPolicy() {
  const conn = connectionProfile()
  let memory = 8
  try { memory = Number(navigator.deviceMemory || 8) } catch {}
  return computeResourcePrewarmPolicy({
    width: Number(window.innerWidth || document.documentElement?.clientWidth || 1280),
    height: Number(window.innerHeight || document.documentElement?.clientHeight || 720),
    coarse: coarsePointer(),
    saveData: conn.saveData,
    effectiveType: conn.effectiveType,
    deviceMemory: memory,
  })
}

function safeUrl(raw) {
  const value = String(raw || '').trim()
  if (!value || /^(?:data:|blob:|about:|javascript:)/i.test(value)) return ''
  try { return new URL(value, document.baseURI || window.location.href).href } catch { return '' }
}

function isAnimatedRaster(url) {
  return /\.(?:gif|apng)(?:$|[?#])/i.test(String(url || ''))
}

function nodeState(node) {
  let state = stateByNode.get(node)
  if (!state) {
    state = {
      kind: node instanceof HTMLVideoElement ? 'poster' : 'image',
      prewarmEntered: false,
      nearEntered: false,
      requestedKey: '',
      ready: false,
      decoded: false,
      error: false,
      discoveredAt: performance.now?.() || 0,
      requestedAt: 0,
      readyAt: 0,
      sourceSignature: '',
    }
    stateByNode.set(node, state)
  }
  return state
}

function imageRequestDescriptor(img) {
  const src = String(img.getAttribute('src') || '').trim()
  const srcset = String(img.getAttribute('srcset') || '').trim()
  const sizes = String(img.getAttribute('sizes') || '').trim()
  const absoluteSrc = safeUrl(src)
  if (!absoluteSrc && !srcset) return null
  if (isAnimatedRaster(absoluteSrc)) {
    counters.skippedAnimated += 1
    return null
  }
  const key = `img|${absoluteSrc}|${srcset}|${sizes}`
  return {
    key,
    kind: 'image',
    src: absoluteSrc,
    srcset,
    sizes,
    crossOrigin: img.crossOrigin || '',
    referrerPolicy: img.referrerPolicy || '',
  }
}

function posterRequestDescriptor(video) {
  const poster = safeUrl(video.getAttribute('poster') || '')
  if (!poster || isAnimatedRaster(poster)) return null
  return {
    key: `poster|${poster}`,
    kind: 'poster',
    src: poster,
    srcset: '',
    sizes: '',
    crossOrigin: video.crossOrigin || '',
    referrerPolicy: video.referrerPolicy || '',
  }
}

function descriptorFor(node) {
  if (node instanceof HTMLImageElement) return imageRequestDescriptor(node)
  if (node instanceof HTMLVideoElement) return posterRequestDescriptor(node)
  return null
}

function rememberCompleted(key) {
  completedKeys.delete(key)
  completedKeys.set(key, Date.now())
  while (completedKeys.size > MAX_COMPLETED_KEYS) {
    const oldest = completedKeys.keys().next().value
    if (!oldest) break
    completedKeys.delete(oldest)
  }
}

function finalizeRequest(job, ok, decoded) {
  activeLoads = Math.max(0, activeLoads - 1)
  inflightKeys.delete(job.descriptor.key)
  queuedKeys.delete(job.descriptor.key)
  if (ok) rememberCompleted(job.descriptor.key)

  for (const target of job.targets) {
    const state = stateByNode.get(target)
    if (!state) continue
    state.ready = !!ok
    state.decoded = !!decoded
    state.error = !ok
    state.readyAt = performance.now?.() || 0
    if (ok && target instanceof HTMLImageElement && target.isConnected) {
      try {
        if (target.complete && target.naturalWidth > 0 && typeof target.decode === 'function') {
          target.decode().catch(() => {})
        }
      } catch {}
    }
  }

  if (ok) counters.loaded += 1
  else counters.errors += 1
  if (decoded) counters.decoded += 1
  pumpQueue()
}

function startJob(job) {
  activeLoads += 1
  queuedKeys.delete(job.descriptor.key)
  queuedJobsByKey.delete(job.descriptor.key)
  inflightKeys.add(job.descriptor.key)
  counters.started += 1

  const preload = new Image()
  let settled = false
  const settle = (ok, decoded = false) => {
    if (settled) return
    settled = true
    preload.onload = null
    preload.onerror = null
    finalizeRequest(job, ok, decoded)
  }

  try {
    if (job.descriptor.crossOrigin) preload.crossOrigin = job.descriptor.crossOrigin
    if (job.descriptor.referrerPolicy) preload.referrerPolicy = job.descriptor.referrerPolicy
    if ('fetchPriority' in preload) preload.fetchPriority = 'low'
    if (job.descriptor.sizes) preload.sizes = job.descriptor.sizes
    if (job.descriptor.srcset) preload.srcset = job.descriptor.srcset
    preload.decoding = 'async'
    preload.onload = () => settle(true, false)
    preload.onerror = () => settle(false, false)
    preload.src = job.descriptor.src || job.descriptor.srcset.split(',')[0]?.trim().split(/\s+/)[0] || ''
    if (!preload.src) settle(false, false)
  } catch {
    settle(false, false)
  }
}

function pumpQueue() {
  if (!installed || !documentVisible) return
  const limit = Math.max(1, Number(currentPolicy?.concurrency || 2))
  while (activeLoads < limit && queue.length) {
    const job = queue.shift()
    if (!job) break
    if (completedKeys.has(job.descriptor.key)) {
      queuedKeys.delete(job.descriptor.key)
      queuedJobsByKey.delete(job.descriptor.key)
      counters.deduped += 1
      for (const target of job.targets) {
        const state = stateByNode.get(target)
        if (state) state.ready = true
      }
      continue
    }
    startJob(job)
  }
}

function queueDescriptor(descriptor, node = null) {
  if (!descriptor?.key) return false
  const target = typeof Element !== 'undefined' && node instanceof Element ? node : null
  const state = target ? nodeState(target) : null
  if (state) {
    state.requestedKey = descriptor.key
    state.requestedAt = performance.now?.() || 0
  }

  if (completedKeys.has(descriptor.key)) {
    if (state) state.ready = true
    counters.deduped += 1
    return true
  }

  const existing = queuedJobsByKey.get(descriptor.key)
  if (existing) {
    if (target) existing.targets.add(target)
    counters.deduped += 1
    return true
  }

  if (inflightKeys.has(descriptor.key)) {
    counters.deduped += 1
    return true
  }

  if (queue.length >= MAX_QUEUE) {
    counters.queueDropped += 1
    return false
  }

  const job = { descriptor, targets: new Set(target ? [target] : []) }
  queuedKeys.add(descriptor.key)
  queuedJobsByKey.set(descriptor.key, job)
  queue.push(job)
  counters.queueAccepted += 1
  if (descriptor.kind === 'poster') counters.posterPrewarms += 1
  else counters.imagePrewarms += 1
  pumpQueue()
  return true
}

function queuePrewarm(node) {
  const descriptor = descriptorFor(node)
  if (!descriptor) {
    counters.skippedUnsupported += 1
    return false
  }
  return queueDescriptor(descriptor, node)
}

function descriptorForHint(hint) {
  const row = typeof hint === 'string' ? { src: hint, kind: 'image' } : (hint || {})
  const kind = row.kind === 'poster' ? 'poster' : 'image'
  const src = safeUrl(row.src || '')
  const srcset = kind === 'image' ? String(row.srcset || '').trim() : ''
  const sizes = kind === 'image' ? String(row.sizes || '').trim() : ''
  if (!src && !srcset) return null
  if (src && isAnimatedRaster(src)) return null
  return {
    key: `${kind === 'poster' ? 'poster' : 'img'}|${src}|${srcset}|${sizes}`,
    kind,
    src,
    srcset,
    sizes,
    crossOrigin: String(row.crossOrigin || ''),
    referrerPolicy: String(row.referrerPolicy || ''),
  }
}

export function prewarmResourceHints(hints, { limit = 8 } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !Array.isArray(hints) || !hints.length) return 0
  if (installed && !documentVisible) return 0
  counters.hintBatches += 1
  const bounded = hints.slice(0, clamp(Number(limit) || 8, 1, 16))
  let accepted = 0
  for (const hint of bounded) {
    counters.hintCandidates += 1
    const descriptor = descriptorForHint(hint)
    if (!descriptor) continue
    if (queueDescriptor(descriptor)) accepted += 1
  }
  counters.hintAccepted += accepted
  return accepted
}


function decodeTarget(node) {
  if (!(node instanceof HTMLImageElement)) return
  const state = nodeState(node)
  const run = () => {
    try {
      if (!node.isConnected || !node.complete || node.naturalWidth <= 0 || typeof node.decode !== 'function') return
      const result = node.decode()
      if (result && typeof result.then === 'function') {
        result.then(() => {
          const current = stateByNode.get(node)
          if (!current || current.decoded) return
          current.decoded = true
          current.ready = true
          current.readyAt = performance.now?.() || 0
          counters.decoded += 1
        }).catch(() => {})
      }
    } catch {}
  }
  if (node.complete && node.naturalWidth > 0) {
    run()
    return
  }
  try { node.addEventListener('load', run, { once: true, passive: true }) } catch {}
}

function promoteNear(node) {
  if (!(node instanceof HTMLImageElement)) return
  const state = nodeState(node)
  if (state.nearEntered) return
  state.nearEntered = true
  counters.nearPromotions += 1
  try {
    if (String(node.loading || node.getAttribute('loading') || '').toLowerCase() === 'lazy') {
      node.loading = 'eager'
    }
  } catch {}
  try {
    if ('fetchPriority' in node && String(node.fetchPriority || '').toLowerCase() !== 'high') {
      node.fetchPriority = 'auto'
    }
  } catch {}
  decodeTarget(node)
}

function sourceSignature(node) {
  try {
    if (node instanceof HTMLImageElement) {
      return `img|${String(node.getAttribute('src') || '')}|${String(node.getAttribute('srcset') || '')}|${String(node.getAttribute('sizes') || '')}`
    }
    if (node instanceof HTMLVideoElement) return `poster|${String(node.getAttribute('poster') || '')}`
  } catch {}
  return ''
}

function observeNode(node) {
  if (!(node instanceof Element) || trackedNodes.has(node)) return
  if (!(node instanceof HTMLImageElement) && !(node instanceof HTMLVideoElement)) return
  if (node instanceof HTMLVideoElement && !node.getAttribute('poster')) return
  trackedNodes.add(node)
  const state = nodeState(node)
  state.sourceSignature = sourceSignature(node)
  counters.discovered += 1
  try { prewarmObserver?.observe(node) } catch {}
  try { nearObserver?.observe(node) } catch {}
  counters.observed += 1
}

function unobserveNode(node) {
  if (!trackedNodes.delete(node)) return
  try { prewarmObserver?.unobserve(node) } catch {}
  try { nearObserver?.unobserve(node) } catch {}
  counters.removed += 1
}

function scanSubtree(root) {
  if (!(root instanceof Element) && root !== document) return
  if (root instanceof Element && root.matches?.(PREWARM_SELECTOR)) observeNode(root)
  let found = []
  try { found = root.querySelectorAll?.(PREWARM_SELECTOR) || [] } catch {}
  for (const node of found) observeNode(node)
}

function buildObservers() {
  try { prewarmObserver?.disconnect() } catch {}
  try { nearObserver?.disconnect() } catch {}
  currentPolicy = snapshotPolicy()
  counters.policyRebuilds += 1

  const prewarmMargin = `${currentPolicy.prewarmY}px ${currentPolicy.prewarmX}px ${currentPolicy.prewarmY}px ${currentPolicy.prewarmX}px`
  const nearMargin = `${currentPolicy.nearY}px ${currentPolicy.nearX}px ${currentPolicy.nearY}px ${currentPolicy.nearX}px`

  prewarmObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      counters.prewarmEntries += 1
      const state = nodeState(entry.target)
      if (!state.prewarmEntered) state.prewarmEntered = true
      queuePrewarm(entry.target)
    }
  }, { root: null, rootMargin: prewarmMargin, threshold: 0 })

  nearObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      counters.nearEntries += 1
      queuePrewarm(entry.target)
      promoteNear(entry.target)
    }
  }, { root: null, rootMargin: nearMargin, threshold: 0 })

  for (const node of trackedNodes) {
    if (!node?.isConnected) {
      trackedNodes.delete(node)
      continue
    }
    try { prewarmObserver.observe(node) } catch {}
    try { nearObserver.observe(node) } catch {}
  }
}


function refreshTrackedNode(node) {
  if (!(node instanceof Element)) return
  if (!trackedNodes.has(node)) {
    observeNode(node)
    return
  }
  const state = stateByNode.get(node)
  if (!state) return
  const nextSignature = sourceSignature(node)
  if (state.sourceSignature === nextSignature) {
    counters.noopRefreshSkips += 1
    return
  }
  state.sourceSignature = nextSignature
  state.requestedKey = ''
  state.ready = false
  state.decoded = false
  state.error = false
  if (state.prewarmEntered || state.nearEntered) queuePrewarm(node)
  if (state.nearEntered) {
    state.nearEntered = false
    promoteNear(node)
  }
}

function takePending(set) {
  const iterator = set.values().next()
  if (iterator.done) return null
  const value = iterator.value
  set.delete(value)
  return value
}

function hasPendingMutationWork() {
  return pendingMutationAdditions.size > 0 || pendingMutationRefreshes.size > 0 || pendingMutationRemovals.size > 0
}

function scheduleMutationFlush() {
  if (mutationFlushHandle || !installed) return
  const run = (deadline) => {
    mutationFlushHandle = 0
    mutationFlushUsesIdleCallback = false
    counters.mutationFlushes += 1

    // Keep each discovery slice bounded so global DOM churn cannot monopolize a
    // render frame. New/changed resources win over detached cleanup; cleanup is
    // still guaranteed by subsequent idle slices.
    let processed = 0
    const canContinue = () => {
      if (processed >= 24) return false
      if (!deadline || typeof deadline.timeRemaining !== 'function') return true
      return processed < 4 || deadline.timeRemaining() > 2
    }

    while (pendingMutationAdditions.size && canContinue()) {
      const root = takePending(pendingMutationAdditions)
      processed += 1
      if (root?.isConnected) scanSubtree(root)
    }
    while (pendingMutationRefreshes.size && canContinue()) {
      const node = takePending(pendingMutationRefreshes)
      processed += 1
      if (node?.isConnected) refreshTrackedNode(node)
    }
    while (pendingMutationRemovals.size && canContinue()) {
      const root = takePending(pendingMutationRemovals)
      processed += 1
      if (!root || root.isConnected) continue
      if (trackedNodes.has(root)) unobserveNode(root)
      let descendants = []
      try { descendants = root.querySelectorAll?.(PREWARM_SELECTOR) || [] } catch {}
      for (const node of descendants) unobserveNode(node)
    }

    if (hasPendingMutationWork()) scheduleMutationFlush()
  }

  if (typeof requestIdleCallback === 'function') {
    mutationFlushUsesIdleCallback = true
    mutationFlushHandle = requestIdleCallback(run, { timeout: 120 })
  } else {
    mutationFlushUsesIdleCallback = false
    mutationFlushHandle = setTimeout(() => run(null), 0)
  }
}

function onMutations(records) {
  counters.mutationBatches += 1
  if (mutationFlushHandle) counters.mutationCoalescedBatches += 1
  let touched = 0
  for (const record of records) {
    if (record.type === 'attributes') {
      if (record.target instanceof Element) {
        pendingMutationRefreshes.add(record.target)
        touched += 1
      }
      continue
    }
    for (const node of record.addedNodes || []) {
      if (!(node instanceof Element)) continue
      pendingMutationRemovals.delete(node)
      pendingMutationAdditions.add(node)
      touched += 1
    }
    for (const node of record.removedNodes || []) {
      if (!(node instanceof Element)) continue
      pendingMutationAdditions.delete(node)
      pendingMutationRefreshes.delete(node)
      pendingMutationRemovals.add(node)
      touched += 1
    }
  }
  counters.mutationNodes += touched
  scheduleMutationFlush()
}
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    resizeTimer = 0
    if (installed) buildObservers()
  }, RESIZE_DEBOUNCE_MS)
}

function onVisibilityChange() {
  documentVisible = document.visibilityState !== 'hidden'
  if (documentVisible) pumpQueue()
}

export function getResourcePrewarmSnapshot() {
  return {
    installed,
    policy: currentPolicy ? { ...currentPolicy } : null,
    tracked: trackedNodes.size,
    activeLoads,
    queued: queue.length,
    completedKeys: completedKeys.size,
    counters: { ...counters },
  }
}

export function getResourcePrewarmFor(node) {
  const state = stateByNode.get(node)
  return state ? { ...state } : null
}

export function installGlobalResourcePrewarmRuntime() {
  if (installed || typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }
  if (typeof IntersectionObserver !== 'function' || typeof MutationObserver !== 'function') {
    return () => {}
  }

  installed = true
  documentVisible = document.visibilityState !== 'hidden'
  counters.installs += 1
  buildObservers()
  scanSubtree(document)

  mutationObserver = new MutationObserver(onMutations)
  mutationObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'sizes', 'poster'],
  })

  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onResize, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange, true)
  pumpQueue()

  window.__ql7ResourcePrewarmSnapshot = getResourcePrewarmSnapshot
  window.__ql7ResourcePrewarmFor = getResourcePrewarmFor

  return () => {
    if (!installed) return
    installed = false
    counters.uninstalls += 1
    try { prewarmObserver?.disconnect() } catch {}
    try { nearObserver?.disconnect() } catch {}
    try { mutationObserver?.disconnect() } catch {}
    prewarmObserver = null
    nearObserver = null
    mutationObserver = null
    clearTimeout(resizeTimer)
    resizeTimer = 0
    if (mutationFlushHandle) {
      try {
        if (mutationFlushUsesIdleCallback && typeof cancelIdleCallback === 'function') cancelIdleCallback(mutationFlushHandle)
        else clearTimeout(mutationFlushHandle)
      } catch {}
    }
    mutationFlushHandle = 0
    mutationFlushUsesIdleCallback = false
    pendingMutationAdditions.clear()
    pendingMutationRefreshes.clear()
    pendingMutationRemovals.clear()
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    document.removeEventListener('visibilitychange', onVisibilityChange, true)
    try { delete window.__ql7ResourcePrewarmSnapshot } catch {}
    try { delete window.__ql7ResourcePrewarmFor } catch {}
  }
}
