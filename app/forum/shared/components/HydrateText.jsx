'use client'

import React from 'react'

export default function HydrateText({ value }) {
  const [mounted, setMounted] = React.useState(false)
  const initial = React.useRef(String(value))
  React.useEffect(() => {
    setMounted(true)
  }, [])
  return <span suppressHydrationWarning>{mounted ? String(value) : initial.current}</span>
}
