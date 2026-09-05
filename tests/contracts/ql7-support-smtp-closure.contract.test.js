import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU,
  QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT,
  QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU,
} from '../../lib/ql7-support/operator/reportContract.js'
import { renderQl7SupportOperatorEmailRu } from '../../lib/ql7-support/operator/smtpRendererRu.js'
import { buildQl7SupportContactConsentReceipt } from '../../lib/ql7-support/contact/contactConsent.js'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

function operatorCase({ consent = true } = {}) {
  return {
    id: 'case:smtp-contract',
    createdAt: '2026-08-16T20:00:00.000Z',
    integrity: { hash: 'case-hash:smtp-contract' },
    user: { nickname: 'Проверочный пользователь', userIdMasked: 'acct…1234', locale: 'ru' },
    request: {
      topic: 'partnership',
      subtopic: 'operator_handoff',
      messageAct: 'operator_handoff',
      originalText: 'Хочу обсудить партнёрство.',
      meaningRu: 'Пользователь хочет обсудить партнёрство.',
      safetyCategory: 'clean',
    },
    operatorReport: {
      requestType: 'business_partnership',
      originalText: 'Хочу обсудить партнёрство.',
      meaningRu: 'Пользователь хочет обсудить партнёрство.',
      importantTopics: ['partnership'],
      confirmedFacts: ['Пользователь явно запросил операторский контакт.'],
      userClaims: ['Хочу обсудить партнёрство.'],
      detectedProblem: 'Запрос на деловой контакт.',
      riskLevel: 'обычный',
      actionsTaken: ['Создан операторский case.'],
      dialogueHistory: ['Пользователь запросил партнёрский контакт.'],
      smtpStatus: 'prepared_not_sent',
    },
    checks: [],
    recommendations: ['Связаться только по подтверждённому пользователем каналу.'],
    contacts: consent
      ? { consent: true, email: 'user@example.test', preferred: 'email' }
      : { consent: false, contactDeclined: true, consentState: 'refused', email: 'user@example.test', preferred: 'dm', dmOnly: true },
    rating: { score: 50 },
    report: { businessWriteCount: 0, privacyBoundary: 'operator_internal_privacy_safe' },
  }
}

describe('QL7 Support REV.5.1 SMTP/operator closure', () => {
  test('routes committed Support operator reports through one fenced outbox and explicit live policy', () => {
    const server = read('lib/ql7-support/server.js')
    const outbox = read('lib/ql7-support/emailOutboxWorker.js')
    const transport = read('lib/supportEmailTransport.js')
    const policy = read('lib/ql7-support/operator/smtpPolicy.js')
    expect(server).toContain('ql7_support_direct_smtp_bypass_forbidden')
    expect(server).toContain('enqueueQl7SupportEmail')
    expect(server).toContain('processQl7SupportEmailOutbox')
    for (const token of ['leaseToken', 'leaseGeneration', 'email_outbox_idempotency_payload_conflict', 'rateLimitReceipt', 'email_transport_receipt_missing']) expect(outbox).toContain(token)
    expect(transport).toContain('buildQl7SupportSmtpLivePolicyReceipt')
    expect(transport).toContain('smtp_live_policy_rejected')
    for (const token of ['recipient_not_allowlisted', 'smtp_dry_run_report_audit_required', 'operator_policy_authorization_required', 'committed_case_required', 'dedupe_key_required', 'idempotency_key_required', 'fencing_token_required', 'rate_limit_receipt_required']) expect(policy).toContain(token)
    expect(policy).toContain('rateLimitReceipt?.enforced !== true')
  })

  test('keeps the exact Russian operator report and consent-bound Reply-To contract', () => {
    const report = read('lib/ql7-support/operator/reportContract.js')
    const contact = read('lib/ql7-support/contact/contactConsent.js')
    expect(QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT).toBe(15)
    expect(QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU).toHaveLength(15)
    expect(report).toContain('ql7_support_operator_report_section_count_mismatch')
    expect(report).toContain('section_names_contract_mismatch')
    expect(report).toContain('forbidden_visible_service_brand')

    const consented = renderQl7SupportOperatorEmailRu(operatorCase({ consent: true }))
    expect(consented.audit.ok).toBe(true)
    expect(consented.sectionNames).toEqual(QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU)
    expect(consented.sectionNames).toHaveLength(15)
    expect(consented.reportReceipt.russianSectionCount).toBe(15)
    expect(QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU).toEqual(['Агрегированный смысл', 'Действие оператора'])
    for (const section of QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU) {
      expect(consented.html).toContain(section)
      expect(consented.text).toContain(section)
    }
    expect(consented.html).toContain('background:#07111f!important;color:#ffffff!important')
    expect(consented.html).toContain('-webkit-text-fill-color:#ffffff!important')
    expect(consented.replyTo).toBe('user@example.test')
    expect(`${consented.subject}\n${consented.html}\n${consented.text}`).not.toMatch(/q[\s._-]*l[\s._-]*7/iu)

    const declined = renderQl7SupportOperatorEmailRu(operatorCase({ consent: false }))
    expect(declined.audit.ok).toBe(true)
    expect(declined.sectionNames).toEqual(QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU)
    expect(declined.replyTo).toBe('')
    expect(declined.html).not.toContain('user@example.test')
    expect(declined.html).toContain('Пользователь явно отказался от внешнего контакта')
    expect(`${declined.subject}\n${declined.html}\n${declined.text}`).not.toMatch(/q[\s._-]*l[\s._-]*7/iu)

    for (const rel of ['lib/ql7-support/adminReportComposer.js', 'lib/ql7-support/operator/adminReportRu.js', 'lib/supportEmailTransport.js', 'lib/ql7-support/server.js']) {
      const source = read(rel)
      expect(source).not.toMatch(/['"`]QL7 Support(?: DM| - отчёт оператору| — подробный отчёт оператору| premium case report| report| case|: обращение)/u)
    }

    const refusalReceipt = buildQl7SupportContactConsentReceipt({
      actorHash: 'actor:smtp-contract',
      purpose: 'operator_handoff',
      state: 'refused',
      channelTypes: ['dm'],
      sourceReceiptId: 'source:explicit-refusal',
      now: '2026-08-16T20:00:00.000Z',
    })
    expect(refusalReceipt).toMatchObject({ state: 'refused', channelTypes: ['dm'] })
    expect(contact).toContain("'refused'")
    expect(contact).toContain('QL7_SUPPORT_CONTACT_CONSENT_STATES')
  })

  test('lab SMTP proof covers dry snapshots and requires an explicit live-send flag', () => {
    const lab = read('scripts/ql7-support/smtp-proof.mjs')
    for (const id of ['technical_error', 'qcoin_theft', 'ads_inconsistency', 'threat', 'business', 'partnership', 'investment', 'user_contacts', 'provider_language', 'missing_data', 'unavailable_source']) expect(lab).toContain(id)
    expect(lab).toContain('smtp_live_requires_allow_smtp_send')
    expect(lab).toContain("rateLimitReceipt: { allowed: true, enforced: true")
    expect(lab).toContain('sectionNames.length === 15')
  })
})
