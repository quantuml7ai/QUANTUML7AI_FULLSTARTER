import { toAbsoluteSiteUrl } from '../lib/seo/siteOrigin'
import { PUBLIC_INDEX_ROUTES } from '../lib/seo/siteIndex'

export default function sitemap() {
  return PUBLIC_INDEX_ROUTES.map(({ path }) => ({
    url: toAbsoluteSiteUrl(path),
  }))
}
