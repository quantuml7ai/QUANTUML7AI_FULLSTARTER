import { NextResponse } from 'next/server'
import { TRUST_IDENTITY_X_DEFAULT_PATH } from '../../lib/seo/trustIdentityRoutes.js'

export function GET(request) {
  return NextResponse.redirect(new URL(TRUST_IDENTITY_X_DEFAULT_PATH, request.url), 308)
}
