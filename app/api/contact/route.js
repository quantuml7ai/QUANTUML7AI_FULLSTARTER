import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req) {
  try {
    const { name, email, message } = await req.json()

    const safeName = (name || '').toString().trim()
    const safeEmail = (email || '').toString().trim()
    const safeMessage = (message || '').toString().trim()

    if (!safeName || !safeEmail || !safeMessage) {
      return NextResponse.json(
        { ok: false, error: 'missing_fields' },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465, // true для 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const toEmail =
      process.env.CONTACT_EMAIL_TO || process.env.SMTP_FROM || process.env.SMTP_USER

    await transporter.sendMail({
      from: `"Q Coin Site" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Новое сообщение с формы контактов от ${safeName}`,
      replyTo: `"${safeName}" <${safeEmail}>`,
      text:
        `Имя: ${safeName}\n` +
        `E-mail: ${safeEmail}\n\n` +
        `Сообщение:\n${safeMessage}`,
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
