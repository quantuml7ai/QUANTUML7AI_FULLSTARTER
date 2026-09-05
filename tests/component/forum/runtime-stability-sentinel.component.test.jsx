import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import LoadMoreSentinel from '../../../app/forum/features/feed/components/LoadMoreSentinel'
import useForumNickBadgeFit from '../../../app/forum/shared/hooks/useForumNickBadgeFit'

let observerCallback
let observerConstructs
let observerDisconnects
let rafId
let rafQueue

class FakeIntersectionObserver {
  constructor(callback) {
    observerCallback = callback
    observerConstructs += 1
  }
  observe() {}
  disconnect() { observerDisconnects += 1 }
}

function sentinelElement(props = {}) {
  return React.createElement(LoadMoreSentinel, props)
}

function flushRaf() {
  const batch = [...rafQueue.entries()]
  rafQueue.clear()
  batch.forEach(([, cb]) => cb())
}

describe('LoadMoreSentinel component progress lifecycle', () => {
  beforeEach(() => {
    observerConstructs = 0
    observerDisconnects = 0
    rafId = 0
    rafQueue = new Map()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      const id = ++rafId
      rafQueue.set(id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      rafQueue.delete(id)
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  test('does not repeat while the same key remains intersecting and rearms on progress without rebuilding the observer', () => {
    const onVisible = vi.fn()
    const { rerender } = render(sentinelElement({ onVisible, loadKey: 'a', hasMore: true }))

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(1)
    expect(observerConstructs).toBe(1)
    expect(observerDisconnects).toBe(0)

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(1)

    act(() => {
      rerender(sentinelElement({ onVisible, loadKey: 'b', hasMore: true }))
    })
    expect(observerConstructs).toBe(1)
    expect(observerDisconnects).toBe(0)

    act(() => { flushRaf() })
    expect(onVisible).toHaveBeenCalledTimes(2)
  })

  test('rearms when pending clears while the sentinel remains intersecting', () => {
    const onVisible = vi.fn()
    const { rerender } = render(sentinelElement({
      onVisible,
      loadKey: 'pending:stable',
      pending: true,
      hasMore: true,
    }))

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(0)
    expect(observerConstructs).toBe(1)

    act(() => {
      rerender(sentinelElement({
        onVisible,
        loadKey: 'pending:stable',
        pending: false,
        hasMore: true,
      }))
    })
    expect(observerConstructs).toBe(1)

    act(() => { flushRaf() })
    expect(onVisible).toHaveBeenCalledTimes(1)
  })

  test('suppresses immediate StrictMode-style remount replay for the same token', () => {
    const onVisible = vi.fn()
    const first = render(sentinelElement({ onVisible, loadKey: 'strict:unique', hasMore: true }))

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(1)

    first.unmount()
    render(sentinelElement({ onVisible, loadKey: 'strict:unique', hasMore: true }))
    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(1)
  })
})


function NickFitHarness({ text = 'QL7 AI GLOBAL' }) {
  const fitRef = useForumNickBadgeFit(text)
  return React.createElement(
    'span',
    {
      className: 'nick-badge',
      style: {
        display: 'inline-flex',
        maxWidth: '130px',
        paddingLeft: '10px',
        paddingRight: '10px',
      },
    },
    React.createElement(
      'span',
      {
        className: 'nick-text',
        ref: fitRef,
        style: { fontSize: '16px', whiteSpace: 'nowrap' },
      },
      text,
    ),
  )
}

describe('nickname StrictMode fit lifecycle', () => {
  beforeEach(() => {
    rafId = 0
    rafQueue = new Map()
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      const id = ++rafId
      rafQueue.set(id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      rafQueue.delete(id)
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  test('keeps the mounted nickname registered through StrictMode effect replay and unregisters on real unmount', () => {
    const view = render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(NickFitHarness, { text: 'QL7 AI GLOBAL' }),
      ),
    )

    const text = view.container.querySelector('.nick-text')
    const badge = view.container.querySelector('.nick-badge')
    expect(text).toBeTruthy()
    expect(badge).toBeTruthy()

    Object.defineProperty(badge, 'clientWidth', { configurable: true, value: 130 })
    Object.defineProperty(text, 'scrollWidth', { configurable: true, value: 220 })

    act(() => {
      window.dispatchEvent(new Event('resize'))
      flushRaf()
    })

    expect(rafQueue.size).toBe(0)
    expect(window.__forumNickFitState?.().registered).toBe(1)
    expect(window.__forumNickFitState?.().singleFrameFit).toBe(true)
    expect(text.textContent).toBe('QL7 AI GLOBAL')
    expect(text.style.maxWidth).toBe('100%')
    expect(text.style.textOverflow).toBe('clip')
    expect(Number.parseFloat(text.style.fontSize)).toBeGreaterThanOrEqual(7)
    expect(Number.parseFloat(text.style.fontSize)).toBeLessThan(16)

    const fittedFont = text.style.fontSize
    act(() => {
      for (let i = 0; i < 8; i += 1) window.dispatchEvent(new Event('resize'))
      flushRaf()
    })
    expect(rafQueue.size).toBe(0)
    expect(text.style.fontSize).toBe(fittedFont)

    view.unmount()
    expect(window.__forumNickFitState?.().registered ?? 0).toBe(0)
  })
})
