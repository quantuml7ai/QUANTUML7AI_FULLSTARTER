// app/api/coins/route.js
import { NextResponse } from 'next/server'

const CMC_KEY = process.env.CMC_API_KEY || process.env.NEXT_PUBLIC_CMC_API_KEY

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || 30), 200)
  const convert = (searchParams.get('convert') || 'USD').toUpperCase()

  if (!CMC_KEY) {
    return NextResponse.json(
      { ok: false, error: 'CMC_API_KEY is missing' },
      { status: 500 }
    )
  }

  try {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=${convert}`

    const r = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_KEY,
        Accept: 'application/json',
      },
      // небольшой кеш, чтобы не упереться в rate limit
      next: { revalidate: 60 },
    })

    if (!r.ok) {
      const text = await r.text().catch(() => '')
      return NextResponse.json(
        { ok: false, error: `CMC ${r.status}`, body: text.slice(0, 300) },
        { status: r.status }
      )
    }

    const data = await r.json()

    // Отдаём компактный формат для маркизы
    const coins = Array.isArray(data.data)
      ? data.data.map((c) => ({
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          price: c.quote?.[convert]?.price ?? null,
          ch24: c.quote?.[convert]?.percent_change_24h ?? null,
          vol24: c.quote?.[convert]?.volume_24h ?? null,
          mcap: c.quote?.[convert]?.market_cap ?? null,
        }))
      : []

    const res = NextResponse.json({ ok: true, coins })
    // CORS для фронта того же домена не нужен, но можно поставить безопасно:
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
    return res
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'fetch_failed' },
      { status: 500 }
    )
  }
}
