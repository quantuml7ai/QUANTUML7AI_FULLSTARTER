'use client'

import React from 'react'

export function QCastIconPlay() {
  return (
    <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l12-7-12-7z" fill="currentColor" />
    </svg>
  )
}

export function QCastIconPause() {
  return (
    <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z" fill="currentColor" />
    </svg>
  )
}

export function QCastIconBack10() {
  return (
    <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5a7 7 0 1 1-6.2 3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.2 10.2h1.1v4.1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.9 14.3h-2.2c0-1.3 2.2-1.2 2.2-2.6 0-.8-.6-1.3-1.5-1.3-.7 0-1.3.3-1.6.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function QCastIconFwd10() {
  return (
    <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5a7 7 0 1 0 6.2 3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 4v4h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.2 10.2h1.1v4.1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.9 14.3h-2.2c0-1.3 2.2-1.2 2.2-2.6 0-.8-.6-1.3-1.5-1.3-.7 0-1.3.3-1.6.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function QCastIconVolume({ off }) {
  if (off) {
    return (
      <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5 6.8 8.5H4v7h2.8L11 19V5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 9l4 6M20 9l-4 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 6.8 8.5H4v7h2.8L11 19V5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 6.5a7 7 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function QCastIconGear() {
  return (
    <svg className="qcastIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.2-2-3.4-2.3.6a8.2 8.2 0 0 0-1.7-1L15 3h-6l-.4 2.9a8.2 8.2 0 0 0-1.7 1L4.6 6.4l-2 3.4 2 1.2a7.9 7.9 0 0 0 0 2l-2 1.2 2 3.4 2.3-.6c.5.4 1.1.7 1.7 1L9 21h6l.4-2.9c.6-.3 1.2-.6 1.7-1l2.3.6 2-3.4-2-1.2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
