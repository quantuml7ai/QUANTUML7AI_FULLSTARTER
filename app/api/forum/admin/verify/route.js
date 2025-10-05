// app/api/forum/admin/verify/route.js
import { json, bad, setAdminCookie, clearAdminCookie } from '../../_utils.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const pass = body?.password || ''
    const configured = process.env.FORUM_ADMIN_PASS || ''
    const headers = {}
    if (!configured) {
      // if no pass configured we refuse to enable admin via API for safety
      // alternative: allow local dev if NODE_ENV !== 'production' and no pass set (but we keep strict)
      return bad('admin_pass_not_configured', 500)
    }
    if (pass === configured) {
      setAdminCookie(headers)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...headers },
      })
    } else {
      // clear cookie just in case
      clearAdminCookie(headers)
      return bad('invalid_password', 401)
    }
  } catch (err) {
    console.error('admin verify error', err)
    return bad('internal_error', 500)
  }
}

export async function DELETE() {
  // sign out admin (clear cookie)
  try {
    const headers = {}
    clearAdminCookie(headers)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json', ...headers },
    })
  } catch (e) {
    return bad('internal_error', 500)
  }
}
