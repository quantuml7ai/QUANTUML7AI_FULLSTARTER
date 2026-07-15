export function interpolateMetaMarketText(template, vars = {}) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = vars && Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : ''
    return value == null ? '' : String(value)
  })
}

export function metaMarketT(t, key, vars = {}) {
  const value = typeof t === 'function' ? t(key) : key
  const resolved = value && value !== key ? value : key
  return interpolateMetaMarketText(resolved, vars)
}

export function metaMarketTitle(t, titleKey, fallbackTitle = '') {
  const value = typeof t === 'function' ? t(titleKey) : ''
  if (value && value !== titleKey) return value
  return String(fallbackTitle || titleKey || '')
}
