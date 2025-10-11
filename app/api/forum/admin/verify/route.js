// app/api/forum/admin/verify/route.js
import { json, bad, setAdminCookie, clearAdminCookie } from '../../_utils.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const pass = String(body?.password ?? '')
    const configured = String(process.env.FORUM_ADMIN_PASS || '')

    if (!configured) {
      return bad('admin_pass_not_configured', 500)
    }

    const headers = {}
    if (pass === configured) {
      // ставим куку админа
      setAdminCookie(headers)
      return json({ ok: true }, 200, headers)
    } else {
      // при неверном пароле явно сбросим куку (защита от «залипаний»)
      clearAdminCookie(headers)
      return json({ ok: false, error: 'invalid_password' }, 401, headers)
    }
  } catch (err) {
    console.error('admin verify error', err)
    return bad('internal_error', 500)
  }
}

export async function DELETE() {
  try {
    const headers = {}
    clearAdminCookie(headers)
    return json({ ok: true }, 200, headers)
  } catch (e) {
    return bad('internal_error', 500)
  }
}
