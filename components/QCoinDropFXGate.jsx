'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import QCoinDropFX from './QCoinDropFX'

const FORUM_PATH_RE = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?forum(?:\/|$)/i

export default function QCoinDropFXGate() {
  const pathname = usePathname() || ''

  const isLowFxDevice = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      const coarse = !!window.matchMedia?.('(pointer: coarse)')?.matches
      const mem = Number(window.navigator?.deviceMemory || 0)
      const lowMem = Number.isFinite(mem) && mem > 0 && mem <= 4
      return coarse || lowMem
    } catch {}
    return false
  }, [])

  const isForumRoute = React.useMemo(
    () => FORUM_PATH_RE.test(String(pathname || '')),
    [pathname]
  )

  if (!pathname) return null
  if (isLowFxDevice || isForumRoute) return null
  return <QCoinDropFX />
}
