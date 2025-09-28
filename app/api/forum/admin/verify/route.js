// app/api/forum/admin/verify/route.js

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { cookies } from 'next/headers'
import { json, bad } from '../../_utils.js'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const pass = String(body?.pass || '')
    const need = process.env.FORUM_ADMIN_PASS || ''

    if (!need) return bad('admin_pass_not_configured', 500)
    if (pass !== need) return bad('wrong_password', 401)

    // Set-Cookie: forum_admin=1; HttpOnly; Secure; SameSite=Lax
    const c = cookies()
    c.set('forum_admin', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 12, // 12 часов
    })

    return json({ ok: true })
  } catch (e) {
    return bad(e, e?.status || 500)
  }
}
