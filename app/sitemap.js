import { toAbsoluteSiteUrl } from '../lib/seo/siteOrigin.js'
import { PUBLIC_INDEX_ROUTES } from '../lib/seo/siteIndex.js'
import { buildTrustIdentityAlternates } from '../lib/seo/trustIdentityRoutes.js'

export default function sitemap() {
  const trustAlternates = buildTrustIdentityAlternates({ absolute: true })
  return PUBLIC_INDEX_ROUTES.map(({ path, alternatesGroup }) => {
    const entry = { url: toAbsoluteSiteUrl(path) }
    if (alternatesGroup === 'trust-and-identity') {
      entry.alternates = { languages: trustAlternates }
    }
    return entry
  })
}
