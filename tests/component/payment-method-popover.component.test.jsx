import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../components/i18n', () => ({
  useI18n: () => ({ lang: 'en' }),
}))

vi.mock('../../lib/walletSessionClient', () => ({
  getStoredWalletSession: () => ({
    token: 'ql7ws_component_test',
    walletAddress: '0x1111111111111111111111111111111111111111',
    accountId: '0x1111111111111111111111111111111111111111',
  }),
}))

import PaymentMethodPopoverHost from '../../components/PaymentMethodPopoverHost.jsx'
import {
  PAYMENT_METHOD_OPEN_EVENT,
  PAYMENT_METHOD_RESULT_EVENT,
} from '../../lib/paymentMethodClient.js'

const accountId = '0x1111111111111111111111111111111111111111'

function jsonResponse(payload, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  })
}

async function openPopover(detail = {}) {
  await act(async () => {
    window.dispatchEvent(new CustomEvent(PAYMENT_METHOD_OPEN_EVENT, {
      detail: {
        requestId: detail.requestId || 'component-request-1',
        accountId,
        purpose: detail.purpose || 'vip',
        adsPackage: detail.adsPackage || null,
      },
    }))
  })
}

describe('PaymentMethodPopoverHost', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
    vi.unstubAllGlobals()
  })

  test('renders the body portal and returns NOWPayments without calling purchase', async () => {
    fetch.mockImplementationOnce(() => jsonResponse({
      ok: true,
      purpose: 'vip',
      amountUsd: 19.99,
      amountQcoin: 19.99,
      currency: 'USD',
      balanceQcoin: 42,
      sufficient: true,
    }))
    const results = []
    window.addEventListener(PAYMENT_METHOD_RESULT_EVENT, (event) => results.push(event.detail), { once: true })

    render(React.createElement(PaymentMethodPopoverHost))
    await openPopover()

    expect(await screen.findByRole('dialog', { name: 'Payment' })).toBeTruthy()
    expect(document.body.querySelector('.pmp-overlay')).toBeTruthy()
    expect(screen.getAllByText('19.99', { exact: false }).length).toBeGreaterThanOrEqual(2)

    fireEvent.click(screen.getByRole('button', { name: 'Pay with NOWPayments' }))
    await waitFor(() => expect(results).toHaveLength(1))
    expect(results[0]).toMatchObject({ requestId: 'component-request-1', result: { method: 'nowpayments' } })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('keeps NOWPayments selectable when the independent QCoin quote is unavailable', async () => {
    fetch.mockImplementationOnce(() => jsonResponse({ ok: false, error: 'PURCHASE_FAILED' }, 503))
    const results = []
    window.addEventListener(PAYMENT_METHOD_RESULT_EVENT, (event) => results.push(event.detail), { once: true })

    render(React.createElement(PaymentMethodPopoverHost))
    await openPopover({ requestId: 'component-request-now-fallback' })

    expect(await screen.findByText('The secure check could not be completed. Please try again.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pay with NOWPayments' }))
    await waitFor(() => expect(results).toHaveLength(1))
    expect(results[0]).toMatchObject({
      requestId: 'component-request-now-fallback',
      result: { method: 'nowpayments' },
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('keeps a successful QCoin activation inside the same popover state', async () => {
    fetch
      .mockImplementationOnce(() => jsonResponse({
        ok: true,
        purpose: 'vip',
        amountUsd: 19.99,
        amountQcoin: 19.99,
        currency: 'USD',
        balanceQcoin: 50,
        sufficient: true,
      }))
      .mockImplementationOnce(() => jsonResponse({
        ok: true,
        activated: true,
        purpose: 'vip',
        purchaseId: 'qcp_component',
        vipUntil: '2026-10-04T00:00:00.000Z',
        amountUsd: 19.99,
        amountQcoin: 19.99,
        balanceQcoin: 30.01,
      }))

    render(React.createElement(PaymentMethodPopoverHost))
    await openPopover({ requestId: 'component-request-2' })
    fireEvent.click(await screen.findByRole('button', { name: 'Pay with QCoin from Quantum Wallet' }))

    expect(await screen.findByText('VIP activated')).toBeTruthy()
    expect(screen.getByText(/30\.01 QCoin/)).toBeTruthy()
    expect(document.body.querySelector('.pmp-overlay')).toBeTruthy()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
      action: 'purchase',
      accountId,
      purpose: 'vip',
    })
  })

  test('shows insufficient balance and opens the existing Quantum Wallet without touching top-up API', async () => {
    fetch
      .mockImplementationOnce(() => jsonResponse({
        ok: true,
        purpose: 'ads',
        adsPackage: 'STARTER',
        amountUsd: 300,
        amountQcoin: 300,
        currency: 'USD',
        balanceQcoin: 12,
        sufficient: false,
      }))
      .mockImplementationOnce(() => jsonResponse({
        ok: false,
        error: 'INSUFFICIENT_QCOIN',
        balanceQcoin: 12,
        requiredQcoin: 300,
      }, 409))
    const walletOpen = vi.fn()
    window.addEventListener('quantum-wallet:open', walletOpen, { once: true })

    render(React.createElement(PaymentMethodPopoverHost))
    await openPopover({ requestId: 'component-request-3', purpose: 'ads', adsPackage: 'STARTER' })
    fireEvent.click(await screen.findByRole('button', { name: 'Pay with QCoin from Quantum Wallet' }))

    expect(await screen.findByText('Insufficient QCoin balance')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Top up balance' }))
    await waitFor(() => expect(walletOpen).toHaveBeenCalledTimes(1))
    expect(fetch.mock.calls.every(([url]) => url === '/api/pay/qcoin-purchase')).toBe(true)
  })
})
