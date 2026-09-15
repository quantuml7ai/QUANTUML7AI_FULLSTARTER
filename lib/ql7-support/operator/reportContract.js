import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_OPERATOR_REPORT_VERSION = '5.1.3'
export const QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU = Object.freeze([
  'Кто пользователь',
  'Тип обращения',
  'Исходный текст',
  'Русский смысловой перевод',
  'Важные темы разговора',
  'Подтверждённые факты',
  'Заявления пользователя',
  'Результаты проверок',
  'Выявленная проблема',
  'Уровень риска',
  'Предпринятые действия',
  'История диалога',
  'Рекомендации оператору',
  'Добровольно предоставленные контакты',
  'Статус отправки',
])
export const QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT = 15
export const QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU = Object.freeze([
  'Агрегированный смысл',
  'Действие оператора',
])
if (QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU.length !== QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT) {
  throw new Error('ql7_support_operator_report_section_count_mismatch')
}

export const QL7_SUPPORT_ECONOMIC_SECURITY_REPORT_SECTIONS_RU = Object.freeze([
  'Идентификатор инцидента',
  'Пользователь и canonical account',
  'Тип операции или Composer surface',
  'Краткий смысл события',
  'Выбранная policy action',
  'Почему она выбрана',
  'Подтверждающие receipts',
  'Альтернативные объяснения',
  'Контрдоказательства',
  'История предупреждений/ограничений',
  'IP/geo/device evidence',
  'Что заблокировано',
  'Срок restriction/quarantine',
  'Что не было заблокировано',
  'Рекомендация оператору',
  'Нерешённые вопросы',
  'Audit trail',
])

const FORBIDDEN = /(?:seed\s+phrase|mnemonic|private\s+key|bearer\s+[a-z0-9._~+\/=:-]{8,}|mongodb?:\/\/|\bql7_support_[a-z0-9_]+\b|\bstack\s*trace\b)/iu
const FORBIDDEN_VISIBLE_SERVICE_BRAND = /q[\s._-]*l[\s._-]*7/iu

function exactRussianSectionNames(rendered = {}) {
  const names = Array.isArray(rendered?.sectionNames)
    ? rendered.sectionNames.map((value) => ql7Str(value))
    : []
  return names.length === QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT &&
    names.every((name, index) => name === QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU[index])
}

export function buildQl7SupportOperatorReportReceipt({ operatorCase = {}, rendered = {}, smtpStatus = 'prepared_not_sent' } = {}) {
  const body = {
    schema: 'ql7.support.operator-report-receipt',
    schemaVersion: QL7_SUPPORT_OPERATOR_REPORT_VERSION,
    caseId: ql7Str(operatorCase?.id),
    caseHash: ql7Str(operatorCase?.integrity?.hash),
    subjectHash: ql7StableHash(ql7Str(rendered?.subject)),
    htmlHash: ql7StableHash(ql7Str(rendered?.html)),
    textHash: ql7StableHash(ql7Str(rendered?.text)),
    smtpStatus: ql7Str(smtpStatus) || 'prepared_not_sent',
    russianSectionCount: QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT,
    russianSectionNamesHash: ql7StableHash(JSON.stringify(QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU)),
    evidenceSectionNamesHash: ql7StableHash(JSON.stringify(QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU)),
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `operator-report:${receiptHash}`, receiptHash })
}

export function auditQl7SupportOperatorReport({ operatorCase = {}, rendered = {} } = {}) {
  const failures = []
  const html = ql7Str(rendered?.html)
  const text = ql7Str(rendered?.text)
  const subject = ql7Str(rendered?.subject)

  if (!exactRussianSectionNames(rendered)) failures.push('section_names_contract_mismatch')
  for (const section of QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU) {
    if (!html.includes(section)) failures.push(`missing_section:${section}`)
  }
  for (const section of QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU) {
    if (!html.includes(section) || !text.includes(section)) failures.push(`missing_evidence_section:${section}`)
  }
  if (FORBIDDEN.test(html) || FORBIDDEN.test(text) || FORBIDDEN.test(subject)) failures.push('forbidden_internal_or_secret')
  if (FORBIDDEN_VISIBLE_SERVICE_BRAND.test(html) || FORBIDDEN_VISIBLE_SERVICE_BRAND.test(text) || FORBIDDEN_VISIBLE_SERVICE_BRAND.test(subject)) failures.push('forbidden_visible_service_brand')
  if (!/lang=["']ru["']/u.test(html)) failures.push('html_not_ru')
  if (operatorCase?.contacts?.consent !== true && /(?:mailto:|Reply-To|Предпочтительный канал:\s*[^—])/iu.test(html)) {
    failures.push('contact_without_consent')
  }
  return Object.freeze({
    ok: failures.length === 0,
    failures: Object.freeze(failures),
    sectionCount: QL7_SUPPORT_OPERATOR_REPORT_SECTION_COUNT,
    exactSectionOrder: failures.includes('section_names_contract_mismatch') === false,
  })
}
