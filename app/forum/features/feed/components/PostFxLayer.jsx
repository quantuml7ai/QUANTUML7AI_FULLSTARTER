'use client'

import React from 'react'

export default function PostFxLayer({
  FX_POOL,
  BOOM_POOL,
  POST_BOOM_ENABLED,
  setFxNodeRef,
  setBoomNodeRef,
}) {
  if (!(FX_POOL > 0)) return null

  return (
    <div className="postFxLayer" aria-hidden="true">
      {Array.from({ length: FX_POOL }).map((_, i) => (
        <div key={i} ref={(el) => setFxNodeRef(el, i)} className="postFx" />
      ))}
      {POST_BOOM_ENABLED && BOOM_POOL > 0
        ? Array.from({ length: BOOM_POOL }).map((_, i) => (
            <div key={`b_${i}`} ref={(el) => setBoomNodeRef(el, i)} className="postBoom" />
          ))
        : null}
    </div>
  )
}
