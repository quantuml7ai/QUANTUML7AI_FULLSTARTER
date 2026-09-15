import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, renderHook } from '@testing-library/react'
import LoadMoreSentinel from '../../../app/forum/features/feed/components/LoadMoreSentinel'
import DmThreadLoadMore from '../../../app/forum/features/dm/components/DmThreadLoadMore'
import VideoFeedPane, { useVideoFeedTailWatchdog } from '../../../app/forum/features/media/components/VideoFeedPane'
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

  test('opt-in edge mode does not replay for token, pending, or rerender changes while intersecting', () => {
    const onVisible = vi.fn()
    const { rerender } = render(sentinelElement({
      onVisible,
      loadKey: 'edge:one',
      hasMore: true,
      requireExitBeforeReplay: true,
    }))

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(1)

    act(() => {
      rerender(sentinelElement({
        onVisible,
        loadKey: 'edge:two',
        pending: true,
        hasMore: true,
        requireExitBeforeReplay: true,
      }))
      flushRaf()
    })
    act(() => {
      rerender(sentinelElement({
        onVisible,
        loadKey: 'edge:two',
        pending: false,
        hasMore: true,
        requireExitBeforeReplay: true,
      }))
      flushRaf()
    })
    act(() => {
      rerender(sentinelElement({
        onVisible,
        loadKey: 'edge:two',
        pending: false,
        hasMore: true,
        requireExitBeforeReplay: true,
      }))
      flushRaf()
    })

    expect(onVisible).toHaveBeenCalledTimes(1)
    expect(observerConstructs).toBe(1)
  })

  test('opt-in edge mode rearms only after exit and a new enter for the next frontier', () => {
    const onVisible = vi.fn()
    const onExit = vi.fn()
    const { rerender } = render(sentinelElement({
      onVisible,
      onExit,
      loadKey: 'edge:exit:a',
      hasMore: true,
      requireExitBeforeReplay: true,
    }))

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    rerender(sentinelElement({
      onVisible,
      onExit,
      loadKey: 'edge:exit:b',
      hasMore: true,
      requireExitBeforeReplay: true,
    }))
    act(() => { flushRaf() })
    expect(onVisible).toHaveBeenCalledTimes(1)

    act(() => {
      observerCallback([{ isIntersecting: false }])
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onVisible).toHaveBeenCalledTimes(2)
  })

  test('opt-in layout rearm advances once only when the committed new frontier remains in the viewport', () => {
    const onVisible = vi.fn()
    const onLayoutRearm = vi.fn()
    const view = render(sentinelElement({
      onVisible,
      onLayoutRearm,
      loadKey: 'edge:layout:a',
      hasMore: true,
      requireExitBeforeReplay: true,
    }))
    const sentinel = view.container.querySelector('.loadMoreSentinel')
    sentinel.getBoundingClientRect = () => ({ top: 100, right: 10, bottom: 100, left: 0 })

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(1)

    view.rerender(sentinelElement({
      onVisible,
      onLayoutRearm,
      loadKey: 'edge:layout:b',
      hasMore: true,
      requireExitBeforeReplay: true,
      layoutRearmKey: 'commit:1',
      layoutRearmFromLoadKey: 'edge:layout:a',
    }))
    act(() => {
      flushRaf()
      flushRaf()
      flushRaf()
    })

    expect(onLayoutRearm).toHaveBeenCalledTimes(1)
    expect(onVisible).toHaveBeenCalledTimes(2)

    view.rerender(sentinelElement({
      onVisible,
      onLayoutRearm,
      loadKey: 'edge:layout:c',
      hasMore: true,
      requireExitBeforeReplay: true,
      layoutRearmKey: 'commit:1',
      layoutRearmFromLoadKey: 'edge:layout:a',
    }))
    act(() => {
      flushRaf()
      flushRaf()
      flushRaf()
    })
    expect(onVisible).toHaveBeenCalledTimes(2)
  })

  test('opt-in layout rearm stays blocked when the appended page moves the footer below the viewport', () => {
    const onVisible = vi.fn()
    const onLayoutRearm = vi.fn()
    const view = render(sentinelElement({
      onVisible,
      onLayoutRearm,
      loadKey: 'edge:below:a',
      hasMore: true,
      requireExitBeforeReplay: true,
    }))
    const sentinel = view.container.querySelector('.loadMoreSentinel')
    sentinel.getBoundingClientRect = () => ({ top: 2000, right: 10, bottom: 2000, left: 0 })

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    view.rerender(sentinelElement({
      onVisible,
      onLayoutRearm,
      loadKey: 'edge:below:b',
      hasMore: true,
      requireExitBeforeReplay: true,
      layoutRearmKey: 'commit:below',
      layoutRearmFromLoadKey: 'edge:below:a',
    }))
    act(() => {
      flushRaf()
      flushRaf()
      flushRaf()
    })

    expect(onVisible).toHaveBeenCalledTimes(1)
    expect(onLayoutRearm).not.toHaveBeenCalled()
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

  test('virtualized remount reserves the last confirmed physical footprint until natural geometry recovers', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })

    const pageYOffsetDescriptor = Object.getOwnPropertyDescriptor(window, 'pageYOffset')
    let currentScrollTop = 0
    let localRafId = 0
    const localRafQueue = new Map()
    const resizeObservers = []

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

    class LocalResizeObserver {
      constructor(callback) {
        this.callback = callback
        resizeObservers.push(this)
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', LocalResizeObserver)

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

    const createMeasuredNode = (readNaturalHeight, onLayoutRead) => {
      const node = document.createElement('div')
      const readBoxHeight = () => {
        onLayoutRead()
        const natural = Number(readNaturalHeight() || 0)
        const reserved = Number.parseFloat(node.style.minHeight || '') || 0
        return Math.max(natural, reserved)
      }
      Object.defineProperty(node, 'offsetHeight', {
        configurable: true,
        get: readBoxHeight,
      })
      node.getBoundingClientRect = () => {
        const height = readBoxHeight()
        return {
          x: 0,
          y: 0,
          top: 0,
          right: 320,
          bottom: height,
          left: 0,
          width: 320,
          height,
          toJSON: () => ({}),
        }
      }
      document.body.appendChild(node)
      return node
    }

    const items = [{ id: 'remount:0' }, { id: 'remount:1' }]
    const { result, unmount } = renderHook(() => useForumWindowing({
      active: true,
      items,
      getItemKey: (item) => item.id,
      estimateItemHeight: () => 600,
      maxRender: 2,
      overscanPx: 80,
      getScrollEl: () => null,
      listId: 'test:remount-footprint-reservation',
      mediaKeepaliveEnabled: false,
      scrollSettleMs: 120,
    }))

    let firstNaturalHeight = 940
    let firstLayoutReads = 0
    let remountNaturalHeight = 600
    let remountLayoutReads = 0
    const firstNode = createMeasuredNode(
      () => firstNaturalHeight,
      () => { firstLayoutReads += 1 },
    )
    let remountNode = null

    try {
      await flushLocalRaf()
      const rowRef = result.current.measureRef('remount:0')

      act(() => {
        rowRef(firstNode)
      })
      expect(firstLayoutReads).toBe(0)
      await flushLocalRaf()
      expect(firstLayoutReads).toBeGreaterThan(0)

      act(() => {
        rowRef(null)
      })
      firstNode.remove()

      currentScrollTop = 40
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })
      await flushLocalRaf()

      remountNode = createMeasuredNode(
        () => remountNaturalHeight,
        () => { remountLayoutReads += 1 },
      )

      act(() => {
        rowRef(remountNode)
      })

      // The reservation is written synchronously from the confirmed cache,
      // before any remount layout read can paint the transient 600px shell.
      expect(remountLayoutReads).toBe(0)
      expect(Number.parseFloat(remountNode.style.minHeight)).toBeCloseTo(940, 3)

      await flushLocalRaf()
      expect(remountLayoutReads).toBeGreaterThan(0)
      expect(Number.parseFloat(remountNode.style.minHeight)).toBeCloseTo(940, 3)

      // Once natural content catches the reservation, removing min-height has
      // zero physical delta and therefore cannot create the paired return jump.
      remountNaturalHeight = 940
      const activeObserver = resizeObservers[resizeObservers.length - 1]
      expect(activeObserver).toBeTruthy()
      act(() => {
        activeObserver.callback([{ target: remountNode }], activeObserver)
      })
      expect(remountNode.style.minHeight).toBe('')
    } finally {
      unmount()
      firstNode.remove()
      remountNode?.remove()
      vi.useRealTimers()
      if (pageYOffsetDescriptor) Object.defineProperty(window, 'pageYOffset', pageYOffsetDescriptor)
      else delete window.pageYOffset
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

function createVideoFeedPaneProps(overrides = {}) {
  const videoFeed = overrides.videoFeed || [{ id: 'p1' }]
  const visibleVideoCount = overrides.visibleVideoCount ?? videoFeed.length
  const vfSlots = overrides.vfSlots || videoFeed.slice(0, visibleVideoCount).map((item) => ({
    type: 'item',
    key: `item:${item.id}`,
    item,
  }))
  return {
    t: () => 'Loading',
    vfWin: { start: 0, end: vfSlots.length, top: 0, bottom: 0 },
    vfSlots,
    vfMeasureRef: () => () => {},
    dataPosts: videoFeed,
    openThreadForPost: vi.fn(),
    resolveNickForDisplay: () => '',
    openReportPopover: vi.fn(),
    openSharePopover: vi.fn(),
    reactMut: vi.fn(),
    isAdmin: false,
    delPost: vi.fn(),
    delPostOwn: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    bannedSet: new Set(),
    viewerId: 'me',
    markViewPost: vi.fn(),
    starredAuthors: new Set(),
    toggleAuthorStar: vi.fn(),
    handleUserInfoToggle: vi.fn(),
    pickAdUrlForSlot: () => '',
    compensateScrollOnResize: vi.fn(),
    videoServerLoading: false,
    videoServerHasMore: true,
    loadVideoFeedPage: vi.fn(async () => ({ ok: true, count: 1, hasMore: true })),
    setVisibleVideoCount: vi.fn(),
    visibleVideoCount,
    videoPageSize: 1,
    videoFeed,
    PostCard: ({ p }) => React.createElement('div', { 'data-testid': `video-card:${p?.id}` }),
    ForumAdSlot: () => React.createElement('div'),
    LoadMoreSentinel,
    userRecommendationsRail: null,
    userRecommendationsRuntime: null,
    onOpenUserPosts: vi.fn(),
    ...overrides,
  }
}

function VideoFeedServerHarness({ loadPage, initialHasMore = true, windowingReady = true }) {
  const [videoFeed, setVideoFeed] = React.useState([{ id: 'p1' }])
  const [visibleVideoCount, setVisibleVideoCount] = React.useState(1)
  const [videoServerLoading, setVideoServerLoading] = React.useState(false)
  const [videoServerHasMore, setVideoServerHasMore] = React.useState(initialHasMore)

  const loadVideoFeedPage = React.useCallback(async (options) => {
    setVideoServerLoading(true)
    try {
      const result = await loadPage(options)
      const count = Math.max(0, Number(result?.count || 0))
      if (result?.ok !== false && count > 0) {
        setVideoFeed((previous) => {
          const offset = previous.length
          return previous.concat(Array.from({ length: count }, (_, index) => ({ id: `p${offset + index + 1}` })))
        })
      }
      if (typeof result?.hasMore === 'boolean') setVideoServerHasMore(result.hasMore)
      return result
    } finally {
      setVideoServerLoading(false)
    }
  }, [loadPage])

  const vfSlots = videoFeed.slice(0, visibleVideoCount).map((item) => ({
    type: 'item',
    key: `item:${item.id}`,
    item,
  }))
  const vfWin = windowingReady
    ? { start: 0, end: vfSlots.length, top: 0, bottom: 0 }
    : { start: 0, end: Math.min(1, vfSlots.length), top: 0, bottom: 0 }

  return React.createElement(VideoFeedPane, createVideoFeedPaneProps({
    videoFeed,
    dataPosts: videoFeed,
    visibleVideoCount,
    setVisibleVideoCount,
    videoServerLoading,
    videoServerHasMore,
    loadVideoFeedPage,
    vfSlots,
    vfWin,
  }))
}

describe('Video Feed direct tail recovery watchdog', () => {
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

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('kicks pagination at the rendered tail without any sentinel event', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const advanceVideoFeed = vi.fn(async () => ({ ok: true }))
    const tailNode = document.createElement('div')
    tailNode.getBoundingClientRect = () => ({ top: 100, right: 10, bottom: 100, left: 0 })
    document.body.appendChild(tailNode)

    const { unmount } = renderHook(() => useVideoFeedTailWatchdog({
      enabled: true,
      vfSlotsLength: 20,
      vfWindowEnd: 20,
      loadedVideoCount: 20,
      frontierKey: '20:20:1',
      tailElementRef: { current: tailNode },
      advanceVideoFeed,
      firstDelayMs: 50,
    }))

    await act(async () => {
      vi.advanceTimersByTime(55)
      await Promise.resolve()
    })

    expect(advanceVideoFeed).toHaveBeenCalledWith({ reason: 'tail_watchdog', forceRecovery: true })
    expect(advanceVideoFeed).toHaveBeenCalledTimes(1)
    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(advanceVideoFeed).toHaveBeenCalledTimes(1)
    unmount()
    tailNode.remove()
  })

  test('does not kick while the rendered window is away from the tail', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const advanceVideoFeed = vi.fn(async () => ({ ok: true }))

    const { unmount } = renderHook(() => useVideoFeedTailWatchdog({
      enabled: true,
      vfSlotsLength: 40,
      vfWindowEnd: 39,
      loadedVideoCount: 40,
      frontierKey: '20:40:1',
      advanceVideoFeed,
      firstDelayMs: 30,
    }))

    await act(async () => {
      vi.advanceTimersByTime(220)
      await Promise.resolve()
    })

    expect(advanceVideoFeed).not.toHaveBeenCalled()
    unmount()
  })

  test('does not treat windowing overscan as a physical tail before the footer reaches the viewport', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const loadVideoFeedPage = vi.fn(async () => ({ ok: true, count: 1, hasMore: true }))
    const DeadSentinel = () => React.createElement('div', { 'data-testid': 'physical-tail-sentinel' })
    const view = render(React.createElement(VideoFeedPane, createVideoFeedPaneProps({
      loadVideoFeedPage,
      LoadMoreSentinel: DeadSentinel,
    })))
    const footer = view.container.querySelector('.loadMoreFooter')
    let footerTop = 2000
    footer.getBoundingClientRect = () => ({ top: footerTop, right: 10, bottom: footerTop + 64, left: 0 })

    act(() => { window.dispatchEvent(new Event('scroll')) })
    await act(async () => {
      vi.advanceTimersByTime(1200)
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).not.toHaveBeenCalled()

    footerTop = 100
    act(() => { window.dispatchEvent(new Event('scroll')) })
    await act(async () => {
      vi.advanceTimersByTime(519)
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(2)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).toHaveBeenCalledTimes(1)
    view.unmount()
  })

  test('reveals a prefetched local server page in 20-card steps without a network request when the sentinel is dead', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const loadVideoFeedPage = vi.fn(async () => ({ ok: true, count: 20, hasMore: true }))
    const setVisibleVideoCount = vi.fn()
    const DeadSentinel = () => React.createElement('div', { 'data-testid': 'dead-video-sentinel-local' })
    const PostCardStub = () => React.createElement('div', { 'data-testid': 'video-card-local' })
    const AdStub = () => React.createElement('div')
    const videoFeed = Array.from({ length: 40 }, (_, index) => ({ id: `p${index + 1}` }))
    const vfSlots = videoFeed.slice(0, 20).map((item) => ({ type: 'item', key: `item:${item.id}`, item }))

    const view = render(React.createElement(VideoFeedPane, {
      t: () => 'Loading',
      vfWin: { start: 0, end: 20, top: 0, bottom: 0 },
      vfSlots,
      vfMeasureRef: () => () => {},
      dataPosts: videoFeed,
      openThreadForPost: vi.fn(),
      resolveNickForDisplay: () => '',
      openReportPopover: vi.fn(),
      openSharePopover: vi.fn(),
      reactMut: vi.fn(),
      isAdmin: false,
      delPost: vi.fn(),
      delPostOwn: vi.fn(),
      banUser: vi.fn(),
      unbanUser: vi.fn(),
      bannedSet: new Set(),
      viewerId: 'me',
      markViewPost: vi.fn(),
      starredAuthors: new Set(),
      toggleAuthorStar: vi.fn(),
      handleUserInfoToggle: vi.fn(),
      pickAdUrlForSlot: () => '',
      compensateScrollOnResize: vi.fn(),
      videoServerLoading: false,
      videoServerHasMore: true,
      loadVideoFeedPage,
      setVisibleVideoCount,
      visibleVideoCount: 20,
      videoPageSize: 20,
      videoFeed,
      PostCard: PostCardStub,
      ForumAdSlot: AdStub,
      LoadMoreSentinel: DeadSentinel,
      userRecommendationsRail: null,
      userRecommendationsRuntime: null,
      onOpenUserPosts: vi.fn(),
    }))

    await act(async () => {
      vi.advanceTimersByTime(560)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(view.getByTestId('dead-video-sentinel-local')).toBeTruthy()
    expect(loadVideoFeedPage).not.toHaveBeenCalled()
    expect(setVisibleVideoCount).toHaveBeenCalled()
    const updater = setVisibleVideoCount.mock.calls[0]?.[0]
    expect(typeof updater).toBe('function')
    expect(updater(20)).toBe(40)
    view.unmount()
  })

  test('VideoFeedPane issues a real server page request when the shared sentinel never fires', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const loadVideoFeedPage = vi.fn(async () => ({ ok: true, count: 1, hasMore: true }))
    const setVisibleVideoCount = vi.fn()
    const DeadSentinel = () => React.createElement('div', { 'data-testid': 'dead-video-sentinel' })
    const PostCardStub = () => React.createElement('div', { 'data-testid': 'video-card' })
    const AdStub = () => React.createElement('div')

    const view = render(React.createElement(VideoFeedPane, {
      t: () => 'Loading',
      vfWin: { start: 0, end: 1, top: 0, bottom: 0 },
      vfSlots: [{ type: 'item', key: 'item:p1', item: { id: 'p1' } }],
      vfMeasureRef: () => () => {},
      dataPosts: [{ id: 'p1' }],
      openThreadForPost: vi.fn(),
      resolveNickForDisplay: () => '',
      openReportPopover: vi.fn(),
      openSharePopover: vi.fn(),
      reactMut: vi.fn(),
      isAdmin: false,
      delPost: vi.fn(),
      delPostOwn: vi.fn(),
      banUser: vi.fn(),
      unbanUser: vi.fn(),
      bannedSet: new Set(),
      viewerId: 'me',
      markViewPost: vi.fn(),
      starredAuthors: new Set(),
      toggleAuthorStar: vi.fn(),
      handleUserInfoToggle: vi.fn(),
      pickAdUrlForSlot: () => '',
      compensateScrollOnResize: vi.fn(),
      videoServerLoading: false,
      videoServerHasMore: true,
      loadVideoFeedPage,
      setVisibleVideoCount,
      visibleVideoCount: 1,
      videoPageSize: 1,
      videoFeed: [{ id: 'p1' }],
      PostCard: PostCardStub,
      ForumAdSlot: AdStub,
      LoadMoreSentinel: DeadSentinel,
      userRecommendationsRail: null,
      userRecommendationsRuntime: null,
      onOpenUserPosts: vi.fn(),
    }))

    await act(async () => {
      vi.advanceTimersByTime(560)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(view.getByTestId('dead-video-sentinel')).toBeTruthy()
    expect(loadVideoFeedPage).toHaveBeenCalledWith({ reason: 'tail_watchdog', forceRecovery: true })
    expect(setVisibleVideoCount).toHaveBeenCalled()
    view.unmount()
  })

  test('sentinel and watchdog share one claimed server frontier when the sentinel wins', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    let sentinelProps = null
    const CapturingSentinel = (props) => {
      sentinelProps = props
      return React.createElement('div', { 'data-testid': 'captured-video-sentinel' })
    }
    const loadVideoFeedPage = vi.fn(async () => ({ ok: true, count: 1, hasMore: true }))
    const view = render(React.createElement(VideoFeedPane, createVideoFeedPaneProps({
      LoadMoreSentinel: CapturingSentinel,
      loadVideoFeedPage,
    })))

    await act(async () => {
      sentinelProps.onVisible()
      await Promise.resolve()
      await Promise.resolve()
      vi.advanceTimersByTime(560)
      await Promise.resolve()
    })

    expect(loadVideoFeedPage).toHaveBeenCalledTimes(1)
    expect(loadVideoFeedPage).toHaveBeenCalledWith({ reason: 'sentinel', forceRecovery: false })
    view.unmount()
  })

  test('sentinel and watchdog share one claimed server frontier when the watchdog wins', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    let sentinelProps = null
    const CapturingSentinel = (props) => {
      sentinelProps = props
      return React.createElement('div', { 'data-testid': 'captured-video-sentinel-watchdog' })
    }
    const loadVideoFeedPage = vi.fn(async () => ({ ok: true, count: 1, hasMore: true }))
    const view = render(React.createElement(VideoFeedPane, createVideoFeedPaneProps({
      LoadMoreSentinel: CapturingSentinel,
      loadVideoFeedPage,
    })))

    await act(async () => {
      vi.advanceTimersByTime(560)
      await Promise.resolve()
      await Promise.resolve()
      sentinelProps.onVisible()
      await Promise.resolve()
    })

    expect(loadVideoFeedPage).toHaveBeenCalledTimes(1)
    expect(loadVideoFeedPage).toHaveBeenCalledWith({ reason: 'tail_watchdog', forceRecovery: true })
    view.unmount()
  })

  test('a real server request owns the spinner and the next page waits for exit when the footer moved below the viewport', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    let resolveFirstPage
    const firstPage = new Promise((resolve) => { resolveFirstPage = resolve })
    const loadPage = vi.fn()
      .mockImplementationOnce(() => firstPage)
      .mockResolvedValueOnce({ ok: true, count: 1, hasMore: false })
    const view = render(React.createElement(VideoFeedServerHarness, { loadPage }))
    const sentinel = view.container.querySelector('.loadMoreSentinel')
    let footerTop = 100
    sentinel.getBoundingClientRect = () => ({ top: footerTop, right: 10, bottom: footerTop, left: 0 })

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    await act(async () => { await Promise.resolve() })
    expect(loadPage).toHaveBeenCalledTimes(1)
    expect(view.container.querySelector('.loadMoreShimmer')).toBeTruthy()
    expect(view.container.querySelector('.loadMoreFooter')?.getAttribute('data-video-load-state')).toBe('loading')
    expect(view.container.querySelector('.loadMoreFooter')?.classList.contains('isLoading')).toBe(true)

    footerTop = 2000
    await act(async () => {
      resolveFirstPage({ ok: true, count: 1, hasMore: true })
      await firstPage
      await Promise.resolve()
      await Promise.resolve()
    })
    act(() => {
      flushRaf()
      flushRaf()
      flushRaf()
    })

    expect(view.queryAllByTestId(/^video-card:/)).toHaveLength(2)
    expect(view.container.querySelector('.loadMoreShimmer')).toBeNull()
    expect(view.container.querySelector('.loadMoreFooter')?.getAttribute('data-video-load-state')).toBe('idle')
    expect(loadPage).toHaveBeenCalledTimes(1)

    footerTop = 100
    act(() => {
      observerCallback([{ isIntersecting: false }])
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(loadPage).toHaveBeenCalledTimes(2)
    view.unmount()
  })

  test('layout-confirmed visible footer fills the viewport one server page at a time and stops at hasMore=false', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime(new Date('2035-01-01T00:00:00.000Z'))
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ ok: true, count: 1, hasMore: true })
      .mockResolvedValueOnce({ ok: true, count: 1, hasMore: false })
    const view = render(React.createElement(VideoFeedServerHarness, { loadPage }))
    const sentinel = view.container.querySelector('.loadMoreSentinel')
    sentinel.getBoundingClientRect = () => ({ top: 100, right: 10, bottom: 100, left: 0 })

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    for (let index = 0; index < 8; index += 1) {
      await act(async () => {
        flushRaf()
        await Promise.resolve()
        await Promise.resolve()
      })
    }

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(view.queryAllByTestId(/^video-card:/)).toHaveLength(3)
    expect(view.container.querySelector('.loadMoreShimmer')).toBeNull()
    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(loadPage).toHaveBeenCalledTimes(2)
    view.unmount()
  })

  test('does not replay a second 20-post page before the expanded windowing geometry commits', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime(new Date('2040-01-01T00:00:00.000Z'))
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ ok: true, count: 1, hasMore: true })
      .mockResolvedValueOnce({ ok: true, count: 1, hasMore: false })
    const view = render(React.createElement(VideoFeedServerHarness, {
      loadPage,
      windowingReady: false,
    }))
    const sentinel = view.container.querySelector('.loadMoreSentinel')
    let footerTop = 100
    sentinel.getBoundingClientRect = () => ({ top: footerTop, right: 10, bottom: footerTop, left: 0 })

    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    for (let index = 0; index < 6; index += 1) {
      await act(async () => {
        flushRaf()
        await Promise.resolve()
        await Promise.resolve()
      })
    }
    expect(loadPage).toHaveBeenCalledTimes(1)

    footerTop = 2000
    view.rerender(React.createElement(VideoFeedServerHarness, {
      loadPage,
      windowingReady: true,
    }))
    for (let index = 0; index < 4; index += 1) {
      await act(async () => {
        flushRaf()
        await Promise.resolve()
      })
    }
    expect(loadPage).toHaveBeenCalledTimes(1)

    footerTop = 100
    act(() => {
      observerCallback([{ isIntersecting: true }])
      flushRaf()
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(loadPage).toHaveBeenCalledTimes(2)
    view.unmount()
  })

  test('terminal server frontier creates no request and no spinner', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const loadVideoFeedPage = vi.fn()
    const DeadSentinel = () => React.createElement('div', { 'data-testid': 'terminal-video-sentinel' })
    const view = render(React.createElement(VideoFeedPane, createVideoFeedPaneProps({
      videoServerHasMore: false,
      loadVideoFeedPage,
      LoadMoreSentinel: DeadSentinel,
    })))

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    expect(loadVideoFeedPage).not.toHaveBeenCalled()
    expect(view.container.querySelector('.loadMoreShimmer')).toBeNull()
    expect(view.queryByTestId('terminal-video-sentinel')).toBeNull()
    view.unmount()
  })

  test('retryable watchdog failure waits retryAfterMs and never becomes a timer storm', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const loadVideoFeedPage = vi.fn()
      .mockResolvedValueOnce({ ok: false, skipped: true, retryable: true, retryAfterMs: 900 })
      .mockResolvedValueOnce({ ok: true, count: 1, hasMore: true })
    const DeadSentinel = () => React.createElement('div', { 'data-testid': 'retry-video-sentinel' })
    const view = render(React.createElement(VideoFeedPane, createVideoFeedPaneProps({
      loadVideoFeedPage,
      LoadMoreSentinel: DeadSentinel,
    })))

    await act(async () => {
      vi.advanceTimersByTime(560)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(899)
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(2)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).toHaveBeenCalledTimes(2)

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })
    expect(loadVideoFeedPage).toHaveBeenCalledTimes(2)
    view.unmount()
  })
})

describe('DM thread load-more terminal/pending presentation', () => {
  afterEach(() => vi.useRealTimers())

  const SentinelStub = (props) => React.createElement('div', { 'data-testid': 'dm-sentinel', 'data-pending': String(!!props.pending) })
  const baseProps = {
    dmThreadHasMore: true,
    dmThreadLoading: false,
    dmThreadCursor: 'cursor-1',
    dmWithUserId: 'peer-1',
    loadDmThread: vi.fn(),
    t: () => 'Loading',
    LoadMoreSentinel: SentinelStub,
  }

  test('shows the footer spinner only during a real page request', () => {
    const view = render(React.createElement(DmThreadLoadMore, baseProps))
    expect(view.container.querySelector('.loadMoreShimmer')).toBeNull()
    expect(view.container.querySelector('.dmLoadMoreFooter')?.style.visibility).toBe('hidden')

    view.rerender(React.createElement(DmThreadLoadMore, { ...baseProps, dmThreadLoading: true }))
    expect(view.container.querySelector('.loadMoreShimmer')).toBeTruthy()
    expect(view.container.querySelector('.dmLoadMoreFooter')?.style.visibility).toBe('visible')
  })

  test('renders no footer or sentinel after history is terminal', () => {
    const view = render(React.createElement(DmThreadLoadMore, { ...baseProps, dmThreadHasMore: false, dmThreadCursor: null }))
    expect(view.container.querySelector('.dmLoadMoreFooter')).toBeNull()
    expect(view.queryByTestId('dm-sentinel')).toBeNull()
  })

  test('rearms the same history cursor after a retryable page failure without adding a second load owner', async () => {
    vi.useFakeTimers()
    const loadDmThread = vi.fn(async () => ({ ok: false, retryable: true, error: 'network' }))
    const RetrySentinel = (props) => React.createElement('button', {
      type: 'button',
      'data-testid': 'dm-retry-sentinel',
      'data-retry-key': String(props.retryKey || ''),
      onClick: () => props.onVisible?.(),
    })
    const view = render(React.createElement(DmThreadLoadMore, {
      ...baseProps,
      loadDmThread,
      LoadMoreSentinel: RetrySentinel,
    }))

    expect(view.getByTestId('dm-retry-sentinel').getAttribute('data-retry-key')).toBe('0')
    await act(async () => {
      fireEvent.click(view.getByTestId('dm-retry-sentinel'))
      await Promise.resolve()
    })
    expect(loadDmThread).toHaveBeenCalledWith('peer-1', 'cursor-1')

    await act(async () => {
      vi.advanceTimersByTime(1810)
      await Promise.resolve()
    })
    expect(view.getByTestId('dm-retry-sentinel').getAttribute('data-retry-key')).toBe('1')
  })
})
