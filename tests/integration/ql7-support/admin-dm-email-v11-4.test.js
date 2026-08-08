import { describe, expect, test } from 'vitest'
import { composeQl7SupportAdminReport, renderQl7SupportAdminReportHtml } from '../../../lib/ql7-support/adminReportComposer.js'

describe('QL7 Support V11.4 aggregate administrator email', () => {
  test('renders one direct-DM action and a Gmail-safe readable user claim', () => {
    const account = '0x1111111111111111111111111111111111111111'
    const report = composeQl7SupportAdminReport({ report: {
      caseId: 'case-v11-4', messageId: 'message-v11-4', correlationId: 'corr-v11-4',
      topic: 'ads_packages', user: account, userMessagePreview: 'Мой пакет ещё активен?',
      diagnostic: { facts: [], checks: [], anomalies: [] },
    } })
    const html = renderQl7SupportAdminReportHtml(report)
    expect(report.actions).toHaveLength(1)
    expect(report.actions[0]).toMatchObject({ label: 'Open direct conversation' })
    expect(report.actions[0].href).toContain(`/forum?inbox=messages&dmUser=${account}`)
    expect(html).toContain('Открыть прямой диалог в DM')
    expect(html).not.toMatch(/Open support thread|View applicant profile|Open conversation inbox/u)
    expect(html).toContain('background:#092848!important;color:#ffffff!important')
    expect(html).toContain('-webkit-text-fill-color:#ffffff!important')
    expect(html).not.toContain('Open direct conversation')
  })

  test('preserves opaque account, case and message identifiers in the administrator deep link', () => {
    const report = composeQl7SupportAdminReport({ report: {
      caseId: 'case-7', messageId: 'msg-7', correlationId: 'corr-7',
      topic: 'moderation', user: 'user-7', userMessagePreview: 'Please review this case.',
      diagnostic: { facts: [], checks: [], anomalies: [] },
    } })
    expect(report.user.accountReference).toBe('user-7')
    expect(report.actions).toHaveLength(1)
    const href = report.actions[0].href
    expect(href).toContain('dmUser=user-7')
    expect(href).toContain('supportCase=case-7')
    expect(href).toContain('supportMessage=msg-7')
    expect(href).toContain('correlation=corr-7')
    expect(href).not.toMatch(/User\+7|Case\+7|Msg\+7|Corr\+7/u)
  })

})
