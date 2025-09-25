// app/api/forum/view/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { addView } from '@/lib/forumStore'   // ← было viewTopic

export async function POST(req){
  try{
    const { topicId } = await req.json().catch(()=>({}))
    if (!topicId) return NextResponse.json({ ok:false, error:'bad-request' }, { status:400 })
    const r = await addView({ topicId })
    return NextResponse.json(r)
  }catch(e){
    return NextResponse.json({ ok:false, error:'server' }, { status:500 })
  }
}
