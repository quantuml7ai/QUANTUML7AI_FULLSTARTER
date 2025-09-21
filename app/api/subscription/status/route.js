import { NextResponse } from 'next/server'
import { getVip } from '../../../../lib/subscriptions'

export async function POST(req) {
  try {
    const { accountId } = await req.json() || {}
    if (!accountId) return NextResponse.json({ error:'NO_ACCOUNT' }, { status: 400 })
    const s = getVip(accountId)
    return NextResponse.json(s)
  } catch (e) {
    return NextResponse.json({ error:String(e) }, { status: 500 })
  }
}
