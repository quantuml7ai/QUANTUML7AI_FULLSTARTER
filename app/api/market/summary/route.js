// ============================================================================
// FILE: app/api/market/summary/route.js  (optional server analysis)
// ============================================================================
import { NextResponse } from 'next/server'
import { fetchKlines } from '../../../../lib/databroker'
import { analyzeTF } from '../../../../lib/brain'

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const tf = searchParams.get('tf') || '1m'
  try{
    const candles = await fetchKlines(tf, 1000)
    const res = analyzeTF(candles)
    return NextResponse.json(res, { headers: { 'Cache-Control':'no-store' }})
  }catch(e){
    return NextResponse.json({ error: 'analysis_failed' }, { status: 500 })
  }
}