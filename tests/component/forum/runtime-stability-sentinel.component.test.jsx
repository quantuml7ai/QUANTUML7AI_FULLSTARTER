import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import LoadMoreSentinel from '../../../app/forum/features/feed/components/LoadMoreSentinel'
import PostFxLayer from '../../../app/forum/features/feed/components/PostFxLayer'
import useForumNickBadgeFit from '../../../app/forum/shared/hooks/useForumNickBadgeFit'
import useForumWindowing, { isForumWindowingMediaKeepaliveSensitive } from '../../../app/forum/shared/hooks/useForumWindowing'

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


describe('PostFxLayer idle paint lifecycle', () => {
  test('returns a finished pooled FX node to the raster-cold idle state on animation end', () => {
    const view = render(
      React.createElement(PostFxLayer, {
        FX_POOL: 1,
        BOOM_POOL: 0,
        POST_BOOM_ENABLED: false,
        setFxNodeRef: vi.fn(),
        setBoomNodeRef: vi.fn(),
      }),
    )

    const node = view.container.querySelector('.postFx')
    expect(node).toBeTruthy()
    node.classList.add('isLive')

    fireEvent.animationEnd(node)
    expect(node.classList.contains('isLive')).toBe(false)
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


describe('forum media keepalive windowing lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('explicit keepalive opt-out wins over stable-shell descendants', () => {
    const direct = document.createElement('div')
    direct.setAttribute('data-stable-shell', '1')
    expect(isForumWindowingMediaKeepaliveSensitive(direct)).toBe(true)

    direct.setAttribute('data-windowing-keepalive', '0')
    expect(isForumWindowingMediaKeepaliveSensitive(direct)).toBe(false)

    const card = document.createElement('div')
    const optOut = document.createElement('div')
    const nestedStable = document.createElement('div')
    optOut.setAttribute('data-windowing-keepalive', '0')
    nestedStable.setAttribute('data-stable-shell', '1')
    optOut.appendChild(nestedStable)
    card.appendChild(optOut)
    expect(isForumWindowingMediaKeepaliveSensitive(card)).toBe(false)

    const independentStable = document.createElement('div')
    independentStable.setAttribute('data-stable-shell', '1')
    card.appendChild(independentStable)
    expect(isForumWindowingMediaKeepaliveSensitive(card)).toBe(true)
  })

  test('measure refs stay stable across rerenders and first mount measurement is frame-batched', async () => {
    let localRafId = 0
    const localRafQueue = new Map()
    let layoutReads = 0

    vi.stubGlobal('requestAnimationFrame', (callback) => {
      const id = ++localRafId
      localRafQueue.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      localRafQueue.delete(id)
    })

    const flushLocalRaf = async () => {
      let guard = 0
      while (localRafQueue.size && guard < 20) {
        guard += 1
        const callbacks = [...localRafQueue.values()]
        localRafQueue.clear()
        await act(async () => {
          callbacks.forEach((callback) => callback(performance.now()))
        })
      }
      expect(guard).toBeLessThan(20)
    }

    const initialItems = [{ id: 'stable:0' }, { id: 'stable:1' }]
    const { result, rerender, unmount } = renderHook(({ items }) => useForumWindowing({
      active: true,
      items,
      getItemKey: (item) => item.id,
      estimateItemHeight: () => 600,
      maxRender: 8,
      overscanPx: 80,
      getScrollEl: () => null,
      listId: 'test:stable-measure-ref',
      mediaKeepaliveEnabled: false,
    }), { initialProps: { items: initialItems } })

    const node = document.createElement('div')
    Object.defineProperty(node, 'offsetHeight', {
      configurable: true,
      get: () => {
        layoutReads += 1
        return 600
      },
    })
    node.getBoundingClientRect = () => {
      layoutReads += 1
      return {
        x: 0, y: 0, top: 0, right: 320, bottom: 600, left: 0,
        width: 320, height: 600, toJSON: () => ({}),
      }
    }
    document.body.appendChild(node)

    try {
      await flushLocalRaf()
      const firstRef = result.current.measureRef('stable:0')

      rerender({ items: [...initialItems] })
      const secondRef = result.current.measureRef('stable:0')
      const otherRef = result.current.measureRef('stable:1')

      expect(secondRef).toBe(firstRef)
      expect(otherRef).not.toBe(firstRef)

      act(() => {
        firstRef(node)
      })

      // The callback ref itself must not synchronously force layout during commit.
      expect(layoutReads).toBe(0)
      expect(localRafQueue.size).toBeGreaterThan(0)

      await flushLocalRaf()
      expect(layoutReads).toBeGreaterThan(0)

      act(() => {
        firstRef(null)
      })
    } finally {
      unmount()
      node.remove()
    }
  })

  test('optional scroll-settle mode clears velocity without forcing a second recalculation', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })

    const pageYOffsetDescriptor = Object.getOwnPropertyDescriptor(window, 'pageYOffset')
    let currentScrollTop = 0
    let localRafId = 0
    const localRafQueue = new Map()

    Object.defineProperty(window, 'pageYOffset', {
      configurable: true,
      get: () => currentScrollTop,
    })

    vi.stubGlobal('requestAnimationFrame', (callback) => {
      const id = ++localRafId
      localRafQueue.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      localRafQueue.delete(id)
    })

    const flushLocalRaf = async () => {
      let guard = 0
      while (localRafQueue.size && guard < 20) {
        guard += 1
        const callbacks = [...localRafQueue.values()]
        localRafQueue.clear()
        await act(async () => {
          callbacks.forEach((callback) => callback(performance.now()))
        })
      }
      expect(guard).toBeLessThan(20)
    }

    const items = Array.from({ length: 20 }, (_, index) => ({ id: `settle:${index}` }))
    const { unmount } = renderHook(() => useForumWindowing({
      active: true,
      items,
      getItemKey: (item) => item.id,
      estimateItemHeight: () => 600,
      maxRender: 8,
      overscanPx: ({ velocity }) => 80 + Math.round(Math.abs(Number(velocity || 0)) * 100),
      getScrollEl: () => null,
      listId: 'test:no-settle-recalc',
      scrollSettleMs: 120,
      mediaKeepaliveEnabled: false,
      recalcOnScrollSettle: false,
    }))

    try {
      await flushLocalRaf()

      currentScrollTop = 1200
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
      await flushLocalRaf()
      expect(localRafQueue.size).toBe(0)

      act(() => {
        vi.advanceTimersByTime(140)
      })

      // Settling may clear stale velocity internally, but must not enqueue a
      // second window-placement pass that can move the leading spacer.
      expect(localRafQueue.size).toBe(0)
    } finally {
      unmount()
      vi.useRealTimers()
      if (pageYOffsetDescriptor) Object.defineProperty(window, 'pageYOffset', pageYOffsetDescriptor)
      else delete window.pageYOffset
    }
  })

  test('keepalive expansion is bounded and TTL expiry shrinks without another scroll event', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })

    const pageYOffsetDescriptor = Object.getOwnPropertyDescriptor(window, 'pageYOffset')
    const innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight')
    const innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth')
    let currentScrollTop = 0
    let localRafId = 0
    const localRafQueue = new Map()
    const measuredNodes = []

    Object.defineProperty(window, 'pageYOffset', {
      configurable: true,
      get: () => currentScrollTop,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 300,
    })
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    })

    vi.stubGlobal('requestAnimationFrame', (callback) => {
      const id = ++localRafId
      localRafQueue.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      localRafQueue.delete(id)
    })

    const flushLocalRaf = async () => {
      let guard = 0
      while (localRafQueue.size && guard < 20) {
        guard += 1
        const callbacks = [...localRafQueue.values()]
        localRafQueue.clear()
        await act(async () => {
          callbacks.forEach((callback) => callback(performance.now()))
        })
      }
      expect(guard).toBeLessThan(20)
    }

    const items = Array.from({ length: 40 }, (_, index) => ({ id: `item:${index}` }))
    const { result, unmount } = renderHook(() => useForumWindowing({
      active: true,
      items,
      getItemKey: (item) => item.id,
      estimateItemHeight: () => 600,
      maxRender: 8,
      overscanPx: 80,
      getScrollEl: () => null,
      listId: 'test:keepalive-expiry',
      scrollSettleMs: 120,
      windowStickyMs: 20,
      mediaKeepaliveEnabled: true,
    }))

    const mountMeasuredStableCard = (index) => {
      const node = document.createElement('div')
      node.setAttribute('data-stable-shell', '1')
      Object.defineProperty(node, 'offsetHeight', {
        configurable: true,
        get: () => 600,
      })
      node.getBoundingClientRect = () => ({
        x: 0,
        y: (index * 600) - currentScrollTop,
        top: (index * 600) - currentScrollTop,
        right: 320,
        bottom: ((index + 1) * 600) - currentScrollTop,
        left: 0,
        width: 320,
        height: 600,
        toJSON: () => ({}),
      })
      document.body.appendChild(node)
      measuredNodes.push(node)
      act(() => {
        result.current.measureRef(`item:${index}`)(node)
      })
    }

    try {
      await flushLocalRaf()

      for (let index = 0; index <= 12; index += 1) {
        currentScrollTop = index * 600
        act(() => {
          window.dispatchEvent(new Event('scroll'))
        })
        await flushLocalRaf()
        mountMeasuredStableCard(index)
        act(() => {
          vi.advanceTimersByTime(40)
        })
      }

      act(() => {
        vi.advanceTimersByTime(160)
      })
      await flushLocalRaf()

      const held = { ...result.current.win }
      const heldSize = held.end - held.start
      expect(held.start).toBeLessThanOrEqual(12)
      expect(held.end).toBeGreaterThan(12)
      expect(heldSize).toBeLessThanOrEqual(12)

      act(() => {
        vi.advanceTimersByTime(3800)
      })
      await flushLocalRaf()

      const settled = { ...result.current.win }
      const settledSize = settled.end - settled.start
      expect(settled.start).toBeLessThanOrEqual(12)
      expect(settled.end).toBeGreaterThan(12)
      expect(settledSize).toBeLessThanOrEqual(8)
      expect(settledSize).toBeLessThan(heldSize)
      expect(settled.start).toBeGreaterThanOrEqual(held.start)
    } finally {
      unmount()
      measuredNodes.forEach((node) => node.remove())
      vi.useRealTimers()

      if (pageYOffsetDescriptor) Object.defineProperty(window, 'pageYOffset', pageYOffsetDescriptor)
      else delete window.pageYOffset
      if (innerHeightDescriptor) Object.defineProperty(window, 'innerHeight', innerHeightDescriptor)
      else delete window.innerHeight
      if (innerWidthDescriptor) Object.defineProperty(window, 'innerWidth', innerWidthDescriptor)
      else delete window.innerWidth
    }
  })
})
