'use client'

import React from 'react'

export default function StarButton({ on, onClick, title = '', disabled = false }) {
  return (
    <button
      type="button"
      className={`starBtn ${on ? 'on' : 'off'} ${disabled ? 'dis' : ''}`}
      title={title}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) onClick?.(e)
      }}
      data-no-thread-open="1"
      aria-pressed={!!on}
      aria-disabled={disabled}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
          d="M12 17.3l-5.4 3.2 1.5-6.2-4.9-4.1 6.4-.5L12 3.8l2.4 5.9 6.4.5-4.9 4.1 1.5 6.2L12 17.3Z"
          className="starPath"
        />
      </svg>
    </button>
  )
}
