import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_SMTP_POLICY_VERSION = '5.1.0'
export const QL7_SUPPORT_SMTP_RATE_WINDOW_MS = 10 * 60 * 1000
export const QL7_SUPPORT_SMTP_MAX_PER_ACTOR_WINDOW = 6
export const QL7_SUPPORT_SMTP_MAX_GLOBAL_WINDOW = 120

const SECRET = /(?:mongodb(?:\+srv)?:\/\/|redis:\/\/|bearer\s+[A-Za-z0-9._-]+|private\s+key|seed\s+phrase|mnemonic|password\s*[:=]|token\s*[:=]|ql7ws_[A-Za-z0-9_-]{12,}|stack\s*trace)/iu
function email(value = '') { const v = ql7Str(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(v) ? v : '' }
function allowlist(value = '', configuredRecipient = '') {
  const rows = String(value || '').split(/[;,\s]+/u).map(email).filter(Boolean)
  const configured = email(configuredRecipient)
  if (configured && !rows.includes(configured)) rows.push(configured)
  return Object.freeze([...new Set(rows.map((row) => row.toLowerCase()))])
}
function renderedText(rendered = {}) { return `${ql7Str(rendered.subject)}\n${ql7Str(rendered.text)}\n${ql7Str(rendered.html)}` }

export function buildQl7SupportSmtpLivePolicyReceipt({
  source = '', emailReport = null, rendered = null, config = {}, requestedReplyTo = '', smtpContext = {},
} = {}) {
  const failures = []
  const supportSource = ql7Str(source) === 'ql7_support_dm'
  const recipient = email(config.to)
  const sender = email(config.from)
  const recipients = allowlist(process.env.QL7_SUPPORT_SMTP_RECIPIENT_ALLOWLIST, recipient)
  if (!recipient || !recipients.includes(recipient.toLowerCase())) failures.push('recipient_not_allowlisted')
  if (!sender) failures.push('sender_invalid')

  const operatorCase = emailReport?.operatorCase || null
  const reportAuditOk = emailReport?.rendered?.audit?.ok === true || rendered?.reportReceipt?.schema === 'ql7.support.operator-report-receipt'
  const contactConsent = operatorCase?.contacts?.consent === true
  const consentEmail = contactConsent ? email(operatorCase?.contacts?.email) : ''
  const requested = email(requestedReplyTo)
  if (supportSource && requested && requested !== consentEmail) failures.push('reply_to_not_consent_bound')
  const replyTo = consentEmail || sender
  if (!replyTo) failures.push('reply_to_invalid')
  if (SECRET.test(renderedText(rendered))) failures.push('secret_or_internal_transport_material')

  if (supportSource) {
    if (operatorCase?.schema !== 'ql7.support.operator-case') failures.push('operator_case_required')
    if (!ql7Str(operatorCase?.id)) failures.push('operator_case_id_required')
    if (!ql7Str(operatorCase?.finalMessageId)) failures.push('committed_delivery_reference_required')
    if (!reportAuditOk) failures.push('smtp_dry_run_report_audit_required')
    if (smtpContext?.operatorPolicyAuthorized !== true) failures.push('operator_policy_authorization_required')
    if (smtpContext?.committedCase !== true) failures.push('committed_case_required')
    if (!ql7Str(smtpContext?.outboxId)) failures.push('outbox_id_required')
    if (!ql7Str(smtpContext?.dedupeKey)) failures.push('dedupe_key_required')
    if (!ql7Str(smtpContext?.idempotencyKey)) failures.push('idempotency_key_required')
    if (!ql7Str(smtpContext?.fencingToken)) failures.push('fencing_token_required')
    if (smtpContext?.rateLimitReceipt?.allowed !== true || smtpContext?.rateLimitReceipt?.enforced !== true) failures.push('rate_limit_receipt_required')
  }

  const body = {
    schema: 'ql7.support.smtp-live-policy-receipt', schemaVersion: QL7_SUPPORT_SMTP_POLICY_VERSION,
    supportSource, operatorCaseId: ql7Str(operatorCase?.id), committedDeliveryId: ql7Str(operatorCase?.finalMessageId),
    recipientHash: recipient ? ql7StableHash(recipient.toLowerCase()) : '',
    senderHash: sender ? ql7StableHash(sender.toLowerCase()) : '',
    replyToSource: consentEmail ? 'consented_user_contact' : sender ? 'configured_sender' : 'none',
    replyToHash: replyTo ? ql7StableHash(replyTo.toLowerCase()) : '',
    contactConsentBound: !requested || requested === consentEmail,
    dryRunSuccess: supportSource ? reportAuditOk : true,
    operatorPolicyAuthorized: smtpContext?.operatorPolicyAuthorized === true,
    committedCase: smtpContext?.committedCase === true,
    dedupeKeyHash: ql7Str(smtpContext?.dedupeKey) ? ql7StableHash(smtpContext.dedupeKey) : '',
    idempotencyKeyHash: ql7Str(smtpContext?.idempotencyKey) ? ql7StableHash(smtpContext.idempotencyKey) : '',
    fencingTokenHash: ql7Str(smtpContext?.fencingToken) ? ql7StableHash(smtpContext.fencingToken) : '',
    rateLimitReceipt: smtpContext?.rateLimitReceipt || null,
    failures: Object.freeze([...new Set(failures)]),
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, ok: body.failures.length === 0, replyTo, receiptHash })
}
