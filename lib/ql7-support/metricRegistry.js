const METRICS = Object.freeze({
  impressions: Object.freeze({
    aliases: ['impressions', 'impressions_total', 'views', 'view_count', 'views_total', 'показы', 'просмотры'],
    labels: Object.freeze({ en: 'Views', ru: 'Просмотры', uk: 'Перегляди', es: 'Impresiones', tr: 'Gösterimler', ar: 'مرات الظهور', zh: '展示次数' }),
    format: 'integer',
  }),
  clicks: Object.freeze({
    aliases: ['clicks', 'clicks_total', 'click_count', 'клики'],
    labels: Object.freeze({ en: 'Clicks', ru: 'Клики', uk: 'Кліки', es: 'Clics', tr: 'Tıklamalar', ar: 'النقرات', zh: '点击次数' }),
    format: 'integer',
  }),
  ctr: Object.freeze({
    aliases: ['ctr', 'ctr_total', 'click_through_rate'],
    labels: Object.freeze({ en: 'CTR', ru: 'CTR', uk: 'CTR', es: 'CTR', tr: 'CTR', ar: 'معدل النقر', zh: '点击率' }),
    format: 'percent',
  }),
  campaignName: Object.freeze({
    aliases: ['campaign_name', 'campaignname', 'campaign', 'кампания'],
    labels: Object.freeze({ en: 'Campaign', ru: 'Кампания', uk: 'Кампанія', es: 'Campaña', tr: 'Kampanya', ar: 'الحملة', zh: '活动名称' }),
    format: 'text',
  }),
  packageName: Object.freeze({
    aliases: ['package_name', 'packagename', 'package', 'пакет'],
    labels: Object.freeze({ en: 'Package', ru: 'Пакет', uk: 'Пакет', es: 'Paquete', tr: 'Paket', ar: 'الحزمة', zh: '套餐' }),
    format: 'text',
  }),
  expiresAt: Object.freeze({
    aliases: ['expires_at', 'expiresat', 'until_iso', 'untiliso', 'active_until', 'активна до'],
    labels: Object.freeze({ en: 'Active until', ru: 'Активна до', uk: 'Активна до', es: 'Activa hasta', tr: 'Bitiş', ar: 'نشطة حتى', zh: '有效期至' }),
    format: 'datetime',
  }),
  metricsUpdatedAt: Object.freeze({
    aliases: ['metrics_updated_at', 'metricsupdatedat', 'updated_at', 'updatedat', 'as_of'],
    labels: Object.freeze({ en: 'Metrics updated', ru: 'Метрики обновлены', uk: 'Метрики оновлено', es: 'Métricas actualizadas', tr: 'Metrikler güncellendi', ar: 'تحديث المقاييس', zh: '指标更新时间' }),
    format: 'datetime',
  }),
  balance: Object.freeze({
    aliases: ['balance', 'qcoin_balance', 'account_balance', 'баланс', 'состояние_баланса'],
    labels: Object.freeze({ en: 'Balance', ru: 'Баланс', uk: 'Баланс', es: 'Saldo', tr: 'Bakiye', ar: 'الرصيد', zh: '余额' }),
    format: 'decimal',
  }),
  checkedAt: Object.freeze({
    aliases: ['checked_at', 'checkedat', 'verified_at', 'verifiedat'],
    labels: Object.freeze({ en: 'Checked', ru: 'Проверено', uk: 'Перевірено', es: 'Comprobado', tr: 'Kontrol edildi', ar: 'تم التحقق', zh: '检查时间' }),
    format: 'datetime',
  }),
  packageCount: Object.freeze({
    aliases: ['package_count', 'packagecount'],
    labels: Object.freeze({ en: 'Packages found', ru: 'Пакетов найдено', uk: 'Пакетів знайдено' }),
    format: 'integer',
  }),
  campaignCount: Object.freeze({
    aliases: ['campaign_count', 'campaigncount'],
    labels: Object.freeze({ en: 'Campaigns found', ru: 'Кампаний найдено', uk: 'Кампаній знайдено' }),
    format: 'integer',
  }),
})

function str(value) { return String(value ?? '').trim() }
function key(value = '') {
  return str(value)
    .normalize('NFKC')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/[^\p{L}\p{N}_]+/gu, '')
    .toLowerCase()
}

const ALIASES = new Map()
for (const [canonical, spec] of Object.entries(METRICS)) {
  ALIASES.set(key(canonical), canonical)
  for (const alias of spec.aliases || []) ALIASES.set(key(alias), canonical)
}

export function normalizeQl7MetricKey(value = '') {
  return ALIASES.get(key(value)) || ''
}

export function isQl7MetricAllowed(value = '') {
  return Boolean(normalizeQl7MetricKey(value))
}

export function localizeQl7Metric(value = '', locale = 'en') {
  const canonical = normalizeQl7MetricKey(value)
  const lang = str(locale).toLowerCase().split(/[-_]/u)[0] || 'en'
  return METRICS[canonical]?.labels?.[lang] || METRICS[canonical]?.labels?.en || ''
}

export function ql7MetricFormat(value = '') {
  const canonical = normalizeQl7MetricKey(value)
  return METRICS[canonical]?.format || 'text'
}

export function normalizeQl7MetricRow(row = {}, locale = 'en') {
  const rawKey = str(row?.key || row?.label)
  const canonical = normalizeQl7MetricKey(rawKey)
  if (!canonical) return null
  const value = row?.value
  if (value === null || value === undefined || value === '') return null
  return Object.freeze({
    key: canonical,
    label: localizeQl7Metric(canonical, locale),
    value,
    format: str(row?.format) || ql7MetricFormat(canonical),
    tone: str(row?.tone || 'neutral'),
    visibility: str(row?.visibility || 'both'),
  })
}

export function normalizeQl7MetricRows(rows = [], locale = 'en') {
  const seen = new Set()
  return (Array.isArray(rows) ? rows : [])
    .map((row) => normalizeQl7MetricRow(row, locale))
    .filter(Boolean)
    .filter((row) => {
      const sig = `${row.key}\0${String(row.value)}`
      if (seen.has(sig)) return false
      seen.add(sig)
      return true
    })
    .slice(0, 32)
}

export const QL7_SUPPORT_METRIC_REGISTRY = METRICS
