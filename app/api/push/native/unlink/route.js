import { unlinkNativePushDevice } from '../../../../../lib/nativePush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await unlinkNativePushDevice(body?.deviceId, body?.secret)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    const message = String(error?.message || 'native_push_unlink_failed')
    const status = message.startsWith('invalid_') || message.startsWith('missing_') ? 400 : 500
    return Response.json({ ok: false, error: message }, { status })
  }
}
