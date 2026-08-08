import forumPrimary from '../../../../lib/mongo/forum-primary.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const rev = Number(await forumPrimary.readCounter('forum:rev', 0) || 0)
    return new Response(JSON.stringify({ ok: true, rev }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
        'x-ql7-read-source': 'mongo_primary',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, rev: 0, error: String(e?.message || e) }), {
      status: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
      },
    })
  }
}
