// app/subscribe/page.js
import NextDynamic from 'next/dynamic'   // <- переименовали импорт, чтобы не конфликтовало с export const dynamic

export const dynamic = 'force-dynamic'
export const revalidate = 0

// грузим содержимое только на клиенте — SSR выключен
const SubscribeClient = NextDynamic(() => import('./subscribe.client'), { ssr: false })

export default function Page() {
  return <SubscribeClient />
}
