import { beforeEach, describe, expect, test, vi } from 'vitest'

const getAdsReadOnlySnapshot = vi.fn()
const getAnalyticsForCampaign = vi.fn()
vi.mock('../../../lib/adsCore.js', () => ({ getAdsReadOnlySnapshot, getAnalyticsForCampaign }))

const { readQl7SupportAdsDiagnostic } = await import('../../../lib/ql7-support/adsSupportReadAdapter.js')

describe('QL7 Support canonical.5 same-source advertising evidence', () => {
  beforeEach(() => { getAdsReadOnlySnapshot.mockReset(); getAnalyticsForCampaign.mockReset() })

  test('uses the advertising cabinet read source and keeps an active package distinct from zero campaigns', async () => {
    getAdsReadOnlySnapshot.mockResolvedValue({
      ok: true, readOnly: true, writes: [], source: 'adsCore', linkedAccountIds: ['wallet-1', 'telegram-1'],
      currentPackage: { id: 'pkg-elite', packageName: 'ELITE', status: 'active', startsAt: '2026-01-01T00:00:00.000Z', expiresAt: '2027-01-01T00:00:00.000Z', usedCampaigns: 50, maxCampaigns: 50 },
      packages: [{ id: 'pkg-elite', packageName: 'ELITE', status: 'active', startsAt: '2026-01-01T00:00:00.000Z', expiresAt: '2027-01-01T00:00:00.000Z', usedCampaigns: 50, maxCampaigns: 50 }],
      campaigns: [],
    })
    const result = await readQl7SupportAdsDiagnostic({ userId: 'wallet-1', aliases: ['telegram-1'], analysis: { messageAct: 'personal_status_request', subIntent: 'ads_packages_self_status', operation: 'check_status' }, now: new Date('2026-07-28T00:00:00.000Z') })
    expect(result).toMatchObject({ branch: 'ads_package_active', status: 'healthy', readOnly: true, sourceAdapter: 'adsCore.getAdsReadOnlySnapshot' })
    expect(result.evidence).toMatchObject({ packageName: 'ELITE', packageStatus: 'active', packageUsedCampaigns: 50, packageMaxCampaigns: 50, campaignCount: 0 })
    expect(getAnalyticsForCampaign).not.toHaveBeenCalled()
  })

  test('reads campaign analytics only when metrics were explicitly requested', async () => {
    getAdsReadOnlySnapshot.mockResolvedValue({
      ok: true, currentPackage: { id: 'pkg-1', status: 'active', expiresAt: '2027-01-01T00:00:00.000Z' },
      packages: [{ id: 'pkg-1', status: 'active', expiresAt: '2027-01-01T00:00:00.000Z' }],
      campaigns: [{ id: 'cmp-1', packageId: 'pkg-1', name: 'Campaign 1', status: 'active' }],
    })
    getAnalyticsForCampaign.mockResolvedValue({ ok: true, impressionsTotal: 1000, clicksTotal: 25, ctrTotal: 0.025, updatedAt: '2026-07-28T00:00:00.000Z' })
    const result = await readQl7SupportAdsDiagnostic({ userId: 'wallet-1', analysis: { messageAct: 'personal_status_request', subIntent: 'ads_campaigns_metrics', operation: 'show_metrics' }, now: new Date('2026-07-28T00:00:00.000Z') })
    expect(result.branch).toBe('ads_metrics_ok')
    expect(result.evidence).toMatchObject({ impressions: 1000, clicks: 25 })
    expect(getAnalyticsForCampaign).toHaveBeenCalledTimes(1)
  })

  test('honors the canonical confirmed operation on a coreference follow-up', async () => {
    getAdsReadOnlySnapshot.mockResolvedValue({
      ok: true,
      currentPackage: { id: 'pkg-1', status: 'active', expiresAt: '2027-01-01T00:00:00.000Z' },
      packages: [{ id: 'pkg-1', status: 'active', expiresAt: '2027-01-01T00:00:00.000Z' }],
      campaigns: [{ id: 'cmp-1', packageId: 'pkg-1', name: 'Campaign 1', status: 'active' }],
    })
    getAnalyticsForCampaign.mockResolvedValue({
      ok: true,
      impressionsTotal: 820,
      clicksTotal: 41,
      ctrTotal: 0.05,
      updatedAt: '2026-07-28T00:00:00.000Z',
    })

    const result = await readQl7SupportAdsDiagnostic({
      userId: 'wallet-1',
      analysis: {
        canonicalText: 'покажи их за неделю',
        intentConfirmation: {
          state: 'confirmed',
          adapterAuthorized: true,
          adapterOperationId: 'campaign_metrics',
          slotValues: { domainId: 'ads_campaigns', operationId: 'campaign_metrics' },
        },
      },
      now: new Date('2026-07-28T00:00:00.000Z'),
    })

    expect(getAnalyticsForCampaign).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ branch: 'ads_metrics_ok', evidence: { impressions: 820, clicks: 41 } })
  })
})
