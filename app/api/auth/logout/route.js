// app/api/auth/logout/route.js
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // снимаем cookie 'sid'
  res.cookies.set('sid', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: true,
    maxAge: 0,
  })
  return res
}
