'use client'

const records = new WeakMap()
const nodes = new Set()
const counters = {
  registered: 0,
  unregistered: 0,
  toAnimated: 0,
  toPoster: 0,
  missingPoster: 0,
  errors: 0,
}

export function registerAnimatedAsset(node, meta = {}) {
  if (!(node instanceof Element)) return () => {}
  if (!records.has(node)) {
    records.set(node, {
      animatedSrc: String(meta.animatedSrc || ''),
      posterSrc: String(meta.posterSrc || ''),
      marginProfile: meta.marginProfile === 'near50' ? 'near50' : 'near100',
      state: String(meta.state || 'animated'),
      missingPoster: false,
    })
    nodes.add(node)
    counters.registered += 1
  }
  return () => unregisterAnimatedAsset(node)
}

export function updateAnimatedAsset(node, patch = {}) {
  const record = records.get(node)
  if (!record) return
  Object.assign(record, patch)
}

export function markAnimatedAssetState(node, state) {
  const record = records.get(node)
  if (!record || record.state === state) return
  record.state = state
  if (state === 'animated') counters.toAnimated += 1
  if (state === 'poster') counters.toPoster += 1
}

export function markAnimatedAssetMissingPoster(node) {
  const record = records.get(node)
  if (!record || record.missingPoster) return
  record.missingPoster = true
  counters.missingPoster += 1
}

export function markAnimatedAssetError() {
  counters.errors += 1
}

export function unregisterAnimatedAsset(node) {
  if (!records.has(node)) return
  records.delete(node)
  nodes.delete(node)
  counters.unregistered += 1
}

export function getAnimatedAssetSnapshot() {
  let animatedActive = 0
  let staticPoster = 0
  let missingPoster = 0
  let disconnected = 0
  let denseNear50 = 0
  for (const node of nodes) {
    const record = records.get(node)
    if (!record) continue
    if (!node.isConnected) disconnected += 1
    if (record.state === 'animated') animatedActive += 1
    if (record.state === 'poster') staticPoster += 1
    if (record.missingPoster) missingPoster += 1
    if (record.marginProfile === 'near50') denseNear50 += 1
  }
  return {
    total: nodes.size,
    animatedActive,
    staticPoster,
    missingPoster,
    disconnected,
    denseNear50,
    transitions: {
      toAnimated: counters.toAnimated,
      toPoster: counters.toPoster,
    },
    lifecycle: {
      registered: counters.registered,
      unregistered: counters.unregistered,
      errors: counters.errors,
    },
  }
}
