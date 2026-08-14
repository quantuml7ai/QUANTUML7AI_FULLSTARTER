import { SITE_ORIGIN } from './siteOrigin'
import { SEO_SUPPORTED_LANGS } from './siteIndex'

// Поисковые системы получают честное описание многоязычной экосистемы даже
// до появления отдельных индексируемых URL для каждой локали.
export const SEO_LANGUAGE_DESCRIPTIONS = Object.freeze({
  en: 'We are Quantum L7 AI, a multilingual digital ecosystem connecting artificial intelligence, Web3 infrastructure, market intelligence, education, social communication, digital ownership, MetaMarket and future virtual-world experiences.',
  ru: 'Мы — Quantum L7 AI, многоязычная цифровая экосистема, объединяющая искусственный интеллект, Web3-инфраструктуру, рыночную аналитику, образование, социальное общение, цифровое владение, MetaMarket и будущие виртуальные миры.',
  uk: 'Ми — Quantum L7 AI, багатомовна цифрова екосистема, що поєднує штучний інтелект, Web3-інфраструктуру, ринкову аналітику, освіту, соціальне спілкування, цифрове володіння, MetaMarket і майбутні віртуальні світи.',
  zh: '我们是 Quantum L7 AI，一个多语言数字生态系统，连接人工智能、Web3 基础设施、市场分析、教育、社交交流、数字所有权、MetaMarket 与未来虚拟世界体验。',
  ar: 'نحن Quantum L7 AI، منظومة رقمية متعددة اللغات تجمع الذكاء الاصطناعي وبنية Web3 وتحليلات الأسواق والتعليم والتواصل الاجتماعي والملكية الرقمية وMetaMarket وتجارب العوالم الافتراضية المستقبلية.',
  tr: 'Biz Quantum L7 AI olarak yapay zekâ, Web3 altyapısı, piyasa analitiği, eğitim, sosyal iletişim, dijital mülkiyet, MetaMarket ve geleceğin sanal dünya deneyimlerini birleştiren çok dilli bir dijital ekosistemiz.',
  es: 'Somos Quantum L7 AI, un ecosistema digital multilingüe que conecta inteligencia artificial, infraestructura Web3, análisis de mercados, educación, comunicación social, propiedad digital, MetaMarket y futuras experiencias de mundos virtuales.',
})

export function buildMultilingualWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': SEO_SUPPORTED_LANGS.map((lang) => ({
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website-${lang}`,
      url: SITE_ORIGIN,
      name: 'Quantum L7 AI',
      description: SEO_LANGUAGE_DESCRIPTIONS[lang],
      inLanguage: lang,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      identifier: `${SITE_ORIGIN}/#website-${lang}`,
    })),
  }
}
