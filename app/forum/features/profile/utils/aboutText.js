export const ABOUT_LIMIT = 200

export function normalizeAboutDraft(raw) {
  return String(raw ?? '').replace(/\r\n/g, '\n').slice(0, ABOUT_LIMIT)
}

export function normalizeAboutForSave(raw) {
  const s = String(raw ?? '').replace(/\r\n/g, '\n')
  const trimmed = s.replace(/^[ \t]+|[ \t]+$/g, '')
  return trimmed.slice(0, ABOUT_LIMIT)
}
