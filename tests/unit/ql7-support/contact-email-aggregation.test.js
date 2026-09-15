import { describe, expect, test } from 'vitest'
import { buildSupportEmailReport, renderSupportEmailHtml } from '../../../lib/supportEmailTransport.js'

describe('contact SMTP aggregation', () => {
  test('renders a safe administrator report without raw IP addresses or secrets', () => {
    const report = buildSupportEmailReport({
      source: 'contact_form',
      name: 'Dmitry',
      email: 'dmitry@example.com',
      message: 'Please check this contact request ql7ws_abcdefghijklmnop',
      meta: { locale: 'ru-RU' },
      report: {
        source: 'contact_form',
        title: 'Quantum L7 AI contact request',
        locale: 'ru-RU',
        topic: 'contact',
        messageAct: 'contact_request',
        caseStatus: 'queued',
        profile: {
          'Submitted name': 'Dmitry',
          'Email domain': 'example.com',
        },
        safeGeo: {
          'Browser language': 'ru-RU',
          'Time zone': 'Europe/Kiev',
          'Request fingerprint': 'sha256:abcdef1234567890',
        },
        diagnostic: {
          branch: 'contact_form_received',
          status: 'queued_for_admin_review',
          checks: ['request_context_redacted'],
          evidence: 'raw ip 203.0.113.77 redacted before report',
        },
        recommendedAction: 'Review and answer by email.',
        userMessagePreview: 'Please check this contact request ql7ws_abcdefghijklmnop',
      },
    })

    const html = renderSupportEmailHtml(report)
    expect(html).toContain('Browser language')
    expect(html).toContain('Request fingerprint')
    expect(html).toContain('Submitted name')
    expect(html).toContain('Email domain')
    expect(html).not.toContain('ql7ws_abcdefghijklmnop')
    expect(html).not.toContain('203.0.113.77')
  })
})
