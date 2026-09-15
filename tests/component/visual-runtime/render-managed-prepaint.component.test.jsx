import React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import useRenderManagedScope from '../../../components/visual-runtime/useRenderManagedScope'
import {
  isIOSExchangeMotionContinuityRuntime,
  registerVisualScope,
  teardownVisualActivityRegistry,
} from '../../../lib/visual-runtime/visualActivityRegistry'

class FakeIntersectionObserver {
  static instances = []

  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.targets = new Set()
    FakeIntersectionObserver.instances.push(this)
  }

  observe(node) { this.targets.add(node) }
  unobserve(node) { this.targets.delete(node) }
  disconnect() { this.targets.clear() }

  emit(node, isIntersecting) {
    this.callback([{ target: node, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }])
  }
}

function ManagedCard() {
  const ref = React.useRef(null)
  useRenderManagedScope(ref, {
    kind: 'card',
    marginProfile: 'near100',
    initialNear: true,
  })

  return (
    <article ref={ref} data-testid="managed-card" data-ql7-visual-scope="card" data-ql7-render-managed="1">
      <span data-testid="animated-child" style={{ animationName: 'pulse' }}>Premium</span>
    </article>
  )
}

describe('QL7 render-managed viewport motion ownership', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.useFakeTimers()
  })

  afterEach(() => {
    teardownVisualActivityRegistry()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    window.history.replaceState({}, '', '/')
  })

  test('uses one near-viewport motion observer and never publishes a static render mode', async () => {
    const view = render(<ManagedCard />)
    const node = view.getByTestId('managed-card')
    const getAnimations = vi.fn(() => [])
    node.getAnimations = getAnimations

    expect(node.hasAttribute('data-ql7-render-mode')).toBe(false)
    expect(node.getAttribute('data-ql7-motion-mode')).toBe('paused')
    expect(FakeIntersectionObserver.instances).toHaveLength(1)

    const motionObserver = FakeIntersectionObserver.instances[0]
    expect(motionObserver.options.rootMargin).toBe('160px 96px 160px 96px')

    await act(async () => {
      motionObserver.emit(node, true)
    })
    expect(node.getAttribute('data-ql7-motion-mode')).toBe('hot')
    expect(getAnimations).not.toHaveBeenCalled()

    await act(async () => {
      motionObserver.emit(node, false)
      vi.advanceTimersByTime(91)
    })
    expect(node.getAttribute('data-ql7-motion-mode')).toBe('paused')
    expect(node.hasAttribute('data-ql7-render-mode')).toBe(false)
    expect(getAnimations).not.toHaveBeenCalled()

    view.unmount()
  })

  test('keeps managed motion hot across iOS Exchange scroll without restoring render-mode ownership', async () => {
    const iphone = {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 CriOS/152 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    }
    expect(isIOSExchangeMotionContinuityRuntime(iphone, '/exchange')).toBe(true)
    expect(isIOSExchangeMotionContinuityRuntime(iphone, '/forum')).toBe(false)
    expect(isIOSExchangeMotionContinuityRuntime({ userAgent: 'Mozilla/5.0 (Linux; Android 16)' }, '/exchange')).toBe(false)

    vi.stubGlobal('navigator', iphone)
    window.history.replaceState({}, '', '/exchange')

    const view = render(<ManagedCard />)
    const node = view.getByTestId('managed-card')
    const motionObserver = FakeIntersectionObserver.instances[0]

    expect(node.getAttribute('data-ql7-motion-mode')).toBe('hot')
    expect(node.hasAttribute('data-ql7-render-mode')).toBe(false)

    await act(async () => {
      motionObserver.emit(node, false)
      vi.advanceTimersByTime(100)
    })
    expect(node.getAttribute('data-ql7-motion-mode')).toBe('hot')
    expect(node.hasAttribute('data-ql7-render-mode')).toBe(false)

    view.unmount()
  })

  test('keeps generic iOS Exchange scopes running so scroll never triggers subtree animation pause scans', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    window.history.replaceState({}, '', '/exchange')

    const node = document.createElement('section')
    node.dataset.ql7VisualScope = 'card'
    node.getAnimations = vi.fn(() => [])
    document.body.appendChild(node)
    const unregister = registerVisualScope(node, { kind: 'card', publishState: true })
    const observer = FakeIntersectionObserver.instances[0]

    expect(node.getAttribute('data-ql7-visual-state')).toBe('running')
    await act(async () => {
      observer.emit(node, false)
      vi.advanceTimersByTime(100)
    })
    expect(node.getAttribute('data-ql7-visual-state')).toBe('running')
    expect(node.getAnimations).not.toHaveBeenCalled()

    unregister()
    node.remove()
  })
})
