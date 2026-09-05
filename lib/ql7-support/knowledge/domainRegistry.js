import {getQl7SupportDomain, getQl7SupportTopicLabel} from '../ecosystemCatalog.js'
import {QL7_SUPPORT_CANONICAL_DOMAIN_IDS} from '../ontology/domains/index.js'
export const QL7_SUPPORT_SPECIAL_DOMAIN_TOPICS = Object.freeze(['partnership','investment','learning_governance'])
export const QL7_SUPPORT_DOMAIN_TOPICS = Object.freeze([...new Set([...QL7_SUPPORT_CANONICAL_DOMAIN_IDS, ...QL7_SUPPORT_SPECIAL_DOMAIN_TOPICS])])
import {getQl7SupportTopicAction} from '../topicActionRegistry.js'
import {ql7Locale, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_DOMAIN_REGISTRY_VERSION = '15.1.0'

const SPECIAL = Object.freeze({
  partnership: Object.freeze({
    label: Object.freeze({ en: 'Partnership', ru: 'Партнёрство', uk: 'Партнерство', es: 'Colaboración', tr: 'Ortaklık', ar: 'الشراكة', zh: '合作', he: 'שותפות' }),
    scope: 'business partnership intake and operator handoff',
    authRequired: false,
  }),
  investment: Object.freeze({
    label: Object.freeze({ en: 'Investment proposal', ru: 'Инвестиционное предложение', uk: 'Інвестиційна пропозиція', es: 'Propuesta de inversión', tr: 'Yatırım teklifi', ar: 'اقتراح استثمار', zh: '投资提案', he: 'הצעת השקעה' }),
    scope: 'investment proposal intake and operator handoff',
    authRequired: false,
  }),
  learning_governance: Object.freeze({
    label: Object.freeze({ en: 'Learning governance', ru: 'Управление обучением', uk: 'Керування навчанням', es: 'Gobernanza del aprendizaje', tr: 'Öğrenme yönetişimi', ar: 'حوكمة التعلم', zh: '学习治理', he: 'ממשל למידה' }),
    scope: 'privacy, poisoning review, evaluation, shadow, canary and rollback',
    authRequired: true,
  }),
})

export function getQl7SupportCanonicalDomain(topic = '', locale = 'en') {
  const clean = ql7Str(topic) || 'support_system'
  const language = ql7Locale(locale)
  const special = SPECIAL[clean]
  const base = special || getQl7SupportDomain(clean)
  const action = getQl7SupportTopicAction(clean, {
    locale: language,
    seed: `domain:${clean}`,
    kind: 'primary',
  })

  return Object.freeze({
    version: QL7_SUPPORT_DOMAIN_REGISTRY_VERSION,
    topic: clean,
    parent: ql7Str(base.parent),
    children: Object.freeze(base.children || []),
    label: special
      ? ql7Str(special.label[language] || special.label.en || clean)
      : getQl7SupportTopicLabel(clean, language),
    scope: ql7Str(base.scope),
    capabilities: Object.freeze(base.knowledge || base.capabilities || base.functions || []),
    boundaries: Object.freeze(base.boundaries || []),
    authRequired: base.authRequired === true,
    readOnly: base.readOnly !== false,
    cta: action || null,
    source: special ? 'canonical-special-domain-registry' : 'canonical-ecosystem-domain-registry',
  })
}
