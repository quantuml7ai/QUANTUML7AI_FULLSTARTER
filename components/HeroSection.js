// components/HeroSection.js
import HeroAvatar from './HeroAvatar';

export default function HeroSection() {
  return (
    <section className="hero-wrap">
      <div className="hero-sticky">

        <HeroAvatar poster="/avatar.jpg" />
      </div> 
 
    </section>
  );
}
