import nodemailer from 'nodemailer'

function str(value) {
  return String(value ?? '').trim()
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(value))
}

function smtpConfig() {
  const host = str(process.env.SMTP_HOST)
  const user = str(process.env.SMTP_USER)
  const pass = str(process.env.SMTP_PASS)
  const from = str(process.env.SMTP_FROM || user)
  const to = str(process.env.CONTACT_EMAIL_TO || process.env.QL7_SUPPORT_EMAIL_TO || from || user)
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    user,
    pass,
    from,
    to,
  }
}

export function normalizeSupportEmailPayload({ name, email, message } = {}) {
  return {
    name: str(name),
    email: str(email),
    message: str(message),
  }
}

export function validateContactEmailPayload(payload = {}) {
  const safe = normalizeSupportEmailPayload(payload)
  return {
    ...safe,
    ok: !!safe.name && looksLikeEmail(safe.email) && !!safe.message,
  }
}

export async function sendSupportEmail({
  source = 'contact_form',
  name = '',
  email = '',
  replyTo = '',
  subject = '',
  message = '',
  meta = {},
} = {}) {
  const safeName = str(name) || 'Quantum L7 AI'
  const safeEmail = str(email)
  const cleanMessage = str(message)
  if (!cleanMessage) return { ok: true, skipped: true, reason: 'empty_message' }
  if (process.env.NODE_ENV === 'test' || process.env.QL7_SUPPORT_EMAIL_FAKE === '1') {
    return { ok: true, skipped: true, mode: 'fake' }
  }

  const cfg = smtpConfig()
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.to || !cfg.from) {
    return { ok: true, skipped: true, reason: 'smtp_not_configured' }
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  const sourceLabel = str(source) || 'contact_form'
  const finalSubject = str(subject) || `Новое сообщение с формы контактов от ${safeName}`
  const finalReplyTo = looksLikeEmail(replyTo)
    ? `"${safeName}" <${str(replyTo)}>`
    : (looksLikeEmail(safeEmail) ? `"${safeName}" <${safeEmail}>` : undefined)

  await transporter.sendMail({
    from: `"Q Coin Site" <${cfg.from}>`,
    to: cfg.to,
    subject: finalSubject,
    replyTo: finalReplyTo,
    text: [
      `Source: ${sourceLabel}`,
      `Name: ${safeName}`,
      safeEmail ? `E-mail: ${safeEmail}` : '',
      ...Object.entries(meta || {}).map(([key, value]) => `${key}: ${str(value) || 'unknown'}`),
      '',
      cleanMessage,
    ].filter(Boolean).join('\n'),
  })

  return { ok: true, skipped: false }
}
