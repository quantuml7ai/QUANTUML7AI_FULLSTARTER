// components/HeroSection.js
import HeroAvatar from './HeroAvatar';

export default function HeroSection() {
  return (
    <section className="hero-wrap">
      <div className="hero-sticky">
        {/* Видео видно целиком — fit="contain" */}
        <HeroAvatar src="/avatar.mp4" fit="contain" />
      </div>

      {/* Контент поверх */}
      <div className="hero-content panel">
        <h1 style={{ marginTop: 0 }}>Космический интеллект для аналитики</h1>
        <p>Авторизация через криптокошельки и подписки PRO/VIP.</p>
        <p><a className="btn" href="/subscribe">Перейти к подписке</a></p>
      </div>
    </section>
  );
}
