export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { listTopics } from '@/lib/forumStore'

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')||1)
    const limit= Math.min(100, Number(searchParams.get('limit')||25))
    const sort = String(searchParams.get('sort')||'new')
    const q    = String(searchParams.get('q')||'')
    const res  = await listTopics({ page, limit, sort, q })
    return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'list_topics_fail' }, { status:500 })
  }
}
