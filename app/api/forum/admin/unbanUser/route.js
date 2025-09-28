'use server'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { dbUnbanUser } from '../../_db.js'

// Жёстко проверяем httpOnly куку forum_admin (как и в остальных админ-роутах)
function isAdminCookieOk() {
  try {
    const c = cookies().get('forum_admin')
    return c?.value === '1'
  } catch {
    return false
  }
}

export async function POST(request) {
  try {
    if (!isAdminCookieOk()) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const accountId = body?.accountId
    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'accountId_required' }, { status: 400 })
    }
    await dbUnbanUser(accountId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin/unbanUser error:', e)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}
