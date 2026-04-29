'use client'

const forumWindowingRegistry = new Map()

function normalizeId(raw) {
  return String(raw || '').trim()
}

function readRegistryEntries() {
  return Array.from(forumWindowingRegistry.entries()).reverse()
}

export function registerForumWindowingTarget(targetId, handlers) {
  const id = normalizeId(targetId)
  if (!id || !handlers || typeof handlers !== 'object') {
    return () => {}
  }

  forumWindowingRegistry.set(id, handlers)

  return () => {
    if (forumWindowingRegistry.get(id) === handlers) {
      forumWindowingRegistry.delete(id)
    }
  }
}

export function revealForumWindowedDomId(domId, options = null) {
  const id = normalizeId(domId)
  if (!id) return false

  let revealed = false
  for (const [, handlers] of readRegistryEntries()) {
    try {
      if (handlers?.revealDomId?.(id, options)) {
        revealed = true
      }
    } catch {}
  }
  return revealed
}

export function revealForumWindowedKey(targetKey, options = null) {
  const key = normalizeId(targetKey)
  if (!key) return false

  let revealed = false
  for (const [, handlers] of readRegistryEntries()) {
    try {
      if (handlers?.revealKey?.(key, options)) {
        revealed = true
      }
    } catch {}
  }
  return revealed
}

export function __resetForumWindowingRegistryForTests() {
  forumWindowingRegistry.clear()
}
