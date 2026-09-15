import { notFound } from 'next/navigation'
import TrustIdentityArticle from '../../../components/trust/TrustIdentityArticle.jsx'
import { getTrustIdentityContent } from '../../../lib/seo/trustIdentityContent.js'
import {
  TRUST_IDENTITY_LANGS,
  normalizeTrustIdentityLang,
} from '../../../lib/seo/trustIdentityRoutes.js'
import { buildTrustIdentityMetadata } from '../../../lib/seo/trustIdentityMetadata.js'
import {
  buildTrustIdentityPageStructuredData,
  serializeStructuredData,
} from '../../../lib/seo/trustIdentityStructuredData.js'

export const dynamicParams = false

export function generateStaticParams() {
  return TRUST_IDENTITY_LANGS.map((lang) => ({ lang }))
}

export function generateMetadata({ params }) {
  return buildTrustIdentityMetadata(params?.lang) || {}
}


export default function TrustIdentityPage({ params }) {
  const lang = normalizeTrustIdentityLang(params?.lang)
  if (!lang) notFound()

  const content = getTrustIdentityContent(lang)
  const structuredData = buildTrustIdentityPageStructuredData({ lang, content })

  return (
    <>
      <script
        id={`ql7-trust-identity-jsonld-${lang}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <TrustIdentityArticle lang={lang} content={content} />
    </>
  )
}
