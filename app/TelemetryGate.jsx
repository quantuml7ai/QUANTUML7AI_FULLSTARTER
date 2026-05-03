'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { usePathname } from 'next/navigation'

export default function TelemetryGate() {
  const pathname = usePathname() || ''
  const isForumRoute = pathname === '/forum' || pathname.startsWith('/forum/')

  if (isForumRoute) {
    // Local/dev forum profiling must not be polluted by Vercel runtime probes.
    // In production we keep Web Analytics for business metrics, but keep
    // Speed Insights off on the infinite media feed because it observes
    // interaction/event timing and adds measurable pressure during long scroll.
    if (process.env.NODE_ENV !== 'production') return null
    return <Analytics />
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
