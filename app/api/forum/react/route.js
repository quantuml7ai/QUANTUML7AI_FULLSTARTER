export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getMe, reactPost } from '@/lib/forumStore'

export async function POST(req){
  try{
    const body = await req.json().catch(()=> ({}))
    const me = await getMe({ cookies: cookies(), headers: headers() })
    if (!me.asherId || me.banned) return NextResponse.json({ ok:false, error:'auth_required' }, { status: 401 })

    const { target, id, reaction, remove=false } = body||{}
    if (target!=='post' || !id || !reaction) return NextResponse.json({ ok:false, error:'bad_payload' }, { status:400 })

    const res = await reactPost({ id:String(id), asherId:me.asherId, emoji:String(reaction), remove: !!remove })
    return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'react_fail' }, { status:500 })
  }
}
