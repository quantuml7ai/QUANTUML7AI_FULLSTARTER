import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    // тестовая запись
    await redis.set('test-key', 'hello-from-redis', { ex: 60 })
    // тестовое чтение
    const value = await redis.get('test-key')

    return NextResponse.json({
      ok: true,
      value,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: String(err),
    }, { status: 500 })
  }
}
