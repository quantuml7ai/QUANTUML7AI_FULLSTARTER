// app/api/pay/create/route.js
import { NextResponse } from 'next/server'
export const runtime = 'nodejs'       // чтобы точно был Node.js runtime
export const dynamic = 'force-dynamic' // запрет кэширования роутов

export async function POST(req) {
  try {
    const { accountId } = await req.json() || {}
    if (!accountId) return NextResponse.json({ error:'NO_ACCOUNT' }, { status: 400 })

    // Читать и твои имена тоже
    const apiKey =
      process.env.NOWPAY_API_KEY ||
      process.env.NOWPAYMENTS_API_KEY

    if (!apiKey) return NextResponse.json({ error:'NO_API_KEY' }, { status: 500 })

    const price =
      Number(process.env.PLAN_PRICE_USD) ||
      Number(process.env.NOWPAYMENTS_PRICE_VIP) ||
      30

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const body = {
      price_amount: price,
      price_currency: process.env.NOWPAYMENTS_CURRENCY || 'usd',
      order_id: accountId,
      success_url: `${appUrl}/exchange?paid=1`,
      cancel_url:  `${appUrl}/exchange?cancel=1`,
      ipn_callback_url: `${appUrl}/api/pay/webhook`,
    }

    const r = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const j = await r.json()
    if (!r.ok) return NextResponse.json({ error:'NOWPAY_ERROR', details:j }, { status: 500 })

    return NextResponse.json({ invoice_id: j.id || j.invoice_id, url: j.invoice_url || j.invoice_url })
  } catch (e) {
    return NextResponse.json({ error:'CREATE_FAILED', details:String(e) }, { status: 500 })
  }
}
