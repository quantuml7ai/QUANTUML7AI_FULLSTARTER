export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getMe, createTopic } from '@/lib/forumStore'

export async function POST(req){
  try{
    const body = await req.json().catch(()=> ({}))
    const me = await getMe({ cookies: cookies(), headers: headers() })
    if (!me.asherId || me.banned) return NextResponse.json({ ok:false, error:'auth_required' }, { status: 401 })

    const { title, category='', tags=[], text='' } = body || {}
    if (!title || !String(title).trim()) return NextResponse.json({ ok:false, error:'bad_title' }, { status:400 })

    const res = await createTopic({ title, category, tags, text, userName: me.accountId || 'user', asherId: me.asherId })
    return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'create_topic_fail' }, { status:500 })
  }
}
