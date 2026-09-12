import { appendFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const FORUM_DIAG_MASTER_ENABLED =
  String(process.env.NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED || '') === '1'

const FORUM_DIAG_SUBFLAGS = {
  diag: String(process.env.NEXT_PUBLIC_FORUM_DIAG || '') === '1',
  perf: String(process.env.NEXT_PUBLIC_FORUM_PERF_TRACE || '') === '1',
}

const LOG_PATH = path.join(process.cwd(), 'forum-diag.jsonl')

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  })
}

export async function GET() {
  return json({
    ok: true,
    enabled: FORUM_DIAG_MASTER_ENABLED,
    masterEnabled: FORUM_DIAG_MASTER_ENABLED,
    flags: FORUM_DIAG_SUBFLAGS,
  })
}

export async function POST(request) {
  if (!FORUM_DIAG_MASTER_ENABLED) {
    return json({ ok: true, skipped: true, reason: 'diag_master_disabled' })
  }

  try {
    const payload = await request.json()
    const row = {
      ts: new Date().toISOString(),
      ...((payload && typeof payload === 'object') ? payload : { event: 'invalid_payload' }),
    }
    await appendFile(LOG_PATH, `${JSON.stringify(row)}\n`, 'utf8')
    return json({ ok: true })
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(error?.message || error || 'forum_diag_write_failed'),
      },
      500,
    )
  }
}
