import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const vipBroker = vi.hoisted(() => ({
  useVipFlag: vi.fn((userId) => String(userId || '') === 'vip-user'),
  queueVipProbes: vi.fn(),
}))

vi.mock('../../../../../app/forum/features/profile/hooks/useVipFlag.js', () => ({
  default: vipBroker.useVipFlag,
  queueVipProbes: vipBroker.queueVipProbes,
}))

vi.mock('../../../../../app/forum/features/profile/components/AvatarEmoji.jsx', () => ({
  default: ({ userId }) => <span data-testid={`avatar-${userId}`} />,
}))

vi.mock('../../../../../app/forum/features/profile/components/VipFlipBadge.jsx', () => ({
  AvatarBadgeOverlay: ({ vipActive, showInfo }) => (
    <span
      data-testid="family-vip-overlay"
      data-vip-active={vipActive ? '1' : '0'}
      data-info-visible={showInfo ? '1' : '0'}
    />
  ),
}))

import SubscriptionsPopover from '../../../../../app/forum/features/subscriptions/components/SubscriptionsPopover.jsx'

describe('SubscriptionsPopover VIP broker integration', () => {
  beforeEach(() => {
    vipBroker.useVipFlag.mockClear()
    vipBroker.queueVipProbes.mockClear()
  })

  it('loads Quantum Family and primes the shared VIP broker once for the returned page', async () => {
    const apiClient = {
      subsPeople: vi.fn().mockResolvedValue({
        ok: true,
        users: [
          { userId: 'vip-user', nickname: 'VIP User', icon: '/vip.png' },
          { userId: 'normal-user', nickname: 'Normal User', icon: '/normal.png' },
        ],
        counts: { followers: 2, following: 0 },
        nextCursor: null,
        hasMore: false,
        minChars: false,
      }),
    }

    render(
      <SubscriptionsPopover
        open
        userId="owner-user"
        initialMode="followers"
        onClose={vi.fn()}
        onOpenUserInfo={vi.fn()}
        t={(key) => key}
        apiClient={apiClient}
      />,
    )

    expect(await screen.findByText('VIP User')).toBeInTheDocument()
    expect(screen.getByText('Normal User')).toBeInTheDocument()

    await waitFor(() => {
      expect(vipBroker.queueVipProbes).toHaveBeenCalledTimes(1)
    })
    expect(vipBroker.queueVipProbes).toHaveBeenCalledWith(['vip-user', 'normal-user'])
    expect(vipBroker.useVipFlag).toHaveBeenCalledWith('vip-user', null)
    expect(vipBroker.useVipFlag).toHaveBeenCalledWith('normal-user', null)

    const overlays = screen.getAllByTestId('family-vip-overlay')
    expect(overlays).toHaveLength(2)
    expect(overlays[0]).toHaveAttribute('data-vip-active', '1')
    expect(overlays[1]).toHaveAttribute('data-vip-active', '0')
  })
})
