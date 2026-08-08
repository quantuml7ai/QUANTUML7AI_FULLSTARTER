import { ql7Locale, ql7Str } from '../internal/text.js'
import { QL7_SUPPORT_DOMAIN_KNOWLEDGE_NATIVE } from './domainKnowledge.native.js'
import { QL7_SUPPORT_DOMAIN_KNOWLEDGE_PROVIDER } from './domainKnowledge.provider.js'

export const QL7_SUPPORT_DOMAIN_KNOWLEDGE_VERSION = '15.1.0'

const ALL = Object.freeze({
  ...QL7_SUPPORT_DOMAIN_KNOWLEDGE_NATIVE,
  ...QL7_SUPPORT_DOMAIN_KNOWLEDGE_PROVIDER,
})

function fill(value = '', label = '') {
  return ql7Str(value).replaceAll('{label}', ql7Str(label))
}

export function getQl7SupportDomainKnowledgePack(locale = 'en', label = '') {
  const language = ql7Locale(locale)
  const source = ALL[language] || ALL.en
  return Object.freeze({
    version: QL7_SUPPORT_DOMAIN_KNOWLEDGE_VERSION,
    locale: language,
    intro: fill(source.intro, label),
    use: fill(source.use, label),
    boundary: fill(source.boundary, label),
    source: QL7_SUPPORT_DOMAIN_KNOWLEDGE_NATIVE[language]
      ? 'native-domain-knowledge'
      : 'provider-domain-knowledge',
  })
}
