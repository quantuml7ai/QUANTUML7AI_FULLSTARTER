import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'
import BgAudio from '../components/BgAudio' // ⬅️ фоновая музыка

// ⬇️ исключаем серверный рендер именно этого компонента
const HeroAvatar = dynamic(() => import('../components/HeroAvatar'), { ssr: false })

export const metadata = {
  title: 'Quantum L7 AI',
  description: 'Next-gen AI with deep crypto integrations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <HeroAvatar />
          <div className="page-content">
            <TopBar />
            {children}
          </div>
          {/* Фоновая музыка (играет по кругу, включается по клику если автоплей заблокирован) */}
          <BgAudio src="/audio/cosmic.mp3" defaultVolume={0.35} />
        </I18nProvider>
      </body>
    </html>
  )
}
