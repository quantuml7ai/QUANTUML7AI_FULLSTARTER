// ============================================================================
// FILE: lib/databroker.js
// ============================================================================
export const BINANCE = 'https://api.binance.com'

export async function fetchKlines(symbol = 'BTCUSDT', tf = '5m', limit=500) {
  const url = `${BINANCE}/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`
  const r = await fetch(url,{ cache:'no-store' })
  const j = await r.json()
  const o=[],h=[],l=[],c=[],v=[],t=[]
  for(const k of j){ o.push(+k[1]); h.push(+k[2]); l.push(+k[3]); c.push(+k[4]); v.push(+k[5]); t.push(+k[6]) }
  return { o,h,l,c,v,t }
}

export async function fetchDepth(symbol = 'BTCUSDT', limit=50) {
  const r = await fetch(`${BINANCE}/api/v3/depth?symbol=${symbol}&limit=${limit}`,{ cache:'no-store' })
  const j = await r.json()
  const parse=(arr,side)=>arr.map(([p,q])=>({ price:+p, qty:+q, side }))
  return { bids: parse(j.bids,'bid'), asks: parse(j.asks,'ask') }
}

export async function spotFallback(){
  try{
    const [bs, cb] = await Promise.all([
      fetch('https://www.bitstamp.net/api/v2/ticker/btcusdt',{cache:'no-store'}).then(r=>r.json()).then(x=>+x.last).catch(()=>null),
      fetch('https://api.exchange.coinbase.com/products/BTC-USD/ticker',{cache:'no-store'}).then(r=>r.json()).then(x=>+x.price).catch(()=>null),
    ])
    return cb||bs||null
  }catch{ return null }
}