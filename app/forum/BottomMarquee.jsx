'use client'
import React from 'react'

export default function BottomMarquee() {
  const [coins, setCoins] = React.useState([])

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/coins?limit=30&convert=USD', { cache: 'no-store' })
        const j = await r.json()
        if (alive && j?.ok && Array.isArray(j.coins)) setCoins(j.coins)
      } catch {}
    })()
    return () => { alive = false }
  }, [])

  // защитимся от "t.find is not a function" — не вызывать массивные методы у не-массивов
  const list = Array.isArray(coins) ? coins : []

  return (
    <section className="marquee-wrap no-gutters" aria-hidden="true">
      <div className="marquee" suppressHydrationWarning>
        {list.length === 0 ? (
          <>
            <span>BTC • ETH • SOL • XRP • BNB</span>
            <span>Loading market data…</span>
          </>
        ) : (
          list.map((c) => {
            const price = c.price != null ? c.price.toFixed(2) : '—'
            const ch = c.ch24 != null ? c.ch24.toFixed(2) : '0.00'
            const sign = c.ch24 >= 0 ? '+' : ''
            return (
              <span key={c.id}>
                {c.symbol} ${price} ({sign}{ch}%)
              </span>
            )
          })
        )}
      </div>
    </section>
  )
}
