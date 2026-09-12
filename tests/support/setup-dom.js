import React from 'react'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const originalConsoleError = console.error.bind(console)
console.error = (...args) => {
  const serializedArgs = args.map((value) => String(value || '')).join(' ')
  if (
    serializedArgs.includes('non-boolean attribute `jsx`')
    || (serializedArgs.includes('non-boolean attribute') && serializedArgs.includes('jsx'))
  ) {
    return
  }
  originalConsoleError(...args)
}

vi.mock('next/image', () => ({
  default: (props) => React.createElement('img', {
    ...props,
    src: typeof props?.src === 'string' ? props.src : (props?.src?.src || ''),
    alt: props?.alt || '',
  }),
}))

vi.mock('../../app/forum/shared/components/HydrateText.jsx', () => ({
  default: ({ value }) => React.createElement(
    'span',
    { 'data-testid': 'mock-hydrate-text' },
    String(value ?? ''),
  ),
}))

vi.mock('../../app/forum/features/profile/components/AvatarEmoji.jsx', () => ({
  default: ({ className = '' }) => React.createElement(
    'span',
    { className, 'data-testid': 'mock-avatar' },
    'avatar',
  ),
}))

vi.mock('../../app/forum/features/profile/components/VipFlipBadge.jsx', () => ({
  default: ({ className = '' }) => React.createElement(
    'span',
    { className, 'data-testid': 'mock-vip-badge' },
    'VIP',
  ),
  AvatarBadgeOverlay: ({ vipActive = false, showInfo = false, className = '' }) => React.createElement(
    'span',
    {
      className,
      'data-testid': 'mock-avatar-badge-overlay',
      'data-vip-active': vipActive ? '1' : '0',
      'data-info-visible': showInfo ? '1' : '0',
      style: { pointerEvents: 'none' },
    },
    vipActive ? React.createElement('span', { 'data-testid': 'mock-vip-badge' }, 'VIP') : null,
    showInfo ? React.createElement('span', { 'data-testid': 'mock-avatar-info-hint' }, 'i') : null,
  ),
}))

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!HTMLElement.prototype.scrollBy) {
  HTMLElement.prototype.scrollBy = vi.fn()
}

if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = vi.fn()
}

afterEach(() => {
  cleanup()
  try { window.localStorage.clear() } catch {}
  try { window.sessionStorage.clear() } catch {}
  vi.restoreAllMocks()
})
