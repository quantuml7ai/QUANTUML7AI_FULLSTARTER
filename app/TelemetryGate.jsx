'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { usePathname } from 'next/navigation'

export default function TelemetryGate() {
  const pathname = usePathname() || ''
  const isForumRoute = pathname === '/forum' || pathname.startsWith('/forum/')

  if (isForumRoute) {
    return <Analytics />
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
