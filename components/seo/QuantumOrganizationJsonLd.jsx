import {
  buildQuantumOrganizationStructuredData,
  serializeStructuredData,
} from '../../lib/seo/trustIdentityStructuredData.js'

export default function QuantumOrganizationJsonLd() {
  return (
    <script
      id="ql7-organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeStructuredData(buildQuantumOrganizationStructuredData()),
      }}
    />
  )
}
