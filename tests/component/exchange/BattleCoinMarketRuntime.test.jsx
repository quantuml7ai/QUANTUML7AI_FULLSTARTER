import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  BATTLECOIN_MARKET_ROW_STRIDE,
  BATTLECOIN_MARKET_VIRTUAL_WINDOW_ROWS,
  BattleCoinLivePriceText,
  getBattleCoinMarketVirtualRange,
  getBattleCoinMarketVirtualStart,
  isIOSBrowserRuntime,
  shouldReprimeGuestMarketScroller,
} from '../../../app/exchange/BattleCoin.jsx'
import { useBattleChat } from '../../../app/exchange/battle-chat/useBattleChat.js'

vi.mock('next/image', () => ({ default: () => null }))
vi.mock('../../../components/i18n', () => ({ useI18n: () => ({ t: (value) => value }) }))
vi.mock('../../../components/QuantumWalletLaunchIcon', () => ({ QuantumWalletLaunchButton: () => null }))
vi.mock('../../../app/exchange/battle-chat/BattleChat', () => ({ default: () => null }))
vi.mock('../../../lib/paymentMethodClient', () => ({ openPaymentMethodPopover: vi.fn() }))

class TestSocket {
  static instances = []
  static OPEN = 1

  constructor(url) {
    this.url = url
    this.readyState = 0
    TestSocket.instances.push(this)
  }

  open() {
    this.readyState = TestSocket.OPEN
    this.onopen?.()
  }

  close() {
    this.readyState = 3
  }

  tick(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) })
  }
}

class TestEventSource {
  static instances = []

  constructor(url) {
    this.url = url
    this.listeners = new Map()
    this.closed = false
    TestEventSource.instances.push(this)
  }

  addEventListener(type, handler) {
    this.listeners.set(type, handler)
  }

  removeEventListener(type, handler) {
    if (this.listeners.get(type) === handler) this.listeners.delete(type)
  }

  emit(type, payload = {}) {
    this.listeners.get(type)?.({ data: JSON.stringify(payload) })
  }

  fail() {
    this.onerror?.()
  }

  close() {
    this.closed = true
  }
}

function BattleChatRuntimeHarness() {
  useBattleChat('en')
  return null
}

test('re-primes only a populated guest iOS market scroller after the first paint', () => {
  const iphone = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 CriOS/152 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    maxTouchPoints: 5,
  }
  const android = { userAgent: 'Mozilla/5.0 (Linux; Android 16)', platform: 'Linux armv8l', maxTouchPoints: 5 }

  expect(isIOSBrowserRuntime(iphone)).toBe(true)
  expect(isIOSBrowserRuntime(android)).toBe(false)
  expect(shouldReprimeGuestMarketScroller({ auth: false, loading: false, symbolCount: 490, navigatorLike: iphone })).toBe(true)
  expect(shouldReprimeGuestMarketScroller({ auth: true, loading: false, symbolCount: 490, navigatorLike: iphone })).toBe(false)
  expect(shouldReprimeGuestMarketScroller({ auth: false, loading: true, symbolCount: 490, navigatorLike: iphone })).toBe(false)
  expect(shouldReprimeGuestMarketScroller({ auth: false, loading: false, symbolCount: 490, navigatorLike: android })).toBe(false)
})

test('caps a 490-symbol market at 64 live rows while preserving the full native scroll height', () => {
  const top = getBattleCoinMarketVirtualRange({ symbolCount: 490, startIndex: 0 })
  const bottom = getBattleCoinMarketVirtualRange({ symbolCount: 490, startIndex: 9999 })

  expect(BATTLECOIN_MARKET_VIRTUAL_WINDOW_ROWS).toBe(64)
  expect(BATTLECOIN_MARKET_ROW_STRIDE).toBe(51)
  expect(top).toEqual({
    start: 0,
    end: 64,
    renderedRows: 64,
    offsetTop: 0,
    totalHeight: 490 * 51,
  })
  expect(bottom.start).toBe(490 - 64)
  expect(bottom.end).toBe(490)
  expect(bottom.renderedRows).toBe(64)
  expect(bottom.offsetTop).toBe((490 - 64) * 51)
})

test('shifts the buffered market window in coarse chunks instead of on every scroll tick', () => {
  const startForRow = (row, currentStart) => getBattleCoinMarketVirtualStart({
    scrollTop: row * BATTLECOIN_MARKET_ROW_STRIDE,
    viewportHeight: 220,
    symbolCount: 490,
    currentStart,
  })

  expect(startForRow(46, 0)).toBe(0)
  expect(startForRow(47, 0)).toBe(24)
  expect(startForRow(70, 24)).toBe(24)
  expect(startForRow(71, 24)).toBe(48)

  // Direction reversal stays inside the already-painted back buffer for many rows.
  expect(startForRow(60, 48)).toBe(48)
  expect(startForRow(59, 48)).toBe(24)

  // A large jump catches up in one calculation without mutating scrollTop.
  expect(startForRow(480, 0)).toBe(490 - BATTLECOIN_MARKET_VIRTUAL_WINDOW_ROWS)
})

test('renders every market row when the symbol set is smaller than the virtual window', () => {
  expect(getBattleCoinMarketVirtualRange({ symbolCount: 40, startIndex: 30 })).toEqual({
    start: 0,
    end: 40,
    renderedRows: 40,
    offsetTop: 0,
    totalHeight: 40 * BATTLECOIN_MARKET_ROW_STRIDE,
  })
  expect(getBattleCoinMarketVirtualStart({
    scrollTop: 1200,
    viewportHeight: 220,
    symbolCount: 40,
    currentStart: 30,
  })).toBe(0)
})

function readPrice() {
  return Number(screen.getByTestId('price').textContent.replace(/\s/gu, '').replace(',', '.'))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-07T00:00:00Z'))
  TestSocket.instances = []
  TestEventSource.instances = []
  vi.stubGlobal('WebSocket', TestSocket)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('keeps a newer stream revision when an older REST request completes late', async () => {
  let completeRest
  vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { completeRest = resolve })))

  render(
    <div data-testid="price">
      <BattleCoinLivePriceText symbol="BTCUSDT" initialPrice={50} streamEnabled />
    </div>,
  )

  await act(async () => {
    TestSocket.instances.at(-1).tick({ s: 'BTCUSDT', c: '101', E: Date.now() })
  })
  expect(readPrice()).toBe(101)

  await act(async () => {
    completeRest({ json: async () => ({ ok: true, symbols: [{ symbol: 'BTCUSDT', price: 99 }] }) })
  })
  expect(readPrice()).toBe(101)
})

test('rejects older, wrong-symbol and invalid provider values', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    json: async () => ({ ok: true, symbols: [{ symbol: 'BTCUSDT', price: 50 }] }),
  })))

  render(
    <div data-testid="price">
      <BattleCoinLivePriceText symbol="BTCUSDT" initialPrice={50} streamEnabled />
    </div>,
  )
  await act(async () => {})

  await act(async () => {
    const socket = TestSocket.instances.at(-1)
    socket.tick({ s: 'BTCUSDT', c: '101', E: Date.now() })
    socket.tick({ s: 'BTCUSDT', c: '99', E: Date.now() - 1000 })
    socket.tick({ s: 'ETHUSDT', c: '3', E: Date.now() + 1000 })
    socket.tick({ s: 'BTCUSDT', c: '-10', E: Date.now() + 1000 })
  })

  expect(readPrice()).toBe(101)
})

test('treats an open sparse stream as healthy and only reconciles after 60 seconds', async () => {
  const fetchMock = vi.fn(async () => ({
    json: async () => ({ ok: true, symbols: [{ symbol: '0GUSDT', price: 0.2 }] }),
  }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <div data-testid="price">
      <BattleCoinLivePriceText symbol="0GUSDT" initialPrice={0.2} streamEnabled />
    </div>,
  )
  await act(async () => {})
  TestSocket.instances.at(-1).open()

  await act(async () => { await vi.advanceTimersByTimeAsync(59_000) })
  expect(fetchMock).toHaveBeenCalledTimes(1)

  await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

test('keeps the exact legacy 1 Hz REST path when the opt-in stream flag is off', async () => {
  const fetchMock = vi.fn(async () => ({
    json: async () => ({ ok: true, symbols: [{ symbol: 'BTCUSDT', price: 50 }] }),
  }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <div data-testid="price">
      <BattleCoinLivePriceText symbol="BTCUSDT" initialPrice={50} streamEnabled={false} />
    </div>,
  )
  await act(async () => {})
  await act(async () => { await vi.advanceTimersByTimeAsync(2_000) })

  expect(TestSocket.instances).toHaveLength(0)
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

test('falls back to REST immediately and reconnects with the bounded first backoff', async () => {
  const fetchMock = vi.fn(async () => ({
    json: async () => ({ ok: true, symbols: [{ symbol: 'BTCUSDT', price: 50 }] }),
  }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <div data-testid="price">
      <BattleCoinLivePriceText symbol="BTCUSDT" initialPrice={50} streamEnabled />
    </div>,
  )
  await act(async () => {})
  const firstSocket = TestSocket.instances.at(-1)
  firstSocket.open()

  await act(async () => { firstSocket.onerror?.() })
  expect(fetchMock).toHaveBeenCalledTimes(2)

  await act(async () => { await vi.advanceTimersByTimeAsync(499) })
  expect(TestSocket.instances).toHaveLength(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(TestSocket.instances).toHaveLength(2)
})

test('backs Battle Chat reconnects off after repeated pre-ready failures and resets on ready', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, messages: [], syncToken: '' }),
  })))
  vi.stubGlobal('EventSource', TestEventSource)

  render(<BattleChatRuntimeHarness />)
  await act(async () => {})
  expect(TestEventSource.instances).toHaveLength(1)

  await act(async () => { TestEventSource.instances[0].fail() })
  await act(async () => { await vi.advanceTimersByTimeAsync(1799) })
  expect(TestEventSource.instances).toHaveLength(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(TestEventSource.instances).toHaveLength(2)

  await act(async () => { TestEventSource.instances[1].fail() })
  await act(async () => { await vi.advanceTimersByTimeAsync(3599) })
  expect(TestEventSource.instances).toHaveLength(2)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(TestEventSource.instances).toHaveLength(3)

  await act(async () => {
    TestEventSource.instances[2].emit('battlecoin-chat-ready', { ok: true })
    TestEventSource.instances[2].fail()
  })
  await act(async () => { await vi.advanceTimersByTimeAsync(1799) })
  expect(TestEventSource.instances).toHaveLength(3)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(TestEventSource.instances).toHaveLength(4)
})
