import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import GlobalVisualActivityRuntime from '../../../components/visual-runtime/GlobalVisualActivityRuntime'
import ViewportAnimatedImage from '../../../components/visual-runtime/ViewportAnimatedImage'
import { getAnimatedAssetSnapshot } from '../../../lib/visual-runtime/animatedAssetRegistry'
import { getVisualActivityFor, teardownVisualActivityRegistry } from '../../../lib/visual-runtime/visualActivityRegistry'

let observers = []
class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.targets = new Set()
    observers.push(this)
  }
  observe(node) { this.targets.add(node) }
  unobserve(node) { this.targets.delete(node) }
  disconnect() { this.targets.clear() }
}

const h = React.createElement

describe('ViewportAnimatedImage V3', () => {
  beforeEach(() => {
    observers = []
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })

  afterEach(() => {
    teardownVisualActivityRegistry()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('ordinary visible-first asset keeps animation, then swaps only on offscreen/near transitions', async () => {
    const view = render(h(ViewportAnimatedImage, {
      animatedSrc: '/game/game.gif',
      staticSrc: '/__ql7_visual_posters/game/game.gif.webp',
      width: 110,
      height: 110,
      alt: 'Game',
    }))
    const img = view.container.querySelector('img')
    const io = observers.find((row) => row.options?.rootMargin === '100px 0px 100px 0px')
    expect(io).toBeTruthy()
    expect(new URL(img.src).pathname).toBe('/game/game.gif')

    await act(async () => {
      io.callback([{ target: img, isIntersecting: false }])
      vi.advanceTimersByTime(100)
      await Promise.resolve()
    })
    expect(new URL(img.src).pathname).toBe('/__ql7_visual_posters/game/game.gif.webp')
    expect(img.dataset.ql7AnimatedState).toBe('poster')

    await act(async () => {
      io.callback([{ target: img, isIntersecting: true }])
      await Promise.resolve()
    })
    expect(new URL(img.src).pathname).toBe('/game/game.gif')
    expect(img.dataset.ql7AnimatedState).toBe('animated')
    view.unmount()
  })

  test('keeps animated-asset ownership alive through React StrictMode effect replay', async () => {
    const view = render(h(React.StrictMode, null,
      h(ViewportAnimatedImage, {
        animatedSrc: '/game/game.gif',
        staticSrc: '/__ql7_visual_posters/game/game.gif.webp',
        width: 110,
        height: 110,
        alt: 'Game',
      }),
    ))
    const img = view.container.querySelector('img')
    expect(img.dataset.ql7VisualMargin).toBe('near100')
    expect(getAnimatedAssetSnapshot().total).toBe(1)

    const io = observers.find((row) => row.options?.rootMargin === '100px 0px 100px 0px' && row.targets.has(img))
    expect(io).toBeTruthy()

    await act(async () => {
      io.callback([{ target: img, isIntersecting: false }])
      vi.advanceTimersByTime(100)
      await Promise.resolve()
    })

    expect(new URL(img.src).pathname).toBe('/__ql7_visual_posters/game/game.gif.webp')
    expect(getAnimatedAssetSnapshot().staticPoster).toBe(1)

    view.unmount()
    expect(getAnimatedAssetSnapshot().total).toBe(0)
  })

  test('root controller StrictMode replay preserves mounted animated-image subscribers', async () => {
    const view = render(h(React.StrictMode, null,
      h(GlobalVisualActivityRuntime),
      h(ViewportAnimatedImage, {
        animatedSrc: '/game/game.gif',
        staticSrc: '/__ql7_visual_posters/game/game.gif.webp',
        width: 110,
        height: 110,
        alt: 'Game',
      }),
    ))
    const img = view.container.querySelector('img')
    expect(getAnimatedAssetSnapshot().total).toBe(1)

    const io = observers.find((row) => row.options?.rootMargin === '100px 0px 100px 0px' && row.targets.has(img))
    expect(io).toBeTruthy()

    await act(async () => {
      io.callback([{ target: img, isIntersecting: false }])
      vi.advanceTimersByTime(100)
      await Promise.resolve()
    })

    expect(img.dataset.ql7VisualState).toBe('paused')
    expect(new URL(img.src).pathname).toBe('/__ql7_visual_posters/game/game.gif.webp')
    expect(getAnimatedAssetSnapshot().staticPoster).toBe(1)

    await act(async () => {
      io.callback([{ target: img, isIntersecting: true }])
      await Promise.resolve()
    })

    expect(img.dataset.ql7VisualState).toBe('running')
    expect(new URL(img.src).pathname).toBe('/game/game.gif')
    expect(getAnimatedAssetSnapshot().animatedActive).toBe(1)

    view.unmount()
    await act(async () => {
      vi.advanceTimersByTime(1)
      await Promise.resolve()
    })
    expect(getAnimatedAssetSnapshot().total).toBe(0)
  })

  test('viewport-pinned mounted header asset is structurally active without sticky IO convergence', async () => {
    const view = render(h(ViewportAnimatedImage, {
      animatedSrc: '/friends/invitation.gif',
      staticSrc: '/__ql7_visual_posters/friends/invitation.gif.webp',
      viewportPinned: true,
      width: 40,
      height: 40,
      alt: '',
    }))
    const img = view.container.querySelector('img')

    expect(img.dataset.ql7VisualPinned).toBe('1')
    expect(img.dataset.ql7VisualPinnedActive).toBe('1')
    expect(img.dataset.ql7VisualState).toBe('running')
    expect(new URL(img.src).pathname).toBe('/friends/invitation.gif')
    expect(getVisualActivityFor(img)?.viewportPinned).toBe(true)
    expect(getVisualActivityFor(img)?.enabled).toBe(true)
    expect(observers.some((row) => row.targets.has(img))).toBe(false)
    expect(getAnimatedAssetSnapshot().total).toBe(1)
    expect(getAnimatedAssetSnapshot().animatedActive).toBe(1)

    view.unmount()
    expect(getAnimatedAssetSnapshot().total).toBe(0)
  })

  test('dense Profile VIP avatars and VIP stickers share one 50px observer per marked inner root and converge both ways', async () => {
    const view = render(h('div', {
      'data-ql7-visual-scroll-root': '1',
      'data-ql7-visual-surface': 'profile-vip-avatars',
    },
    h(ViewportAnimatedImage, {
      animatedSrc: '/vip/avatars/a1.gif',
      staticSrc: '/__ql7_visual_posters/vip/avatars/a1.gif.webp',
      initialPoster: true,
      marginProfile: 'near50',
      width: 40,
      height: 40,
      alt: '',
    }),
    h(ViewportAnimatedImage, {
      animatedSrc: '/vip/emoji/e1.gif',
      staticSrc: '/__ql7_visual_posters/vip/emoji/e1.gif.webp',
      initialPoster: true,
      marginProfile: 'near50',
      width: 64,
      height: 64,
      alt: '',
    })))

    const root = view.container.querySelector('[data-ql7-visual-scroll-root="1"]')
    const imgs = [...view.container.querySelectorAll('img')]
    const denseObservers = observers.filter((row) => row.options?.rootMargin === '50px 0px 50px 0px')

    expect(denseObservers).toHaveLength(1)
    expect(denseObservers[0].options.root).toBe(root)
    expect(denseObservers[0].targets.size).toBe(2)
    expect(imgs.every((img) => img.dataset.ql7AnimatedState === 'poster')).toBe(true)

    await act(async () => {
      denseObservers[0].callback(imgs.map((img) => ({ target: img, isIntersecting: true })))
      await Promise.resolve()
    })

    expect(new URL(imgs[0].src).pathname).toBe('/vip/avatars/a1.gif')
    expect(new URL(imgs[1].src).pathname).toBe('/vip/emoji/e1.gif')
    expect(imgs.every((img) => img.dataset.ql7AnimatedState === 'animated')).toBe(true)

    await act(async () => {
      denseObservers[0].callback(imgs.map((img) => ({ target: img, isIntersecting: false })))
      vi.advanceTimersByTime(100)
      await Promise.resolve()
    })

    expect(new URL(imgs[0].src).pathname).toBe('/__ql7_visual_posters/vip/avatars/a1.gif.webp')
    expect(new URL(imgs[1].src).pathname).toBe('/__ql7_visual_posters/vip/emoji/e1.gif.webp')
    expect(imgs.every((img) => img.dataset.ql7AnimatedState === 'poster')).toBe(true)
    view.unmount()
  })

  test('different dense scroll roots do not create an observer per GIF and remain isolated by root', () => {
    const view = render(h(React.Fragment, null,
      h('div', { 'data-ql7-visual-scroll-root': '1', 'data-ql7-visual-surface': 'profile-vip-avatars' },
        h(ViewportAnimatedImage, {
          animatedSrc: '/vip/avatars/a2.gif',
          initialPoster: true,
          marginProfile: 'near50',
          width: 40,
          height: 40,
          alt: '',
        }),
        h(ViewportAnimatedImage, {
          animatedSrc: '/vip/avatars/a3.gif',
          initialPoster: true,
          marginProfile: 'near50',
          width: 40,
          height: 40,
          alt: '',
        }),
      ),
      h('div', { 'data-ql7-visual-scroll-root': '1', 'data-ql7-visual-surface': 'vip-stickers' },
        h(ViewportAnimatedImage, {
          animatedSrc: '/vip/emoji/e2.gif',
          initialPoster: true,
          marginProfile: 'near50',
          width: 64,
          height: 64,
          alt: '',
        }),
        h(ViewportAnimatedImage, {
          animatedSrc: '/vip/emoji/e3.gif',
          initialPoster: true,
          marginProfile: 'near50',
          width: 64,
          height: 64,
          alt: '',
        }),
      ),
    ))

    const roots = [...view.container.querySelectorAll('[data-ql7-visual-scroll-root="1"]')]
    const denseObservers = observers.filter((row) => row.options?.rootMargin === '50px 0px 50px 0px')

    expect(roots).toHaveLength(2)
    expect(denseObservers).toHaveLength(2)
    expect(denseObservers.map((row) => row.targets.size).sort()).toEqual([2, 2])
    expect(new Set(denseObservers.map((row) => row.options.root))).toEqual(new Set(roots))

    view.unmount()
  })

  test('missing poster fails visible-safe to the animated source without blanking the image', async () => {
    const view = render(h(ViewportAnimatedImage, {
      animatedSrc: '/vip/avatars/a1.gif',
      staticSrc: '/missing-poster.webp',
      initialPoster: true,
      width: 40,
      height: 40,
      alt: '',
    }))
    const img = view.container.querySelector('img')
    expect(new URL(img.src).pathname).toBe('/missing-poster.webp')
    fireEvent.error(img)
    expect(new URL(img.src).pathname).toBe('/vip/avatars/a1.gif')
    view.unmount()
  })
})
