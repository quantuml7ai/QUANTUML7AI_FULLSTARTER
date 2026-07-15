import { NextResponse } from 'next/server';
import crypto from 'crypto';
export async function POST(req){
  const secret = process.env.NOWPAYMENTS_IPN_SECRET || '';
  const botUrl = process.env.BOT_API_URL;
  const botKey = process.env.BOT_API_KEY;

  const text = await req.text();
  const sig = req.headers.get('x-nowpayments-sig') || '';
  const h = crypto.createHmac('sha512', secret).update(text).digest('hex');
  if (h !== sig) return NextResponse.json({ ok:false, error:'bad signature' }, { status:400 });

  const data = JSON.parse(text);
  const status = String(data.payment_status||'').toLowerCase();
  if (!['paid','confirmed','finished','partially_paid'].includes(status)) return NextResponse.json({ ok:true, skip:true });

  const order = String(data.order_id||'');
  // order format: QL7-PLAN-tgId-timestamp
  const parts = order.split('-');
  const plan = parts[1] || 'PRO';
  const tg_id = Number(parts[2]||0);
  const days = 7;

  if (botUrl && botKey && tg_id){
    await fetch(botUrl,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Api-Key':botKey},
      body: JSON.stringify({ user_id: tg_id, plan, days })
    }).catch(()=>{});
  }
  return NextResponse.json({ ok:true });
}
