import { refreshNativePushDevice, registerNativePushDevice } from '../../../../../lib/nativePush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const metadata = {
      appVersion: body?.appVersion,
      model: body?.model,
    }
    const result = body?.deviceId && body?.secret
      ? await refreshNativePushDevice(body.deviceId, body.secret, body.token, metadata)
      : await registerNativePushDevice(body?.nonce, body?.token, metadata)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    const message = String(error?.message || 'native_push_register_failed')
    const status = message.startsWith('invalid_') || message.startsWith('missing_') ? 400 : 500
    return Response.json({ ok: false, error: message }, { status })
  }
}
