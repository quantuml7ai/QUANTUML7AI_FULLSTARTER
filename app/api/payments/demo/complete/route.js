import { NextResponse } from 'next/server';
export async function POST(req){
  const body = await req.json();
  const plan = (body.plan||'pro').toUpperCase();
  const tg_id = Number(body.tg_id||0);
  const days = 7;
  const url = process.env.BOT_API_URL;
  const key = process.env.BOT_API_KEY;
  if(!url || !key) return NextResponse.json({ok:false,error:'BOT_API not configured'},{status:500});
  const r = await fetch(url,{ method:'POST', headers:{'Content-Type':'application/json','X-Api-Key':key}, body: JSON.stringify({ user_id: tg_id, plan, days }) });
  const data = await r.json().catch(()=>({}));
  return NextResponse.json({ ok:true, forwarded:data });
}
