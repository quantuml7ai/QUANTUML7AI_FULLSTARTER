import forumPrimary from '../../../../lib/mongo/forum-primary.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function clampInt(value, fallback, min, max) {
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const since = clampInt(url.searchParams.get('since'), 0, 0, Number.MAX_SAFE_INTEGER)
    const limit = clampInt(url.searchParams.get('limit'), 128, 1, 512)
    if (since > 0) {
      const delta = await forumPrimary.readPublicPostMutationChangesSince({ sinceRev: since, limit })
      return new Response(JSON.stringify({ ok: true, ...delta }), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store, max-age=0',
          'x-ql7-read-source': 'mongo_primary_change_journal',
        },
      })
    }

    const rev = Number(await forumPrimary.readCounter('forum:rev', 0) || 0)
    return new Response(JSON.stringify({ ok: true, rev, cursorRev: rev, events: [], hasMore: false }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
        'x-ql7-read-source': 'mongo_primary',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, rev: 0, cursorRev: 0, events: [], hasMore: false, error: String(e?.message || e) }), {
      status: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
      },
    })
  }
}
