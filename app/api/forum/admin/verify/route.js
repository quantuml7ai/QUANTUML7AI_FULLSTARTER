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
      return bad('admin_pass_not_configured', 500)
    }
    if (pass === configured) {
      setAdminCookie(headers)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...headers },
      })
    } else {
      clearAdminCookie(headers)
      return bad('invalid_password', 401)
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
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json', ...headers },
    })
  } catch (e) {
    return bad('internal_error', 500)
  }
}
