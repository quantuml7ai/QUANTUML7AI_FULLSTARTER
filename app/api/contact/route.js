import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { sendSupportEmail, validateContactEmailPayload } from '../../../lib/supportEmailTransport.js'

function str(value) { return String(value ?? '').trim() }
function clean(value = '', max = 240) {
  return str(value).replace(/\s+/g, ' ').slice(0, max)
}
function header(req, key, max = 240) {
  try { return clean(req.headers.get(key) || '', max) } catch { return '' }
}
function hashValue(value = '') {
  const cleanValue = str(value)
  if (!cleanValue) return ''
  return `sha256:${crypto.createHash('sha256').update(cleanValue).digest('hex').slice(0, 20)}`
}
function requestIp(req) {
  const forwarded = header(req, 'x-forwarded-for')
  const direct = header(req, 'x-real-ip') || header(req, 'cf-connecting-ip') || header(req, 'x-vercel-forwarded-for')
  return clean((forwarded.split(',')[0] || direct || '').trim(), 80)
}
function emailDomain(email = '') {
  const domain = str(email).split('@')[1] || ''
  return domain.toLowerCase().slice(0, 160)
}
function safeClientMeta(meta = {}) {
  const input = meta && typeof meta === 'object' ? meta : {}
  return {
    locale: clean(input.locale, 40),
    timeZone: clean(input.timeZone, 80),
    path: clean(input.path, 160),
    viewport: clean(input.viewport, 80),
  }
}
function buildContactSupportReport({ req, payload, body }) {
  const meta = safeClientMeta(body?.meta)
  const browserLanguage = meta.locale || header(req, 'accept-language').split(',')[0]
  const ip = requestIp(req)
  const referer = header(req, 'referer', 360)
  const origin = header(req, 'origin', 220)
  const now = new Date().toISOString()
  return {
    source: 'contact_form',
    title: 'Quantum L7 AI contact request',
    locale: browserLanguage || 'en',
    topic: 'contact',
    messageAct: 'contact_request',
    caseStatus: 'queued',
    detectedLanguage: browserLanguage || 'unknown',
    translationStatus: 'not_required',
    responseCode: 'contact_form_received',
    privacyBoundary: 'contact_form_admin_only_redacted',
    profile: {
      'Submitted name': payload.name,
      'Email domain': emailDomain(payload.email),
    },
    safeGeo: {
      'Browser language': browserLanguage,
      'Time zone': meta.timeZone,
      'Page path': meta.path,
      Viewport: meta.viewport,
      Referrer: referer,
      Origin: origin,
      Country: header(req, 'cf-ipcountry') || header(req, 'x-vercel-ip-country'),
      'Request fingerprint': hashValue([ip, header(req, 'user-agent'), origin].filter(Boolean).join('|')),
    },
    diagnostic: {
      branch: 'contact_form_received',
      status: 'queued_for_admin_review',
      readOnly: true,
      checks: ['required_fields_validated', 'email_syntax_validated', 'request_context_redacted'],
      anomalies: [],
      missing: ip ? [] : ['request_ip_unavailable'],
    },
    timeline: [
      { at: now, type: 'contact_form_received', detail: 'The public contact form accepted the message and prepared a safe administrator report.' },
    ],
    recommendedAction: 'Review the user message, answer by email when needed, and use the request context only as safety evidence.',
    userMessagePreview: payload.message,
    generatedAt: now,
  }
}

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
      meta: safeClientMeta(body?.meta),
      report: buildContactSupportReport({ req, payload, body }),
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
