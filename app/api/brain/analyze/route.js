import { NextResponse } from 'next/server'
import { analyzeAiBoxMarket } from '../../../../lib/exchange/aiBoxAnalysisService.js'

async function respond(params={}){
  const result=await analyzeAiBoxMarket(params)
  return NextResponse.json(result)
}

export async function GET(req){
  try{
    const {searchParams}=new URL(req.url)
    return await respond({symbol:searchParams.get('symbol'),tf:searchParams.get('tf'),limit:searchParams.get('limit'),limitMain:searchParams.get('limitMain'),primary:searchParams.get('primary')})
  }catch(error){
    console.error('[api/brain/analyze][GET] error:',error)
    return NextResponse.json({ok:false,error:'brain_failed',message:error?.message||'Brain analyze error'},{status:500})
  }
}

export async function POST(req){
  try{
    const body=await req.json().catch(()=>({}))
    return await respond({symbol:body.symbol,tf:body.tf,limit:body.limit,limitMain:body.limitMain,primary:body.primary})
  }catch(error){
    console.error('[api/brain/analyze][POST] error:',error)
    return NextResponse.json({ok:false,error:'brain_failed',message:error?.message||'Brain analyze error'},{status:500})
  }
}
