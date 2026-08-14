export const OFFICIAL_QUANTUM_L7_CHANNELS = Object.freeze([
  Object.freeze({
    id: 'website',
    kind: 'website',
    label: 'Website',
    url: 'https://www.quantuml7ai.com/',
    organizationSameAs: false,
  }),
  Object.freeze({
    id: 'x',
    kind: 'social',
    label: 'X',
    url: 'https://x.com/QL7Company',
    organizationSameAs: true,
  }),
  Object.freeze({
    id: 'instagram',
    kind: 'social',
    label: 'Instagram',
    url: 'https://www.instagram.com/quantuml7ai/',
    organizationSameAs: true,
  }),
  Object.freeze({
    id: 'tiktok',
    kind: 'social',
    label: 'TikTok',
    url: 'https://www.tiktok.com/@ql7ai',
    organizationSameAs: true,
  }),
  Object.freeze({
    id: 'youtube',
    kind: 'social',
    label: 'YouTube',
    url: 'https://www.youtube.com/channel/UCXby6llW_TokAUGoOebFXhg',
    organizationSameAs: true,
  }),
  Object.freeze({
    id: 'telegram-channel',
    kind: 'social',
    label: 'Telegram',
    url: 'https://t.me/l7universe',
    organizationSameAs: true,
  }),
  Object.freeze({
    id: 'telegram-bot',
    kind: 'service',
    label: 'Telegram Bot',
    url: 'https://t.me/l7ai_bot',
    organizationSameAs: false,
  }),
])

export const OFFICIAL_QUANTUM_L7_CHANNELS_BY_ID = Object.freeze(
  Object.fromEntries(OFFICIAL_QUANTUM_L7_CHANNELS.map((entry) => [entry.id, entry])),
)

export const OFFICIAL_QUANTUM_L7_SAME_AS = Object.freeze(
  OFFICIAL_QUANTUM_L7_CHANNELS
    .filter((entry) => entry.organizationSameAs === true)
    .map((entry) => entry.url),
)

export function getOfficialQuantumL7Channel(id = '') {
  return OFFICIAL_QUANTUM_L7_CHANNELS_BY_ID[String(id || '').trim()] || null
}
