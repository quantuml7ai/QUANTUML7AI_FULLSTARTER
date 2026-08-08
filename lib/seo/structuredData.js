import { SITE_ORIGIN } from './siteOrigin'
import { SEO_SUPPORTED_LANGS } from './siteIndex'

// Поисковые системы получают честное описание многоязычной экосистемы даже
// до появления отдельных индексируемых URL для каждой локали.
export const SEO_LANGUAGE_DESCRIPTIONS = Object.freeze({
  en: 'Quantum L7 AI is a multilingual digital ecosystem connecting artificial intelligence, Web3 infrastructure, market intelligence, education, social communication, digital ownership, MetaMarket, and future metaverse experiences.',
  ru: 'Quantum L7 AI — многоязычная цифровая экосистема, объединяющая искусственный интеллект, Web3-инфраструктуру, рыночную аналитику, образование, социальное общение, цифровое владение, MetaMarket и будущие метавселенные.',
  uk: 'Quantum L7 AI — багатомовна цифрова екосистема, що поєднує штучний інтелект, Web3-інфраструктуру, ринкову аналітику, освіту, соціальне спілкування, цифрове володіння, MetaMarket і майбутні метавсесвіти.',
  zh: 'Quantum L7 AI 是一个多语言数字生态系统，连接人工智能、Web3 基础设施、市场分析、教育、社交交流、数字所有权、MetaMarket 与未来元宇宙体验。',
  ar: 'Quantum L7 AI منظومة رقمية متعددة اللغات تجمع الذكاء الاصطناعي وبنية Web3 وتحليلات الأسواق والتعليم والتواصل الاجتماعي والملكية الرقمية وMetaMarket وتجارب الميتافيرس المستقبلية.',
  tr: 'Quantum L7 AI; yapay zeka, Web3 altyapısı, piyasa analitiği, eğitim, sosyal iletişim, dijital mülkiyet, MetaMarket ve geleceğin metaverse deneyimlerini birleştiren çok dilli bir dijital ekosistemdir.',
  es: 'Quantum L7 AI es un ecosistema digital multilingüe que conecta inteligencia artificial, infraestructura Web3, análisis de mercados, educación, comunicación social, propiedad digital, MetaMarket y futuras experiencias de metaverso.',
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
    })),
  }
}
