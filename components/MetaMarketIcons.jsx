'use client'

import React from 'react'

export function MetaMarketBackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
      <path d="M9 12h11" />
    </svg>
  )
}

export function MetaMarketCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  )
}

export function MetaMarketSparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  )
}

export function MetaMarketHistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.8 9.2A7.4 7.4 0 1 1 4.2 14" />
      <path d="M4.5 5.8v3.9h3.9" />
      <path d="M12 7.7v4.7l3.1 1.9" />
    </svg>
  )
}

export function MetaMarketGiftIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="mmGiftStroke" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset=".46" stopColor="#c084fc" />
          <stop offset=".78" stopColor="#facc15" />
          <stop offset="1" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <path className="userInfoGiftComet" d="M6.2 8.6C11.4 2.8 21.2 3.1 26 9" fill="none" stroke="url(#mmGiftStroke)" strokeWidth="1.4" strokeLinecap="round" />
      <path className="userInfoGiftBox" d="M7.5 14.2h17v12h-17z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path className="userInfoGiftLid" d="M5.6 10.2h20.8v4H5.6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path className="userInfoGiftRibbon" d="M16 10.2v16M8.3 20.1h15.4" fill="none" stroke="url(#mmGiftStroke)" strokeWidth="1.8" strokeLinecap="round" />
      <path className="userInfoGiftBow" d="M16 10.2c-4.5 0-6.6-.9-6.6-2.7 0-1.3 1.1-2.2 2.6-2.2 2 0 3.2 1.7 4 4.9Zm0 0c4.5 0 6.6-.9 6.6-2.7 0-1.3-1.1-2.2-2.6-2.2-2 0-3.2 1.7-4 4.9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path className="userInfoGiftCore" d="M16 16.7l2.2 2.2-2.2 2.2-2.2-2.2z" fill="rgba(250,204,21,.9)" />
      <circle className="userInfoGiftSpark userInfoGiftSparkA" cx="7.6" cy="7.4" r="1.2" />
      <circle className="userInfoGiftSpark userInfoGiftSparkB" cx="25.2" cy="18.9" r="1" />
    </svg>
  )
}
