import { K, redis } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const raw = await redis.get(K.rev)
    const rev = Number(raw || 0) || 0

    return new Response(
      JSON.stringify({ ok: true, rev }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store, max-age=0',
        },
      },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        rev: 0,
        error: String(e?.message || e),
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store, max-age=0',
        },
      },
    )
  }
}
