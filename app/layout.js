import './globals.css';
import HeroAvatar from '../components/HeroAvatar';
import { I18nProvider } from '../components/i18n';
import TopBar from '../components/TopBar';

export const metadata = {
  title: 'Quantum L7 AI',
  description: 'Cosmic intelligence for analytics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <I18nProvider>
          <HeroAvatar videoSrc="/avatar.mp4" poster="/avatar.jpg" opacity={0.85} />
          <div className="page-content">
            <TopBar />
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
