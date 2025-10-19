export const runtime = 'nodejs'
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  const keys = [
    'NOWPAYMENTS_API_KEY',
    'NOWPAY_API_KEY',
    'NOWPAYMENTS_IPN_SECRET',
    'APP_URL',
    'PLAN_PRICE_USD',
    'PLAN_DAYS',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]
  const visible = Object.fromEntries(keys.map(k => [k, !!process.env[k]]))
  const meta = {
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    node: process.version,
  }
  return new Response(JSON.stringify({ visible, meta }, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
