import { NextResponse } from 'next/server'
import { sendSupportEmail, validateContactEmailPayload } from '../../../lib/supportEmailTransport.js'

export async function POST(req) {
  try {
    const body = await req.json()
    const payload = validateContactEmailPayload(body)

    if (!payload.ok) {
      return NextResponse.json(
        { ok: false, error: 'missing_fields' },
        { status: 400 }
      )
    }

    await sendSupportEmail({
      source: 'contact_form',
      name: payload.name,
      email: payload.email,
      replyTo: payload.email,
      subject: `Новое сообщение с формы контактов от ${payload.name}`,
      message: `Сообщение:\n${payload.message}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('CONTACT_SEND_ERROR', e)
    return NextResponse.json(
      { ok: false, error: 'send_failed' },
      { status: 500 }
    )
  }
}
