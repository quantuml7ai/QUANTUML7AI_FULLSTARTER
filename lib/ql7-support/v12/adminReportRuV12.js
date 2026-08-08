export const QL7_SUPPORT_ADMIN_REPORT_RU_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }
function esc(value) {
  return str(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

export function composeQl7SupportAdminReportRuV12({ caseId = '', topic = '', identity = {}, tone = {}, recommendation = '' } = {}) {
  return Object.freeze({
    version: QL7_SUPPORT_ADMIN_REPORT_RU_VERSION_V12,
    locale: 'ru',
    subject: `QL7 Support: ${str(topic) || 'case'} ${str(caseId).slice(0, 24)}`,
    body: [
      'Сводка обращения QL7 Support.',
      `Тема: ${str(topic) || 'не определена'}.`,
      `Пользователь: ${str(identity.actorIdMasked) || 'synthetic-redacted'}.`,
      `Риск: ${str(tone.taxonomyCategory || tone.category || 'normal')}.`,
      `Рекомендация: ${str(recommendation) || 'проверить обезличенную суть обращения и ответить без запроса лишних служебных данных'}.`,
    ].join('\n'),
    privacySafe: true,
    containsRawSecrets: false,
  })
}

export function renderQl7SupportAdminReportRuHtmlV12(report = {}) {
  const safeBody = str(report.body || 'Сводка обращения QL7 Support.')
  const safeSubject = str(report.subject || 'QL7 Support: обращение на проверку')
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${esc(safeSubject)}</title><style>
body{margin:0;background:#07111f;color:#ffffff;font-family:Inter,Segoe UI,Arial,sans-serif}.wrap{max-width:920px;margin:0 auto;padding:28px}.panel{border:1px solid rgba(117,230,255,.34);border-radius:18px;background:linear-gradient(145deg,#122642,#07111f);box-shadow:0 18px 50px rgba(0,0,0,.28);padding:22px;color:#ffffff!important}h1{margin:0 0 14px;color:#ffffff;font-size:24px}.badge{display:inline-block;border:1px solid rgba(117,230,255,.55);border-radius:999px;padding:6px 11px;margin:0 8px 14px 0;color:#ffffff;background:rgba(43,113,156,.24);font-size:12px;font-weight:700}.message{white-space:pre-wrap;border:1px solid #9edfff;border-radius:14px;padding:16px;background:#092848!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font-weight:650;line-height:1.55;overflow-wrap:anywhere}.message *{color:#ffffff!important;-webkit-text-fill-color:#ffffff!important}
</style></head><body bgcolor="#07111f" style="margin:0;background:#07111f!important;color:#ffffff!important"><main class="wrap" style="background:#07111f;color:#ffffff"><section class="panel" style="color:#ffffff!important"><h1>QL7 Support - отчёт оператору</h1><span class="badge">privacy-safe</span><span class="badge">русский SMTP report</span><div class="message" bgcolor="#092848" style="white-space:pre-wrap;border:1px solid #9edfff;border-radius:14px;padding:16px;background:#092848!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font-weight:650;line-height:1.55;overflow-wrap:anywhere">${esc(safeBody)}</div></section></main></body></html>
`
}
