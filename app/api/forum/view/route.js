export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getMe, viewTopic } from '@/lib/forumStore'

export async function POST(req){
  try{
    const body = await req.json().catch(()=> ({}))
    const { topicId } = body||{}
    if (!topicId) return NextResponse.json({ ok:false, error:'no_topic' }, { status:400 })
    const me = await getMe({ cookies: cookies(), headers: headers() })
    const ip = headers().get('x-forwarded-for')?.split(',')?.[0] || '0.0.0.0'
    const res = await viewTopic({ topicId:String(topicId), asherId: me.asherId, ip })
    return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'view_fail' }, { status:500 })
  }
}
