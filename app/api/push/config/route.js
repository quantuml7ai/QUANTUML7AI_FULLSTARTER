import { getPublicVapidKey } from '../../../../lib/webPush.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const publicKey = getPublicVapidKey()
  return Response.json(
    { ok: !!publicKey, publicKey },
    { headers: { 'cache-control': 'private, no-store, max-age=0' } },
  )
}
