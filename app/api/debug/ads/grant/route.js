// app/api/debug/ads/grant/route.js

import { NextResponse } from 'next/server'
import { grantAdsPackageForAccount } from '@/lib/adsCore'

export const dynamic = 'force-dynamic'

function norm(id) {
  return String(id || '').trim().toLowerCase()
}

export async function GET(req) {
  const url = new URL(req.url)

  try {
    const rawId =
      url.searchParams.get('id') ||
      url.searchParams.get('accountId')

    // pkg / pkgType / plan — любое из этих имён
    const rawPkg =
      url.searchParams.get('pkg') ||
      url.searchParams.get('pkgType') ||
      url.searchParams.get('plan') ||
      ''

    const accountId = norm(rawId)
    const pkgType = String(rawPkg || '').trim().toUpperCase()

    if (!accountId || !pkgType) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PASS ?id=<accountId>&pkg=<PKG_TYPE>',
          hint: 'Например: ?id=0x123...&pkg=TEST / BASIC / PRO / ULTRA',
        },
        { status: 400 },
      )
    }

    const now = new Date()

    const pkg = await grantAdsPackageForAccount({
      accountId,
      pkgType,
      now,
      note: 'debug-grant',
    })

    if (!pkg) {
      // grantAdsPackageForAccount вернёт null, если такого плана нет
      return NextResponse.json(
        {
          ok: false,
          error: 'UNKNOWN_PACKAGE',
          pkgType,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      accountId,
      pkgType: pkg.pkgType || pkg.type || pkgType,
      package: pkg,
    })
  } catch (e) {
    console.error('[debug/ads/grant] error', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'SERVER_ERROR',
        message: e?.message || String(e),
      },
      { status: 500 },
    )
  }
}
