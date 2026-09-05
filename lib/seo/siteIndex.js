import { I18N_SUPPORTED_LANGS } from '../../components/i18n-dicts/manifest.js'
import { TRUST_IDENTITY_LANGS, TRUST_IDENTITY_PATHS_BY_LANG } from './trustIdentityRoutes.js'

// Канонический реестр индексации. Любая новая страница должна быть явно
// добавлена либо в PUBLIC_INDEX_ROUTES, либо в NON_INDEXED_PAGE_ROUTES.
const BASE_PUBLIC_INDEX_ROUTES = Object.freeze([
  Object.freeze({ path: '/', pageFile: 'app/page.js', metadataFile: 'app/layout.js' }),
  Object.freeze({ path: '/about', pageFile: 'app/about/page.js', metadataFile: 'app/about/layout.js' }),
  Object.freeze({ path: '/academy', pageFile: 'app/academy/page.js', metadataFile: 'app/academy/layout.js' }),
  Object.freeze({ path: '/ads', pageFile: 'app/ads/page.jsx', metadataFile: 'app/ads/layout.js' }),
  Object.freeze({ path: '/exchange', pageFile: 'app/exchange/page.js', metadataFile: 'app/exchange/layout.js' }),
  Object.freeze({ path: '/forum', pageFile: 'app/forum/page.js', metadataFile: 'app/forum/layout.js' }),
  Object.freeze({ path: '/game', pageFile: 'app/game/page.js', metadataFile: 'app/game/layout.js' }),
  Object.freeze({ path: '/privacy', pageFile: 'app/privacy/page.js', metadataFile: 'app/privacy/layout.js' }),
  Object.freeze({ path: '/subscribe', pageFile: 'app/subscribe/page.js', metadataFile: 'app/subscribe/layout.js' }),
])

export const TRUST_IDENTITY_PUBLIC_ROUTES = Object.freeze(
  TRUST_IDENTITY_LANGS.map((locale) => Object.freeze({
    path: TRUST_IDENTITY_PATHS_BY_LANG[locale],
    pageFile: 'app/[lang]/trust-and-identity/page.js',
    metadataFile: 'app/[lang]/trust-and-identity/page.js',
    metadataMode: 'generated',
    locale,
    alternatesGroup: 'trust-and-identity',
  })),
)

export const PUBLIC_INDEX_ROUTES = Object.freeze([
  ...BASE_PUBLIC_INDEX_ROUTES,
  ...TRUST_IDENTITY_PUBLIC_ROUTES,
])

// Страницы, которые существуют в app/**/page.js, но намеренно не должны
// индексироваться. Причину необходимо документировать рядом с записью.
export const NON_INDEXED_PAGE_ROUTES = Object.freeze([
  Object.freeze({
    path: '/contact',
    pageFile: 'app/contact/page.js',
    metadataFile: 'app/contact/layout.js',
    reason: 'Legacy contact page is disabled as a public search landing page: its default route redirects into authenticated QL7 Support, while the bounded impersonation-safety view is informational and remains non-indexed.',
  }),
  Object.freeze({
    path: '/tma/auto',
    pageFile: 'app/tma/auto/page.jsx',
    metadataFile: 'app/tma/auto/layout.js',
    reason: 'Telegram Mini App automatic authorization bootstrap; not a public search landing page.',
  }),
])

// Технические зоны, которые поисковым роботам не требуется сканировать.
// Это не механизм безопасности: доступ к данным защищается на уровне API.
export const ROBOTS_DISALLOW_PATHS = Object.freeze([
  '/api/',
])

export function getPublicIndexPaths() {
  return PUBLIC_INDEX_ROUTES.map((route) => route.path)
}

export const SEO_SUPPORTED_LANGS = Object.freeze([...I18N_SUPPORTED_LANGS])
