// components/HeroAvatar.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const TICKERS = [
  'BTC','ETH','SOL','BNB','XRP','ADA','DOGE','TRX','TON','AVAX',
  'DOT','LINK','LTC','BCH','XLM','NEAR','HBAR','ICP','ARB','OP',
  'MATIC','APT','SUI','FIL','RNDR','INJ','AAVE','UNI','MKR','CAKE'
];

const rnd = (a, b) => a + Math.random() * (b - a);

export default function HeroAvatar({ videoSrc='/avatar.mp4', poster='/avatar.jpg', opacity=0.8 }) {
  const density = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const w = window.innerWidth;
    if (w < 480) return 0.5;
    if (w < 900) return 0.8;
    return 1;
  }, []);

  const [items, setItems] = useState([]);
  useEffect(() => {
    let killed = false;
    const spawnEvery = 900 / density;
    const tick = () => {
      if (killed) return;
      setItems(prev => {
        const id    = Math.random().toString(36).slice(2);
        const txt   = TICKERS[(Math.random()*TICKERS.length)|0];
        const left  = rnd(6, 94);
        const dur   = rnd(14, 24);
        const sz    = rnd(0.9, 1.5);
        const drift = rnd(-40, 40);
        const next  = [...prev, { id, txt, left, dur, sz, drift }];
        return next.slice(-Math.round(24 * density));
      });
      setTimeout(tick, spawnEvery);
    };
    tick();
    return () => { killed = true; };
  }, [density]);

  const wrapRef = useRef(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.setProperty('--parx', String(x));
      el.style.setProperty('--pary', String(y));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={wrapRef} className="scene">
      <video className="bg-video" src={videoSrc} {...(poster?{poster}:{})} autoPlay loop muted playsInline style={{opacity}} />
      <div className="stars" />
      <div className="tickers">
        {items.map(i => (
          <div key={i.id} className="ticker"
               style={{left:`${i.left}vw`, animationDuration:`${i.dur}s`,
                       fontSize:`calc(${i.sz}rem + 0.6vw)`, transform:`translateX(${i.drift}px)`}}>
            {i.txt}
          </div>
        ))}
      </div>
      <div className="glow eye left" />
      <div className="glow eye right" />
      <div className="glow chest" />
    </div>
  );
}
