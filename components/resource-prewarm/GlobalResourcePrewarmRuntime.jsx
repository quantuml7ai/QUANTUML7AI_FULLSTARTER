'use client'

// Dormant legacy implementation: intentionally not mounted in production.
import { useEffect } from 'react'
import { installGlobalResourcePrewarmRuntime } from '../../lib/resource-prewarm/resourcePrewarmRuntime'

export default function GlobalResourcePrewarmRuntime() {
  useEffect(() => installGlobalResourcePrewarmRuntime(), [])
  return null
}
