import { SITE_ORIGIN } from '../lib/seo/siteOrigin'
import { ROBOTS_DISALLOW_PATHS } from '../lib/seo/siteIndex'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
