import { NextResponse } from 'next/server';
export async function POST(req){
  const { plan='PRO', tg_id=0 } = await req.json();
  const price = plan==='VIP' ? Number(process.env.NOWPAYMENTS_PRICE_VIP||30) : Number(process.env.NOWPAYMENTS_PRICE_PRO||10);
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if(!apiKey) return NextResponse.json({ ok:false, error:'NOWPAYMENTS_API_KEY missing' }, { status:500 });

  const order_id = `QL7-${plan}-${tg_id}-${Date.now()}`;
  const payload = {
    price_amount: price,
    price_currency: process.env.NOWPAYMENTS_CURRENCY || 'USD',
    order_id,
    order_description: `Quantum L7 ${plan} weekly`,
    success_url: process.env.NOWPAYMENTS_SUCCESS_URL,
    cancel_url: process.env.NOWPAYMENTS_CANCEL_URL,
    ipn_callback_url: process.env.NOWPAYMENTS_CALLBACK
  };

  const r = await fetch('https://api.nowpayments.io/v1/invoice', {
    method:'POST',
    headers:{ 'x-api-key': apiKey, 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok) return NextResponse.json({ ok:false, error:data.message || 'NOW error' }, { status:500 });
  return NextResponse.json({ ok:true, invoice_url: data.invoice_url, invoice_id: data.id });
}
