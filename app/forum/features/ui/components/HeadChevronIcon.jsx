'use client'

import React from 'react'
import { cls } from '../../../shared/utils/classnames'

export default function HeadChevronIcon({ dir = 'down' }) {
  const isUp = dir === 'up'
  return (
    <svg
      className={cls('headArrowSvg', isUp && 'up')}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="chev chev1"
        d="M6 6l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="chev chev2"
        d="M6 11l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="chev chev3"
        d="M6 16l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
