import { describe, expect, test } from 'vitest'
import { presentQl7SupportDiagnostic } from '../../../lib/ql7-support/diagnosticPresentation.js'
import { assertNoQl7MachineLeakV11_6 } from '../../../lib/ql7-support/evidencePolicyV11_6.js'

describe('QL7 Support V11.6 evidence-first presentation', () => {
  test('does not claim a QCoin theft is fully confirmed without time and amount evidence', () => {
    const card = presentQl7SupportDiagnostic({
      topic: 'qcoin', locale: 'ru',
      diagnosticResult: { topic: 'qcoin', branch: 'qcoin_security_evidence', asOf: '2026-07-29T00:17:00Z', evidence: {
        accountFound: true, balance: 22041622.365, ledgerOperationCount: 9,
        outgoingOperationCount: 0, pendingOperationCount: 1,
        windowStart: '2026-07-27T00:00:00Z', windowEnd: '2026-07-29T00:00:00Z',
        amountProvided: false, timeScopeProvided: false, checkedAt: '2026-07-29T00:17:00Z',
      } },
    })
    expect(card).toMatchObject({ title: 'Проверка безопасности QCoin', status: 'partial', semanticIcon: 'partial' })
    expect(card.summary).toMatch(/не найдено исходящих операций/u)
    expect(card.nextActions).toHaveLength(1)
    expect(card.table.rows.map((row) => row.label)).toEqual(['Текущий баланс', 'Проверено последних операций', 'Найдено исходящих операций', 'Операций в ожидании', 'Период проверки', 'Проверено'])
    expect(assertNoQl7MachineLeakV11_6(card)).toBe(true)
  })

  test('keeps an active ELITE advertising package active when all campaign slots are used', () => {
    const card = presentQl7SupportDiagnostic({
      topic: 'ads_packages', locale: 'ru',
      diagnosticResult: { topic: 'ads', branch: 'active', active: true, asOf: '2026-07-29T00:17:00Z', evidence: {
        packageName: 'ELITE', active: true, packageStatus: 'active', campaignLimit: 50,
        usedCampaigns: 50, availableCampaigns: 0, activatedAt: '2025-12-27T20:54:00Z',
        expiresAt: '2026-12-27T20:54:00Z', daysLeft: 152,
      } },
    })
    expect(card).toMatchObject({ title: 'Рекламный пакет', status: 'partial', semanticIcon: 'ads_package' })
    expect(card.summary).toContain('Пакет активен')
    expect(card.summary).toContain('лимит кампаний полностью использован')
    expect(card.table.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Пакет', value: 'ELITE' }),
      expect.objectContaining({ label: 'Статус пакета', value: 'Активен' }),
      expect.objectContaining({ label: 'Доступно новых кампаний', value: '0' }),
    ]))
  })
})
