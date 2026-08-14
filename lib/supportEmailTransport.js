import nodemailer from 'nodemailer'
import {
  composeQl7SupportAdminReport,
  renderQl7SupportAdminReportHtml,
  renderQl7SupportAdminReportText,
} from './ql7-support/adminReportComposer.js'
import { renderQl7SupportOperatorEmailRu } from './ql7-support/operator/smtpRendererRu.js'

const captures = globalThis.__QL7_SUPPORT_EMAIL_CAPTURES__ || []
globalThis.__QL7_SUPPORT_EMAIL_CAPTURES__ = captures

function str(value) { return String(value ?? '').trim() }
function looksLikeEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(value)) }
function esc(value) {
  return str(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
function redact(value = '') {
  return str(value)
    .replace(/\bql7ws_[A-Za-z0-9_-]{12,}\b/g, '[wallet-session-redacted]')
    .replace(/\b(?:bearer\s+)?eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gi, '[token-redacted]')
    .replace(/\b(?:mongodb(?:\+srv)?|redis):\/\/[^\s]+/gi, '[connection-uri-redacted]')
    .replace(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, '[ip-redacted]')
}
function humanize(key = '') {
  const clean = str(key).replace(/[._-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ')
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : ''
}
function humanizeKnownValue(value = '') {
  const clean = redact(value)
  if (!/^[a-z][a-z0-9_.:-]{2,}$/iu.test(clean) || !/[_.:-]/u.test(clean)) return clean
  const mapped = {
    contact_form_received: 'Contact form received',
    contact_form_admin_only_redacted: 'Contact form, administrator-only, redacted',
    required_fields_validated: 'Required fields validated',
    email_syntax_validated: 'Email syntax validated',
    request_context_redacted: 'Request context redacted',
    request_ip_unavailable: 'Request IP unavailable',
    queued_for_admin_review: 'Queued for administrator review',
    admin_only_evidence_separated: 'Administrator-only evidence separated',
    ql7_support_dm: 'QL7 Support DM',
    contact_form: 'Contact form',
    user_safe_evidence_only: 'User-safe evidence only',
  }[clean]
  return mapped || humanize(clean)
}
function safeValue(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((item) => safeValue(item)).filter(Boolean).join(', ')
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${humanize(key)}: ${safeValue(item)}`).filter((row) => !row.endsWith(': ')).join(' | ')
  return humanizeKnownValue(value)
}

const LABELS = Object.freeze({
  en: { case: 'Case', actor: 'Verified actor', profile: 'Safe profile', geo: 'Safe location', domainPlan: 'Domain plan', diagnostic: 'Diagnostic evidence', timeline: 'Timeline', action: 'Recommended action', message: 'User message' },
  ru: { case: 'Кейс', actor: 'Подтверждённый пользователь', profile: 'Безопасный профиль', geo: 'Безопасная геолокация', domainPlan: 'План домена', diagnostic: 'Диагностические доказательства', timeline: 'Хронология', action: 'Рекомендуемое действие', message: 'Сообщение пользователя' },
  uk: { case: 'Кейс', actor: 'Підтверджений користувач', profile: 'Безпечний профіль', geo: 'Безпечна геолокація', domainPlan: 'План домену', diagnostic: 'Діагностичні докази', timeline: 'Хронологія', action: 'Рекомендована дія', message: 'Повідомлення користувача' },
  es: { case: 'Caso', actor: 'Actor verificado', profile: 'Perfil seguro', geo: 'Ubicación segura', domainPlan: 'Plan del dominio', diagnostic: 'Evidencia de diagnóstico', timeline: 'Cronología', action: 'Acción recomendada', message: 'Mensaje del usuario' },
  tr: { case: 'Vaka', actor: 'Doğrulanmış kullanıcı', profile: 'Güvenli profil', geo: 'Güvenli konum', domainPlan: 'Alan planı', diagnostic: 'Tanılama kanıtı', timeline: 'Zaman çizelgesi', action: 'Önerilen işlem', message: 'Kullanıcı mesajı' },
  ar: { case: 'القضية', actor: 'المستخدم الموثق', profile: 'الملف الآمن', geo: 'الموقع الآمن', domainPlan: 'خطة المجال', diagnostic: 'أدلة التشخيص', timeline: 'الخط الزمني', action: 'الإجراء المقترح', message: 'رسالة المستخدم' },
  zh: { case: '案例', actor: '已验证用户', profile: '安全资料', geo: '安全位置', domainPlan: '领域计划', diagnostic: '诊断证据', timeline: '时间线', action: '建议操作', message: '用户消息' },
})
function localeOf(value = '') { const clean = str(value).toLowerCase().split(/[-_]/)[0]; return LABELS[clean] ? clean : 'en' }
function sectionRows(title, rows = []) {
  const safeRows = (Array.isArray(rows) ? rows : []).map(([key, value]) => [str(key), safeValue(value)]).filter(([key, value]) => key && value)
  if (!safeRows.length) return ''
  return `<h2>${esc(title)}</h2><table role="presentation" cellspacing="0" cellpadding="0">${safeRows.map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(value)}</td></tr>`).join('')}</table>`
}

export function buildSupportEmailReport({ source = 'contact_form', name = '', email = '', message = '', meta = {}, report = null } = {}) {
  if (str(source) === 'ql7_support_dm' && report?.operatorCase?.schema === 'ql7.support.operator-case') {
    const rendered = renderQl7SupportOperatorEmailRu(report.operatorCase)
    return {
      version: 14,
      schema: 'ql7.support.operator-email',
      source: 'ql7_support_dm',
      subject: rendered.subject,
      operatorCase: clone(report.operatorCase),
      rendered,
      generatedAt: new Date().toISOString(),
    }
  }
  if (str(source) === 'ql7_support_dm') return composeQl7SupportAdminReport({ source, report, message, name, email })
  const input = report && typeof report === 'object' ? report : {}
  const cleanMeta = meta && typeof meta === 'object' ? meta : {}
  const locale = localeOf(input.locale || cleanMeta.locale)
  const diagnostic = input.diagnostic && typeof input.diagnostic === 'object' ? clone(input.diagnostic) : null
  return {
    title: str(input.title) || (str(source) === 'ql7_support_dm' ? 'QL7 Support premium case report' : 'Quantum L7 AI contact request'),
    source: str(input.source || source || 'contact_form'),
    name: str(name) || 'Quantum L7 AI',
    email: str(email),
    locale,
    user: redact(input.user || cleanMeta.user),
    messageId: str(input.messageId || cleanMeta.messageId),
    caseId: str(input.caseId || cleanMeta.caseId),
    topic: str(input.topic || cleanMeta.topic),
    messageAct: str(input.messageAct || input.role || cleanMeta.messageAct || cleanMeta.role),
    subIntent: str(input.subIntent || cleanMeta.subIntent),
    caseStatus: str(input.caseStatus || cleanMeta.caseStatus),
    diagnosticStatus: str(input.diagnosticStatus || cleanMeta.diagnosticStatus),
    detectedLanguage: str(input.detectedLanguage || cleanMeta.detectedLanguage),
    translationStatus: str(input.translationStatus || cleanMeta.translationStatus),
    responseCode: str(input.responseCode || cleanMeta.supportResponseCode),
    privacyBoundary: str(input.privacyBoundary || 'admin_only_evidence_separated'),
    actor: clone(input.actor || cleanMeta.actor) || {},
    profile: clone(input.profile || cleanMeta.profile) || {},
    safeGeo: clone(input.safeGeo || cleanMeta.safeGeo) || {},
    timeline: (Array.isArray(input.timeline) ? clone(input.timeline) : []).slice(0, 30),
    domainPlan: clone(input.domainPlan) || null,
    diagnostic,
    recommendedAction: str(input.recommendedAction),
    userMessagePreview: redact(input.userMessagePreview || message).slice(0, 4000),
    generatedAt: new Date().toISOString(),
  }
}

export function renderSupportEmailText(report = {}) {
  if (report?.schema === 'ql7.support.operator-email') return str(report?.rendered?.text)
  if (Number(report?.version) === 2 && str(report?.source) === 'ql7_support_dm') return renderQl7SupportAdminReportText(report)
  const labels = LABELS[localeOf(report.locale)]
  const lines = [
    report.title,
    '',
    `${labels.case}: ${report.caseId || '-'}`,
    `Topic: ${report.topic || '-'}`,
    `Status: ${report.caseStatus || report.diagnosticStatus || '-'}`,
    `User: ${report.user || '-'}`,
    `Language: ${report.detectedLanguage || report.locale || '-'}`,
    `Translation: ${report.translationStatus || '-'}`,
    '',
    `${labels.actor}: ${safeValue(report.actor) || '-'}`,
    `${labels.profile}: ${safeValue(report.profile) || '-'}`,
    `${labels.geo}: ${safeValue(report.safeGeo) || '-'}`,
    `${labels.diagnostic}: ${safeValue(report.diagnostic) || '-'}`,
    `${labels.timeline}: ${safeValue(report.timeline) || '-'}`,
    `${labels.action}: ${report.recommendedAction || '-'}`,
    '',
    `${labels.message}:`,
    report.userMessagePreview || '-',
  ]
  return lines.join('\n')
}

export function renderSupportEmailHtml(report = {}) {
  if (report?.schema === 'ql7.support.operator-email') return str(report?.rendered?.html)
  if (Number(report?.version) === 2 && str(report?.source) === 'ql7_support_dm') return renderQl7SupportAdminReportHtml(report)
  const labels = LABELS[localeOf(report.locale)]
  const diagnostic = report.diagnostic || {}
  const domain = report.domainPlan || {}
  return `<!doctype html><html lang="${esc(report.locale || 'en')}" dir="ltr"><head><meta charset="utf-8"><style>
    body{margin:0;background:#07101f;color:#ffffff;font-family:Arial,sans-serif}.wrap{max-width:920px;margin:0 auto;padding:24px}.card{border:1px solid rgba(117,230,255,.35);border-radius:18px;padding:22px;background:linear-gradient(145deg,#101f37,#07101f);color:#ffffff!important}h1{font-size:24px;color:#ffffff}h2{margin-top:22px;font-size:17px;color:#ffd979}table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border-bottom:1px solid rgba(95,185,255,.16);vertical-align:top;text-align:left;font-size:13px}th{width:220px;color:#c8f4ff;background:#12365a}td{color:#ffffff!important;background:#081a31}.message{border:1px solid rgba(255,215,96,.38);background:#092848!important;border-radius:14px;padding:16px;white-space:pre-wrap;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font-size:14px;line-height:1.55}.message *{color:#ffffff!important;-webkit-text-fill-color:#ffffff!important}.badge{display:inline-block;border:1px solid rgba(117,230,255,.55);border-radius:999px;padding:5px 10px;color:#ffffff;margin:0 6px 8px 0;font-size:12px}
  </style></head><body><div class="wrap"><div class="card">
    <h1>${esc(report.title || 'QL7 Support report')}</h1>
    <p><span class="badge">${esc(humanizeKnownValue(report.source || 'unknown'))}</span><span class="badge">${esc(humanizeKnownValue(report.topic || 'support'))}</span><span class="badge">${esc(humanizeKnownValue(report.caseStatus || report.diagnosticStatus || 'open'))}</span></p>
    ${sectionRows(labels.case, [['Request type', report.topic], ['Status', report.caseStatus], ['Language', report.detectedLanguage], ['Translation', report.translationStatus], ['Privacy', report.privacyBoundary]])}
    ${sectionRows(labels.actor, Object.entries(report.actor || {}).map(([key, value]) => [humanize(key), value]))}
    ${sectionRows(labels.profile, Object.entries(report.profile || {}).map(([key, value]) => [humanize(key), value]))}
    ${sectionRows(labels.geo, Object.entries(report.safeGeo || {}).map(([key, value]) => [humanize(key), value]))}
    ${sectionRows(labels.domainPlan, [['Label', domain.label], ['Scope', domain.scope], ['Read collections', domain.readCollections], ['Email policy', domain.emailPolicy]])}
    ${sectionRows(labels.diagnostic, [['Run ID', diagnostic.runId || diagnostic._id], ['Branch', diagnostic.branch], ['Status', diagnostic.status], ['Read-only', diagnostic.readOnly === true ? 'yes' : ''], ['Collections read', diagnostic.businessCollectionsRead], ['Checks', diagnostic.checks], ['Anomalies', diagnostic.anomalies], ['Missing', diagnostic.missing], ['Evidence', diagnostic.evidence]])}
    ${sectionRows(labels.timeline, (report.timeline || []).map((row, index) => [`${index + 1}. ${humanize(row?.type || row?.event || 'event')}`, safeValue(row)]))}
    ${sectionRows(labels.action, [['Action', report.recommendedAction]])}
    <h2>${esc(labels.message)}</h2><div class="message">${esc(report.userMessagePreview || '')}</div>
  </div></div></body></html>`
}

function smtpConfig() {
  const host = str(process.env.SMTP_HOST)
  const user = str(process.env.SMTP_USER)
  const pass = str(process.env.SMTP_PASS)
  const from = str(process.env.SMTP_FROM || user)
  const to = str(process.env.CONTACT_EMAIL_TO || process.env.QL7_SUPPORT_EMAIL_TO || from || user)
  return { host, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT || 587) === 465, user, pass, from, to }
}

export function normalizeSupportEmailPayload({ name, email, message } = {}) { return { name: str(name), email: str(email), message: str(message) } }
export function validateContactEmailPayload(payload = {}) { const safe = normalizeSupportEmailPayload(payload); return { ...safe, ok: !!safe.name && looksLikeEmail(safe.email) && !!safe.message } }
export function __getQl7SupportEmailCaptures() { return clone(captures) || [] }
export function __clearQl7SupportEmailCaptures() { captures.splice(0, captures.length) }

export async function sendSupportEmail({ source = 'contact_form', name = '', email = '', replyTo = '', subject = '', message = '', meta = {}, report = null } = {}) {
  const safeName = str(name) || 'Quantum L7 AI'
  const safeEmail = str(email)
  const cleanMessage = redact(message)
  if (!cleanMessage) return { ok: true, skipped: true, reason: 'empty_message' }
  const emailReport = buildSupportEmailReport({ source, name: safeName, email: safeEmail, message: cleanMessage, meta, report })
  const rendered = {
    subject: str(subject) || str(emailReport.subject) || (str(source) === 'ql7_support_dm' ? `QL7 Support case ${emailReport?.case?.caseId || emailReport?.case?.messageId || ''}`.trim() : `Quantum L7 AI contact from ${safeName}`),
    text: renderSupportEmailText(emailReport),
    html: renderSupportEmailHtml(emailReport),
    report: emailReport,
  }
  if (process.env.NODE_ENV === 'test' || process.env.QL7_SUPPORT_EMAIL_FAKE === '1') {
    captures.push({ ...clone(rendered), capturedAt: new Date().toISOString(), mode: 'fake' })
    return { ok: true, skipped: true, mode: 'fake', captureIndex: captures.length - 1, messageId: `fake-support-email-${captures.length}` }
  }
  const cfg = smtpConfig()
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.to || !cfg.from) return { ok: true, skipped: true, reason: 'smtp_not_configured' }
  const transporter = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: cfg.user, pass: cfg.pass } })
  const finalReplyTo = looksLikeEmail(replyTo) ? `"${safeName}" <${str(replyTo)}>` : (looksLikeEmail(safeEmail) ? `"${safeName}" <${safeEmail}>` : undefined)
  const info = await transporter.sendMail({ from: `"Quantum L7 AI" <${cfg.from}>`, to: cfg.to, subject: rendered.subject, replyTo: finalReplyTo, text: rendered.text, html: rendered.html })
  return { ok: true, skipped: false, messageId: str(info?.messageId) }
}
