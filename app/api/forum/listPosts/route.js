export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { listPosts } from '@/lib/forumStore'

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const topicId = String(searchParams.get('topicId')||'')
    if (!topicId) return NextResponse.json({ ok:false, error:'no_topic' }, { status:400 })
    const page = Number(searchParams.get('page')||1)
    const limit= Math.min(200, Number(searchParams.get('limit')||50))
    const sort = String(searchParams.get('sort')||'new')
    const q    = String(searchParams.get('q')||'')
    const res  = await listPosts({ topicId, page, limit, sort, q })
    return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'list_posts_fail' }, { status:500 })
  }
}
