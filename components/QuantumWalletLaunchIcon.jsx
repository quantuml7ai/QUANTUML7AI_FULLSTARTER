export function QuantumWalletLaunchButton({
  onClick,
  title = 'Open Quantum Wallet',
  className = '',
}) {
  const buttonClass = ['ql7WalletLaunchBtn', className].filter(Boolean).join(' ')

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        aria-label={title}
        title={title}
        onClick={onClick}
        data-ql7-wallet-launch="quantum-particle-q-wallet"
      >
        <svg
          className="ql7WalletLaunchSvg"
          viewBox="0 0 100 40"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="ql7WalletFrameGradient" x1="0" y1="0" x2="100" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#54dfff" stopOpacity=".72" />
              <stop offset=".48" stopColor="#ffffff" stopOpacity=".18" />
              <stop offset="1" stopColor="#f8c94f" stopOpacity=".72" />
            </linearGradient>
            <linearGradient id="ql7WalletGoldGradient" x1="10" y1="8" x2="38" y2="31" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff4b0" />
              <stop offset=".38" stopColor="#ffd85a" />
              <stop offset=".72" stopColor="#e6a821" />
              <stop offset="1" stopColor="#8d5910" />
            </linearGradient>
            <linearGradient id="ql7WalletWhiteGradient" x1="38" y1="0" x2="91" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".56" stopColor="#edfaff" />
              <stop offset="1" stopColor="#bfeeff" />
            </linearGradient>
            <linearGradient id="ql7WalletShineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset=".48" stopColor="#ffffff" stopOpacity=".95" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="ql7WalletGoldGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#ffd44d" floodOpacity=".95" />
              <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#f4a91f" floodOpacity=".58" />
            </filter>
            <filter id="ql7WalletWhiteGlow" x="-40%" y="-100%" width="180%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.1" floodColor="#ffffff" floodOpacity=".75" />
              <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#63d8ff" floodOpacity=".36" />
            </filter>
            <clipPath id="ql7WalletWordClip">
              <rect className="ql7WalletWordClipRect" x="37" y="8" width="56" height="25" rx="3" />
            </clipPath>
          </defs>

          <rect className="ql7WalletFrame" x=".75" y=".75" width="98.5" height="38.5" rx="12" />
          <rect className="ql7WalletFrameInner" x="4" y="4" width="92" height="32" rx="9" />
          <path className="ql7WalletCircuit ql7WalletCircuit--top" d="M8 10h12l4-4h15M66 6h17l4 4h5" />
          <path className="ql7WalletCircuit ql7WalletCircuit--bottom" d="M8 30h15l4 4h38l4-4h23" />
          <path className="ql7WalletScanLine" d="M8 20h84" />

          <g className="ql7WalletQuantumParticles" aria-hidden="true">
            <circle className="ql7WalletParticle ql7WalletParticle--1" cx="9" cy="8" r="1.15" />
            <circle className="ql7WalletParticle ql7WalletParticle--2" cx="17" cy="5.5" r=".9" />
            <circle className="ql7WalletParticle ql7WalletParticle--3" cx="27" cy="6.5" r="1.1" />
            <circle className="ql7WalletParticle ql7WalletParticle--4" cx="36" cy="11" r=".8" />
            <circle className="ql7WalletParticle ql7WalletParticle--5" cx="39" cy="20" r="1.05" />
            <circle className="ql7WalletParticle ql7WalletParticle--6" cx="35" cy="30" r=".9" />
            <circle className="ql7WalletParticle ql7WalletParticle--7" cx="26" cy="34" r="1.1" />
            <circle className="ql7WalletParticle ql7WalletParticle--8" cx="15" cy="33" r=".85" />
            <circle className="ql7WalletParticle ql7WalletParticle--9" cx="8" cy="27" r="1" />
            <circle className="ql7WalletParticle ql7WalletParticle--10" cx="5" cy="18" r=".8" />
            <circle className="ql7WalletParticle ql7WalletParticle--11" cx="13" cy="14" r=".72" />
            <circle className="ql7WalletParticle ql7WalletParticle--12" cx="31" cy="24" r=".74" />
          </g>

          <g className="ql7WalletLogoGroup">
            <g className="ql7WalletQGroup" filter="url(#ql7WalletGoldGlow)">
              <circle className="ql7WalletQHalo" cx="23.5" cy="20" r="13.6" />
              <text className="ql7WalletQGlyph" x="23.5" y="27.3" textAnchor="middle">Q</text>
              <path className="ql7WalletQTail" d="M28.2 25.1l5.3 5" />
            </g>

            <g className="ql7WalletWordGroup" clipPath="url(#ql7WalletWordClip)" filter="url(#ql7WalletWhiteGlow)">
              <text className="ql7WalletWord" x="38" y="25.7">Wallet</text>
            </g>

            <rect className="ql7WalletShine" x="-14" y="5" width="10" height="30" rx="5" fill="url(#ql7WalletShineGradient)" />
          </g>

          <g className="ql7WalletBurstParticles" aria-hidden="true">
            <circle className="ql7WalletBurst ql7WalletBurst--1" cx="24" cy="20" r="1" />
            <circle className="ql7WalletBurst ql7WalletBurst--2" cx="34" cy="18" r=".8" />
            <circle className="ql7WalletBurst ql7WalletBurst--3" cx="45" cy="22" r=".9" />
            <circle className="ql7WalletBurst ql7WalletBurst--4" cx="57" cy="18" r=".75" />
            <circle className="ql7WalletBurst ql7WalletBurst--5" cx="68" cy="22" r=".9" />
            <circle className="ql7WalletBurst ql7WalletBurst--6" cx="80" cy="18" r=".8" />
            <circle className="ql7WalletBurst ql7WalletBurst--7" cx="89" cy="22" r=".75" />
          </g>
        </svg>
      </button>

      <style jsx global>{`
        .ql7WalletLaunchBtn{
          position:relative;
          isolation:isolate;
          overflow:hidden;
          flex:0 1 90px;
          width:90px;
          min-width:74px;
          height:53px;
          padding:0;
          margin:0;
          border:0;
          border-radius:13px;
          display:inline-grid;
          place-items:center;
          color:#fff;
          background:
            radial-gradient(circle at 20% 22%,rgba(255,208,74,.14),transparent 36%),
            radial-gradient(circle at 84% 78%,rgba(75,178,255,.15),transparent 38%),
            linear-gradient(135deg,rgba(3,9,20,.98),rgba(5,17,34,.96) 56%,rgba(4,10,22,.99));
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.035),
            inset 0 0 16px rgba(75,187,255,.07),
            0 8px 20px rgba(0,0,0,.28),
            0 0 18px rgba(48,202,255,.12),
            0 0 16px rgba(255,199,62,.06);
          cursor:pointer;
          -webkit-user-select:none;
          user-select:none;
          -webkit-tap-highlight-color:transparent;
          transition:transform .15s ease,border-color .2s ease,box-shadow .2s ease,filter .2s ease;
        }
        .ql7WalletLaunchBtn:hover{
          transform:translateY(-1px);
          border-color:rgba(113,230,255,.68);
          filter:brightness(1.07) saturate(1.05);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.05),
            inset 0 0 18px rgba(75,187,255,.11),
            0 10px 23px rgba(0,0,0,.32),
            0 0 24px rgba(48,202,255,.20),
            0 0 21px rgba(255,199,62,.11);
        }
        .ql7WalletLaunchBtn:active{transform:translateY(0) scale(.985);}
        .ql7WalletLaunchBtn:focus-visible{
          outline:none;
          box-shadow:
            0 0 0 2px rgba(2,9,20,.96),
            0 0 0 4px rgba(103,226,255,.74),
            0 0 26px rgba(255,207,73,.15);
        }
        .ql7WalletLaunchSvg{
          display:block;
          width:100%;
          height:100%;
          overflow:visible;
        }
        .ql7WalletFrame{
          fill:rgba(4,10,23,.72);
          stroke:url(#ql7WalletFrameGradient);
          stroke-width:1;
          animation:ql7WalletFrameBreathe 5.8s ease-in-out infinite;
        }
        .ql7WalletFrameInner{
          fill:rgba(7,17,33,.70);
          stroke:rgba(255,255,255,.04);
          stroke-width:.7;
        }
        .ql7WalletCircuit,
        .ql7WalletScanLine,
        .ql7WalletQTail{
          fill:none;
          stroke-linecap:round;
          stroke-linejoin:round;
        }
        .ql7WalletCircuit{
          stroke:#64dcff;
          stroke-width:.8;
          stroke-dasharray:7 7;
          opacity:.32;
          animation:ql7WalletCircuitFlow 5.8s linear infinite;
        }
        .ql7WalletCircuit--bottom{
          stroke:#f6c64c;
          opacity:.25;
          animation-direction:reverse;
        }
        .ql7WalletScanLine{
          stroke:#dffaff;
          stroke-width:.8;
          stroke-dasharray:8 88;
          opacity:.54;
          animation:ql7WalletScan 5.8s ease-in-out infinite;
        }
        .ql7WalletParticle{
          fill:#ffd75a;
          opacity:0;
          transform-box:fill-box;
          transform-origin:center;
          filter:drop-shadow(0 0 3px rgba(255,210,70,.85));
          animation:ql7WalletParticleGather 5.8s cubic-bezier(.2,.78,.22,1) infinite;
        }
        .ql7WalletParticle--1{--px:14px;--py:12px;animation-delay:0s;}
        .ql7WalletParticle--2{--px:7px;--py:14.5px;animation-delay:.04s;}
        .ql7WalletParticle--3{--px:-3px;--py:13.5px;animation-delay:.08s;}
        .ql7WalletParticle--4{--px:-12px;--py:9px;animation-delay:.12s;}
        .ql7WalletParticle--5{--px:-15px;--py:0px;animation-delay:.16s;}
        .ql7WalletParticle--6{--px:-11px;--py:-10px;animation-delay:.20s;}
        .ql7WalletParticle--7{--px:-2px;--py:-14px;animation-delay:.24s;}
        .ql7WalletParticle--8{--px:9px;--py:-13px;animation-delay:.28s;}
        .ql7WalletParticle--9{--px:16px;--py:-7px;animation-delay:.32s;}
        .ql7WalletParticle--10{--px:19px;--py:2px;animation-delay:.36s;}
        .ql7WalletParticle--11{--px:11px;--py:6px;animation-delay:.10s;}
        .ql7WalletParticle--12{--px:-7px;--py:-4px;animation-delay:.18s;}
        .ql7WalletLogoGroup{
          transform-box:fill-box;
          transform-origin:center;
          animation:ql7WalletLogoCycle 5.8s ease-in-out infinite;
        }
        .ql7WalletQGroup{
          opacity:0;
          transform-box:fill-box;
          transform-origin:center;
          animation:ql7WalletQAssemble 5.8s cubic-bezier(.2,.8,.2,1) infinite;
        }
        .ql7WalletQHalo{
          fill:rgba(255,205,66,.055);
          stroke:rgba(255,215,86,.38);
          stroke-width:.8;
          stroke-dasharray:2 3;
          animation:ql7WalletQHaloSpin 5.8s linear infinite;
          transform-origin:23.5px 20px;
        }
        .ql7WalletQGlyph{
          fill:url(#ql7WalletGoldGradient);
          font-family:Arial,Helvetica,sans-serif;
          font-size:21px;
          font-weight:900;
          letter-spacing:-.05em;
          paint-order:stroke fill;
          stroke:rgba(65,39,4,.9);
          stroke-width:.85px;
        }
        .ql7WalletQTail{
          stroke:#ffd85a;
          stroke-width:1.3;
        }
        .ql7WalletWordClipRect{
          animation:ql7WalletWordClip 5.8s cubic-bezier(.18,.78,.22,1) infinite;
        }
        .ql7WalletWordGroup{
          opacity:0;
          animation:ql7WalletWordFade 5.8s ease-in-out infinite;
        }
        .ql7WalletWord{
          fill:url(#ql7WalletWhiteGradient);
          font-family:Arial,Helvetica,sans-serif;
          font-size:15.2px;
          font-weight:800;
          letter-spacing:-.02em;
          paint-order:stroke fill;
          stroke:rgba(0,8,18,.94);
          stroke-width:1.15px;
        }
        .ql7WalletShine{
          opacity:0;
          transform:translateX(0) skewX(-15deg);
          filter:blur(.35px);
          animation:ql7WalletShineRun 5.8s ease-in-out infinite;
        }
        .ql7WalletBurst{
          fill:#ffd75a;
          opacity:0;
          transform-box:fill-box;
          transform-origin:center;
          filter:drop-shadow(0 0 3px rgba(255,210,70,.8));
          animation:ql7WalletBurstOut 5.8s ease-out infinite;
        }
        .ql7WalletBurst--1{--bx:-20px;--by:-12px;}
        .ql7WalletBurst--2{--bx:-12px;--by:14px;animation-delay:.03s;}
        .ql7WalletBurst--3{--bx:-3px;--by:-15px;animation-delay:.06s;}
        .ql7WalletBurst--4{--bx:8px;--by:14px;animation-delay:.09s;}
        .ql7WalletBurst--5{--bx:18px;--by:-13px;animation-delay:.12s;}
        .ql7WalletBurst--6{--bx:25px;--by:11px;animation-delay:.15s;}
        .ql7WalletBurst--7{--bx:32px;--by:-8px;animation-delay:.18s;}
        @keyframes ql7WalletParticleGather{
          0%,4%{opacity:0;transform:translate(0,0) scale(.45);}
          8%{opacity:1;}
          22%{opacity:.95;transform:translate(var(--px),var(--py)) scale(1);}
          29%,100%{opacity:0;transform:translate(var(--px),var(--py)) scale(.2);}
        }
        @keyframes ql7WalletQAssemble{
          0%,16%{opacity:0;transform:scale(.68) rotate(-10deg);}
          25%,71%{opacity:1;transform:scale(1) rotate(0);}
          78%{opacity:1;transform:scale(1.03);}
          88%,100%{opacity:0;transform:scale(.78) rotate(6deg);}
        }
        @keyframes ql7WalletWordClip{
          0%,27%{width:0;}
          45%,79%{width:56px;}
          88%,100%{width:0;}
        }
        @keyframes ql7WalletWordFade{
          0%,26%{opacity:0;transform:translateX(-4px);}
          35%,79%{opacity:1;transform:translateX(0);}
          88%,100%{opacity:0;transform:translateX(5px);}
        }
        @keyframes ql7WalletShineRun{
          0%,48%{opacity:0;transform:translateX(0) skewX(-15deg);}
          55%{opacity:.9;}
          68%{opacity:.12;transform:translateX(110px) skewX(-15deg);}
          69%,100%{opacity:0;transform:translateX(110px) skewX(-15deg);}
        }
        @keyframes ql7WalletLogoCycle{
          0%,78%{opacity:1;filter:none;}
          86%{opacity:.9;filter:blur(.2px);}
          94%,100%{opacity:0;filter:blur(1px);}
        }
        @keyframes ql7WalletBurstOut{
          0%,79%{opacity:0;transform:translate(0,0) scale(.35);}
          84%{opacity:1;transform:translate(0,0) scale(1);}
          100%{opacity:0;transform:translate(var(--bx),var(--by)) scale(.25);}
        }
        @keyframes ql7WalletQHaloSpin{
          to{transform:rotate(360deg);}
        }
        @keyframes ql7WalletCircuitFlow{
          to{stroke-dashoffset:-40;}
        }
        @keyframes ql7WalletScan{
          0%,8%{stroke-dashoffset:94;opacity:0;}
          18%,74%{opacity:.56;}
          84%,100%{stroke-dashoffset:-12;opacity:0;}
        }
        @keyframes ql7WalletFrameBreathe{
          0%,100%{stroke-opacity:.55;}
          48%{stroke-opacity:.95;}
        }
        @media (max-width:560px){
          .ql7WalletLaunchBtn{
            flex-basis:80px;
            width:80px;
            min-width:80px;
            height:45px;
            border-radius:12px;
          }
          .ql7WalletWord{font-size:14.2px;}
        }
        @media (prefers-reduced-motion:reduce){
          .ql7WalletFrame,
          .ql7WalletCircuit,
          .ql7WalletScanLine,
          .ql7WalletParticle,
          .ql7WalletLogoGroup,
          .ql7WalletQGroup,
          .ql7WalletQHalo,
          .ql7WalletWordClipRect,
          .ql7WalletWordGroup,
          .ql7WalletShine,
          .ql7WalletBurst{
            animation:none !important;
          }
          .ql7WalletParticle,
          .ql7WalletBurst,
          .ql7WalletShine{opacity:0;}
          .ql7WalletQGroup,
          .ql7WalletWordGroup{opacity:1;transform:none;}
          .ql7WalletWordClipRect{width:56px;}
        }
      `}</style>
    </>
  )
}

export default function QuantumWalletLaunchIcon({
  t,
  questBtnClass,
}) {
  const openQuantumWallet = () => {
    try {
      window.dispatchEvent(new CustomEvent('quantum-wallet:open'))
    } catch {}
  }

  const title = t?.('quantum_wallet_open_aria') || t?.('quest_open') || 'Open Quantum Wallet'

  return (
    <QuantumWalletLaunchButton
      onClick={openQuantumWallet}
      title={title}
      className={questBtnClass || ''}
    />
  )
}
