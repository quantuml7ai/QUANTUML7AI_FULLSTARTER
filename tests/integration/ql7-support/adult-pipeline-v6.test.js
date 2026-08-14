import { describe, expect, test } from 'vitest'
import { routeQl7SupportMessage } from '../../../lib/ql7-support/semanticRouter.js'
import { buildQl7SupportPremiumResponsePlan } from '../../../lib/ql7-support/responsePlan.js'
import { presentQl7SupportDiagnostic } from '../../../lib/ql7-support/diagnosticPresentation.js'
import { buildQl7SupportCard, validateQl7SupportCard } from '../../../lib/ql7-support/cards.js'
import { composeQl7SupportAdminReport, renderQl7SupportAdminReportHtml } from '../../../lib/ql7-support/adminReportComposer.js'

describe('QL7 Support adult end-to-end service pipeline', () => {
  test('routes, realizes and signs a diagnostic result without raw source keys', () => {
    const route = routeQl7SupportMessage({
      text: 'Проверь мой VIP статус',
      locale: 'ru',
      previousContext: {},
      baseAnalysis: { topic: 'vip', role: 'status_request', subIntent: 'vip_self_status', entities: { selfReference: true } },
    })
    expect(route.topic).toBe('vip')
    expect(route.messageAct).toBe('personal_status_request')
    const diagnosticResult = { status: 'completed', branch: 'healthy', evidence: { rowsFound: 1, plan: 'VIP Plus', expiresAt: '2026-09-01T00:00:00.000Z', adapterId: 'internal' }, checks: ['subscription'], anomalies: [], asOf: '2026-07-24T00:00:00.000Z' }
    const presentation = presentQl7SupportDiagnostic({ diagnosticResult, topic: route.topic, locale: 'ru' })
    const card = buildQl7SupportCard(presentation.card)
    expect(validateQl7SupportCard(card)).toMatchObject({ ok: true })
    expect(JSON.stringify(card)).not.toMatch(/adapterId|businessCollectionsRead|collections/)
    const plan = buildQl7SupportPremiumResponsePlan({ analysis: { ...route, role: route.messageAct }, route, diagnosticResult, locale: 'ru' })
    expect(plan.text).not.toMatch(/read-only|adapter|коллекц/iu)
  })

  test('composes premium English admin report without secrets or reporter identity', () => {
    const report = composeQl7SupportAdminReport({ report: { caseId: 'case-7', messageId: 'msg-7', topic: 'moderation', user: 'user-7', userMessagePreview: 'token: ql7ws_abcdefghijklmnop', reporterId: 'private-user', diagnostic: { facts: [{ label: 'Post', value: 'post-1' }], checks: ['snapshot'], anomalies: ['threshold reached'] }, recommendedAction: 'Review the moderation event.' } })
    const html = renderQl7SupportAdminReportHtml(report)
    expect(html).toContain('QL7 Support - отчёт оператору')
    expect(html).toContain('Рекомендуемое действие')
    expect(html).toContain('Действия оператора')
    expect(html).toContain('Открыть прямой диалог в DM')
    expect(report.user.accountReference).toBe('user-7')
    expect(report.actions[0].href).toContain('dmUser=user-7')
    expect(report.actions[0].href).toContain('supportCase=case-7')
    expect(report.actions[0].href).toContain('supportMessage=msg-7')
    expect(html).toContain('dmUser=user-7')
    expect(html).not.toMatch(/dmUser=User\+7|supportCase=Case\+7|supportMessage=Msg\+7/u)
    expect(html).not.toMatch(/Open support thread|View applicant profile|Open conversation inbox/u)
    expect(html).toContain('background:#092848!important;color:#ffffff!important')
    expect(html).toContain('Privacy proof')
    expect(html).not.toContain('Open direct conversation')
    expect(html).not.toContain('private-user')
    expect(html).not.toContain('ql7ws_abcdefghijklmnop')
  })
})
