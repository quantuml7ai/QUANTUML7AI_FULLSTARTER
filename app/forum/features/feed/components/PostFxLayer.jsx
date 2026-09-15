'use client'

import React from 'react'

const postFxAnimationBoundNodes = new WeakSet()

function releaseFinishedPostFx(event) {
  event?.currentTarget?.classList?.remove?.('isLive')
}

function bindPostFxNode(el, index, setFxNodeRef) {
  if (el && !postFxAnimationBoundNodes.has(el)) {
    el.addEventListener('animationend', releaseFinishedPostFx)
    postFxAnimationBoundNodes.add(el)
  }
  setFxNodeRef(el, index)
}

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
        <div
          key={i}
          ref={(el) => bindPostFxNode(el, i, setFxNodeRef)}
          className="postFx"
        />
      ))}
      {POST_BOOM_ENABLED && BOOM_POOL > 0
        ? Array.from({ length: BOOM_POOL }).map((_, i) => (
            <div key={`b_${i}`} ref={(el) => setBoomNodeRef(el, i)} className="postBoom" />
          ))
        : null}
    </div>
  )
}
