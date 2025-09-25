// app/api/forum/me/route.js
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getMe } from '@/lib/forumStore'

export async function GET(){
  try{
    const me = await getMe({ cookies: cookies(), headers: headers() })
    return NextResponse.json({ ok:true, ...me }, { headers:{ 'cache-control':'no-store' }})
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'me_fail' }, { status:500 })
  }
}
