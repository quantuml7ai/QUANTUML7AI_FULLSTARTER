const composerStyles = String.raw`/* ---- ATTACH (скрепка) — стиль как у voiceBtn ---- */
.attachBtn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  /* единый размер; можно переопределить через inline style: '--attach-size':'56px' */
  --attach-size: 48px;
  width: var(--attach-size); height: var(--attach-size);
  border:0; background:transparent; color:#cfe0ff;
  cursor:pointer; transition: transform .12s ease, filter .18s ease;
}
.attachBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.attachBtn:active{ transform:translateY(1px) scale(.98); }

/* состояние «замок» */
.attachBtn[data-locked="true"]{ opacity:.55; cursor:not-allowed; filter:saturate(.6); }

/* авто-масштаб иконки под размер кнопки */
.attachBtn svg{ width:calc(var(--attach-size)*.46); height:calc(var(--attach-size)*.46); }

/* бейдж-замок, как у микрофона */
.attachBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:none; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
  pointer-events:none; z-index:2;
}
.attachBtn[data-locked="true"] .lockBadge{ display:inline-flex; }
.input.ok  { outline:2px solid rgba(80,220,140,.9); box-shadow:0 0 12px rgba(80,220,140,.25); }
.input.bad { outline:2px solid rgba(255,110,110,.95); box-shadow:0 0 12px rgba(255,110,110,.25); }

/* Q COIN: золотой мигающий бейдж ×2 справа от лейбла */
.qcoinLabel{
  display:inline-flex; align-items:center; gap:8px;
}
.qcoinX2{
  display:inline-flex; align-items:center; justify-content:center;
  min-width: 48px; height: 28px; padding: 0 6px;
  border-radius: 999px;
  font: 700 16px/1.1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
  letter-spacing: .5px;
  color:#211;             /* тёмный текст не нужен — делаем «свечение» текста */
  background: linear-gradient(180deg,#ffde6a,#ffbc3d);
  box-shadow:
     0 0 12px rgba(255,210,90,.45),
     inset 0 0 0 1px rgba(255,255,255,.25),
     0 1px 0 0 rgba(0,0,0,.35);
  color: #1a1200;
  text-shadow: 0 0 8px rgba(255,220,120,.65);
  position: relative;
  overflow: hidden;
  animation: qcoinX2Pulse 1.6s ease-in-out infinite;
}
  /* Базовый вид .qcoinX2 уже есть */

/* Активный VIP — золотой с переливом (повторяем эффекты заголовка) */
.qcoinX2.vip{
  background:
    linear-gradient(135deg,
      #7a5c00 0%, #ffd700 18%, #fff4b3 32%, #ffd700 46%,
      #ffea80 60%, #b38400 74%, #ffd700 88%, #7a5c00 100%);
  background-size:200% 100%;
  color:#1a1000;
  border:1px solid rgba(255,215,0,.45);
  box-shadow:0 0 18px rgba(255,215,0,.25);
  animation:qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
  cursor:default;
}

/* Не VIP — заметно мигает красным и кликабельно */
.qcoinX2.needVip{
  background:rgba(255,70,70,.18);
  color:#fff;
  border:1px solid rgba(255,120,120,.6);
  box-shadow:0 0 12px rgba(255,70,70,.35);
  animation:blinkPause .9s steps(1) infinite;
  cursor:pointer;
}

@keyframes qcoinX2Pulse{
  0%,100%{ filter:brightness(1); box-shadow:
     0 0 10px rgba(255,210,90,.3),
     inset 0 0 0 1px rgba(255,255,255,.22),
     0 1px 0 0 rgba(0,0,0,.35); }
  50%{ filter:brightness(1.15); box-shadow:
     0 0 16px rgba(255,210,90,.7),
     inset 0 0 0 1px rgba(255,255,255,.35),
     0 1px 0 0 rgba(0,0,0,.35); }
}
 .qcoinCol{
  flex-direction: column;       /* теперь колонкой */
  align-items: flex-end;        /* выравнивание вправо, как и раньше */
  gap: 18px;                     /* вертикальный зазор между строками */
}
.qcoinTop{
  display: inline-flex;
  align-items: center;
  gap: 20px;                     /* расстояние между Q COIN и ×2 */
}
    
/* Базовая икон-кнопка без фона */
.iconBtn{
  display:inline-flex; align-items:center; justify-content:center;
  width:46px; height:46px;
  border-radius:10px;
  background:transparent;
  color:#cfe0ff;
  border:1px solid transparent;
  transition: transform .12s ease, box-shadow .18s ease, color .12s ease, border-color .18s ease;
  cursor:pointer;
}
.iconBtn.ghost{
  background:transparent;
  border-color: rgba(160,180,255,.12);
}
.iconBtn:hover{
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(80,140,255,.15), inset 0 0 0 1px rgba(255,255,255,.04);
  border-color: rgba(160,180,255,.28);
  color:#eaf4ff;
}
.iconBtn:active{
  transform: translateY(0) scale(.98);
  box-shadow: 0 2px 10px rgba(80,140,255,.12), inset 0 0 0 1px rgba(255,255,255,.03);
}
.iconBtn[disabled], .iconBtn[aria-disabled="true"]{
  opacity:.5; cursor:not-allowed;
  filter:saturate(.6);
}

/* SVG автоподгон */
.iconBtn svg{ display:block; width:30px; height:30px; }
/* встроенный композер */
.forumComposer { position: relative; }
  /* phase accents (кибер-подсветка по этапам) */
  .composerMediaBar[data-phase="moderating"]{ ... }
  .composerMediaBar[data-phase="uploading"]{ ... }
  .composerMediaBar[data-phase="sending"]{ ... }

  /* лёгкий "сканлайн" поверх рельсы */
  .cmbTrack::after{ ... animation: cmbScan ... }

  /* =========================================================
     Composer media progress bar (над контролами)
     - видна от момента выбора/записи до отправки или сброса медиа
     - слева мигает "Loading" (EN)
  ========================================================= */
  .composerMediaBar{
    display:flex;
    align-items:stretch;
    gap:10px;
    margin: 0 0 10px 0;
    padding: 10px 10px;
    border-radius: 12px;
    border: 1px solid rgba(160,180,255,.18);
    background: linear-gradient(180deg, rgba(8,12,20,.55), rgba(10,16,24,.35));
    box-shadow: 0 14px 32px rgba(25,129,255,.10), inset 0 0 0 1px rgba(255,255,255,.03);
    backdrop-filter: blur(10px) saturate(120%);
  }
  .cmbLeft{
    display:flex;
    align-items:center;
    justify-content:center;
    width: 36px;
    padding-left: 18px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(0,0,0,.18);
  }
  /* вместо мигающего текста — «точечное колечко» загрузки */
  .cmbSpinner{
    position: relative;
    width: 22px;
    height: 22px;
  }
  .cmbDot{
    position: absolute;
    top: 50%;

    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: rgba(234,244,255,.88);
    transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translate(9px);
    opacity: 0;
    animation: cmbDotBuild 1.15s linear infinite;
    animation-delay: calc(var(--i) * 0.085s);
  }
  @keyframes cmbDotBuild{
    0%, 12% { opacity: 0; }
    18%, 92% { opacity: 1; }
    100% { opacity: 0; }
  }
  .cmbMain{ flex: 1; min-width: 0; }

  .cmbCancel{
    display:flex;
    align-items:center;
    justify-content:center;
    width: 30px;
    min-width: 30px;
    height: 30px;
    border-radius: 10px;
    border: 1px solid rgba(255, 80, 80, .42);
    background: rgba(255, 40, 40, .14);
    color: rgba(255, 140, 140, .98);
    cursor:pointer;
    transition: transform .12s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
  }
  .cmbCancel:hover{
    transform: translateY(-1px);
    background: rgba(255, 40, 40, .22);
    border-color: rgba(255, 80, 80, .62);
    box-shadow: 0 10px 26px rgba(255, 60, 60, .18);
  }
  .cmbCancel:active{ transform: translateY(0px) scale(.98); }
  .cmbCancel svg{ width: 18px; height: 18px; display:block; }  
  .cmbTop{
    display:flex;
    align-items:baseline;
    justify-content:space-between;
    gap:10px;
    margin-bottom: 6px;
  }
  .cmbPhase{
    font-size: 12px;
    color: rgba(234,244,255,.86);
  }
  .cmbPct{
    font-size: 12px;
    color: rgba(234,244,255,.90);
    font-variant-numeric: tabular-nums;
  }
  .cmbTrack{
    position:relative;
    height: 10px;
    border-radius: 999px;
    overflow:hidden;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.08);
  }
  .cmbFill{
    position:absolute;
    left:0;
    top:0;
    bottom:0;
    width: 0%;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(43,140,255,.75), rgba(122,93,255,.65), rgba(43,140,255,.75));
    box-shadow: 0 0 18px rgba(43,140,255,.24);
    transition: width .22s ease;
  }
  .cmbTicks{
    position:absolute;
    inset:0;
    pointer-events:none;
    background:
      repeating-linear-gradient(
        90deg,
        rgba(255,255,255,.0) 0,
        rgba(255,255,255,.0) 9px,
        rgba(255,255,255,.14) 10px
      );
    mix-blend-mode: overlay;
    opacity: .35;
  }
  /* компактнее на мобилке */
  @media (max-width: 520px){
    .cmbLeft{ width: 72px; }
    .composerMediaBar{ gap:8px; padding:9px 9px; }
  }
.taWrap{
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 14px;
  background: rgba(10,16,24,.55);
  backdrop-filter: blur(8px) saturate(120%);
  border: 1px solid rgba(255,255,255,.08);
  padding: 12px 64px;      /* место под рельсы */
  padding-left: 10px;
  padding-right: 10px;
  min-height: 50px;
}
.taWrap::before,
.taWrap::after{
  content:"";
  position:absolute; top:8px; bottom:8px; width:1px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,.12), transparent);
  pointer-events:none;
}
.taWrap::before{ left:0px; }
.taWrap::after { right:0px; }

.taInput{
  width:100%;
  min-height:10px;
  max-height:240px;
  resize:vertical;
  background:transparent;
  border:0; outline:none;
  color:#eaf1ff; font:inherit; line-height:1.35;
}



/* кнопки-иконки */
.iconBtn{
  position:relative;
  display:inline-flex; align-items:center; justify-content:center;
  width:36px; height:36px; border-radius:10px;
  border:1px solid rgba(160,180,255,.25);
  background: rgba(20,30,55,.55);
  color:#cfe0ff; cursor:pointer;
  transition: transform .12s ease, filter .2s ease, opacity .2s ease;
}
.iconBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn:active{ transform: translateY(1px) scale(.98); }
.iconBtn.ghost{ background:rgba(12,18,28,.35); border-color:rgba(160,180,255,.15); }
.iconBtn.locked{ opacity:.6; cursor:not-allowed; filter:saturate(.75); }
.iconBtn svg{ width:22px; height:22px; }

.iconBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:inline-flex; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  pointer-events:none;
}

/* самолётик */
.planeBtn .plane{ fill:#2b8cff; width:22px; height:22px; }
.planeBtn.disabled .plane{ fill:none; stroke:#6f88b3; stroke-width:1.8; opacity:.7; }

/* микрофон при записи */
.micBtn.rec{
  box-shadow:0 0 0 2px rgba(255,90,90,.9), 0 0 14px 2px rgba(255,90,90,.25);
  color:#ffd1d1;
}
 .questBtn.red{
   background:#ff2340; color:#fff;
   box-shadow:0 0 0 1px rgba(255,0,32,.35) inset, 0 6px 18px -8px rgba(255,0,32,.45);
 }
 .questBtn.green{
   background:#16a34a; color:#fff;
   box-shadow:0 0 0 1px rgba(22,163,74,.35) inset, 0 6px 18px -8px rgba(22,163,74,.45);
 }

 /* Quest vibro button (в поповере QCoin) */
 .questBtn{
   display:inline-flex; align-items:center; gap:8px;
   background:#ff2340; color:#fff; border:0;
   padding:6px 10px; border-radius:10px; font-weight:700;
   box-shadow:0 0 0 1px rgba(255,0,32,.35) inset, 0 6px 18px -8px rgba(255,0,32,.45);
 }
 .questBtn:hover{ filter:brightness(1.05) saturate(1.05); }
 .questBtn:active{ transform:translateY(1px) scale(.98) }
 .questBtn .dot{ width:8px; height:8px; border-radius:50%; background:#fff }
 .questBtn.vibrate{
   animation: quest-vibrate .38s infinite cubic-bezier(.36,.07,.19,.97);
 }
 .questBtn.blink{
   animation: quest-blink 1.1s infinite;
 }
 @keyframes quest-vibrate{
   0% { transform: translate(0); }
   20% { transform: translate(-1px, 1px) rotate(-0.5deg); }
   40% { transform: translate( 1px,-1px) rotate( 0.6deg); }
   60% { transform: translate(-1px, 0px) rotate(-0.4deg); }
   80% { transform: translate( 1px, 1px) rotate( 0.4deg); }
   100%{ transform: translate(0); }
 }
 @keyframes quest-blink{
   0%, 60%, 100% { filter: none; }
   30% { filter: drop-shadow(0 0 10px rgba(255,0,32,.75)); }
 }
`;

export default composerStyles
