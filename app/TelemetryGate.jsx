'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { usePathname } from 'next/navigation'

export default function TelemetryGate() {
  const pathname = usePathname() || ''
  const isForumRoute = pathname === '/forum' || pathname.startsWith('/forum/')

  if (isForumRoute) {
    // Forum is a long-lived media/feed runtime. Speed Insights attaches Web Vitals
    // observers that retain many PerformanceEventTiming entries during scroll.
    // In local dev Vercel Analytics also tries /_vercel/insights and creates 404 noise,
    // so keep forum telemetry only in production and only as lightweight Analytics.
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
