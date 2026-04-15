const profileStyles = String.raw`/* ===== Profile popover: badge + avatar upload (header) ===== */
.profileTopRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin: 4px 0 10px;
}

.profileTopRow .profileBadgeLeft{ min-width:0; }

/* квадратная кнопка справа: по клику — выбор файла; после выбора — превью внутри */
.avaUploadSquare{
  --s: clamp(74px, 14vw, 96px);
  width: var(--s);
  height: var(--s);
  flex: 0 0 auto;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    radial-gradient(120% 120% at 30% 20%, rgba(80,167,255,.20), rgba(0,0,0,0) 60%),
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.06),
    0 10px 26px rgba(0,0,0,.35);
  overflow:hidden;
  display:grid;
  place-items:center;
  padding:0;
  position:relative;
  cursor:pointer;
  user-select:none;
  touch-action:none;
}
.avaUploadSquare:focus-visible{
  outline:none;
  box-shadow:
    0 0 0 2px rgba(80,167,255,.35),
    inset 0 0 0 1px rgba(255,255,255,.06),
    0 10px 26px rgba(0,0,0,.35);
}
.avaUploadSquare::before{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius: 16px;
  pointer-events:none;
  background: conic-gradient(
    from 180deg,
    rgba(80,167,255,0) 0deg,
    rgba(80,167,255,.65) 40deg,
    rgba(80,167,255,0) 95deg,
    rgba(155,91,255,.55) 150deg,
    rgba(80,167,255,0) 240deg,
    rgba(80,167,255,.65) 320deg,
    rgba(80,167,255,0) 360deg
  );
  opacity:.35;
  filter: blur(.2px);
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  -webkit-mask-composite:xor;
  padding:2px;
}

.avaUploadSquareCanvas{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  display:block;
  pointer-events:none;
  /* canvas: внутри рисуем сами, поэтому object-fit НЕ нужен */
  will-change: contents;
}



.avaUploadSquareTxt{
  position:relative;
  z-index:1;
  text-align:center;
  font-size:10px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase;
  opacity:.78;
  line-height:1.2;
  text-shadow: 0 0 12px rgba(80,167,255,.22);
}

.avaUploadSquareBusy{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  font-size:11px;
  letter-spacing:.08em;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(3px);
}

/* Зум-строка: всегда следующей строкой и на всю ширину поповера */
.avaZoomWideRow{
  display:flex;
  align-items:center;
  gap:10px;
  margin: 2px 0 12px;
}
.avaZoomWideRow .avaZoomLbl{
  flex:0 0 auto;
  font-size:11px;
  opacity:.78;
  width:44px;
}

/* cyber range */
.cyberRange{
  -webkit-appearance:none;
  appearance:none;
  width:100%;
  height: 28px;
  background: transparent;
  cursor: pointer;
}
.cyberRange:disabled{ opacity:.45; cursor:not-allowed; }
.cyberRange::-webkit-slider-runnable-track{
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    linear-gradient(90deg, rgba(80,167,255,.45), rgba(155,91,255,.35));
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35), 0 0 18px rgba(80,167,255,.14);
}
.cyberRange::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width: 18px;
  height: 18px;
  margin-top: -6px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.22);
  background:
    radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.40), rgba(255,255,255,.08) 60%),
    linear-gradient(180deg, rgba(80,167,255,.55), rgba(155,91,255,.35));
  box-shadow:
    0 0 0 3px rgba(80,167,255,.12),
    0 10px 20px rgba(0,0,0,.35);
}
.cyberRange::-moz-range-track{
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: linear-gradient(90deg, rgba(80,167,255,.45), rgba(155,91,255,.35));
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35), 0 0 18px rgba(80,167,255,.14);
}
.cyberRange::-moz-range-thumb{
  width: 18px;
  height: 18px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.22);
  background: radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.40), rgba(255,255,255,.08) 60%),
              linear-gradient(180deg, rgba(80,167,255,.55), rgba(155,91,255,.35));
  box-shadow: 0 0 0 3px rgba(80,167,255,.12), 0 10px 20px rgba(0,0,0,.35);
}

.avaFileInput{ display:none; }

.avaUploadMini{
  --u:44px;
  width:var(--u);
  height:var(--u);
  border-radius:12px;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(8,10,16,.72);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 10px 22px rgba(0,0,0,.35);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  cursor:pointer;
  overflow:hidden;
}

.avaUploadMiniTxt{
  font-size:10px;
  font-weight:900;
  letter-spacing:.14em;
  opacity:.65;
  display:flex;
  flex-direction:column;
  gap:3px;
  text-transform:uppercase;
}

.avaUploadMiniImg{
  width:100%;
  height:100%;
  object-fit:cover;
}
/* NOTE: duplicate legacy rule removed (was breaking layout with display:absolute) */

/* 1) Контейнер: ничего не меняем кроме обрезки и контекста позиционирования */
.avaBig,
.avaMini{
  overflow: hidden;         /* чтобы лишнее обрезалось по рамке */
  position: relative;       /* нужно, чтобы next/image не «убежал» */
}
/* pencil overlay on avabig */
.avaEditPencil{
  position:absolute;
  right:6px;
  bottom:6px;
  width:16px;
  height:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
  opacity:.95;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.65));
}
.avaEditPencil svg{ display:block; }
/* 2) Обычные <img>/<video>/<canvas>/<svg> внутри — растянуть и покрыть */
.avaBig :is(img, video, canvas, svg),
.avaMini :is(img, video, canvas, svg){
  width: 100%;
  height: 100%;
  object-fit: cover;        /* заполняем без «писем» */
  object-position: center;
  display: block;
  border-radius: inherit;   /* скругление как у контейнера */
}

/* 3) Если используется next/image (img позиционируется абсолютно внутри span) */
.avaBig :is(span, div) > img,
.avaMini :is(span, div) > img{
  inset: 0 !important;      /* растягиваем во весь контейнер */
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
}

/* 4) На всякий случай растянем сам обёрточный span next/image */
.avaBig :is(span, div):has(> img),
.avaMini :is(span, div):has(> img){
  position: absolute;       /* заполняет всю кнопку */
  inset: 0;
}
.avaCropStage{
  position:absolute;
  inset:0;
  transform-origin:center;
  will-change:transform;
}
.avaCropImg{
  width:100%;
  height:100%;
  object-fit:contain;
  pointer-events:none;
  display:block;
}

/* ====== НОВОЕ: правый блок управления в хедере ====== */
.controls{
  margin-left:auto;
  display:flex; align-items:center; gap:6px;
  flex-wrap: nowrap;            /* в†ђ РљРќРћРџРљР РќР• РџР•Р Р•РќРћРЎРЇРўРЎРЇ */
  flex: 1 1 auto;
  min-width: 0;                 /* ← можно ужиматься */
  max-width: 100%;
  order: 3;
}

.aboutRail{
  position: relative;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  gap:8px;
  flex: 1 1 260px;
  min-width: 220px;
  max-width: 100%;
  min-height: 96px;
  padding: 8px 12px 6px;
  background: transparent;
  border: none;
  cursor: pointer;
}
.aboutRail.is-editing{ cursor: default; }
.aboutRailContent{
  min-height: 20px;
}
.aboutText{
  font-size: .98rem;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: normal;
}
.aboutText--placeholder{
  color: rgba(255,255,255,.45);
}
.aboutText--live{
  background: linear-gradient(120deg, #00f6ff, #7b61ff, #ff4fd8, #ff9a3d, #7bffb4, #2b7fff);
  background-size: 320% 320%;
  animation: aboutFlow 9s linear infinite;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.aboutTextarea{
  width: 100%;
  background: transparent;
  border: none;
  color: #eaf4ff;
  font-size: .98rem;
  line-height: 1.35;
  resize: none;
  overflow: hidden;
  padding: 0;
}
.aboutTextarea:focus{ outline: none; }
.aboutActions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}
.aboutLimit{
  font-size: .72rem;
  opacity: .6;
}
.aboutButtons{
  display:flex;
  align-items:center;
  gap:8px;
}
.aboutActionBtn{
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(12,16,24,.35);
  color: #eaf4ff;
  display:grid;
  place-items:center;
  transition: transform .08s, box-shadow .2s, opacity .2s;
}
.aboutActionBtn:hover{
  box-shadow: 0 0 16px rgba(80,167,255,.25);
}
.aboutActionBtn:active{ transform: scale(.97); }
.aboutActionBtn:disabled{
  opacity: .4;
  cursor: not-allowed;
  box-shadow: none;
}
.aboutRailLine{
  position: relative;
  height: 2px;
  width: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,255,255,.18), rgba(255,255,255,.45), rgba(255,255,255,.18));
  overflow: visible;
  isolation: isolate;
  clip-path: inset(-12px 0 -12px 0);
}
.aboutRailPencil{
  position:absolute;
  right: 1px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,.9);
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.5));
}
.aboutRailPencil svg{
  display: block;
}
.aboutRailPencil path{
  stroke: #fff;
}
@keyframes aboutFlow{
  0%{ background-position: 0% 50%; }
  100%{ background-position: 200% 50%; }
}
@media (prefers-reduced-motion: reduce){
  .aboutText--live{ animation: none; }
}

@media (max-width: 900px){
  .aboutRail{
    flex-basis: 100%;
    min-height: 74px;
    order: 2;
    padding: 6px 10px 6px;
  }
  .aboutText,
  .aboutTextarea{ font-size: .92rem; }
  .aboutActions{ flex-wrap: wrap; }
  .aboutLimit{ order: 2; }
}

/* Поиск встроен в .controls и сжимается по ширине на узких экранах */
.search{
  position:relative;
  display:flex; align-items:center; gap:8px;
  z-index:60; overflow:visible;
  flex: 1 1 auto;               /* ← поле поиска резиновое */
  min-width: 80px;              /* нижняя граница на очень узких экранах */
}
.searchInputWrap{
  position:relative;
  flex: 1 1 auto;
  min-width:0;
}

/* инпут занимает всё оставшееся место и ужимается первым */
.searchInput{
  width:100%;
  flex: 1 1 auto; min-width: 60px; max-width:100%;
  height:40px; border-radius:12px; padding:.55rem .9rem;
  background:#0b1018; color:var(--ink); border:1px solid rgba(255,255,255,.16);
}


/* кнопки/чипы — фикс. ширина, не сжимаются и не переносятся */
.iconBtn,
.sortWrap,
.adminWrap,
.adminBtn{ flex:0 0 auto; }

.iconBtn{ width:40px; height:40px; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:transparent; display:grid; place-items:center; transition:transform .08s, box-shadow .2s }
.iconBtn:hover{ box-shadow:0 0 18px rgba(80,167,255,.25) } .iconBtn:active{ transform:scale(.96) }

.searchDrop{
  position:absolute;
  top:calc(100% + 6px);
   left:0;
   right:auto;
   /* НЕ привязываем к ширине инпута: делаем адаптивно */
   inline-size:clamp(250px, 92vw, 560px);
   /* и не даём вылезти за экран */
   max-inline-size:calc(100vw - 24px);
   box-sizing:border-box;

  max-height:520px;
  overflow:auto;
  border:1px solid rgba(255,255,255,.14);
  background:rgba(10,14,20,.98);
  border-radius:12px;
  padding:8px;
  z-index:3000;
}

 /* RTL: дропдаун должен открываться от правого края поиска */
 [dir="rtl"] .searchDrop{
   left:auto;
   right:0;
 }  
.searchResultItem{
  display:flex;
  align-items:flex-start;
  gap:12px;
  padding:14px 14px;
  min-height:72px;
}
.searchResultMedia{
  width:64px; height:64px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.16);
  background: radial-gradient(120% 120% at 10% 0%, rgba(120,200,255,.18), rgba(10,16,30,.9));
  display:inline-flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  flex:0 0 auto;
  position:relative;
}
.searchResultThumb{ width:100%; height:100%; object-fit:cover; display:block; }
.searchResultIcon{ font-size:22px; line-height:1; }
.searchResultPlay{
  position:absolute;
  right:4px;
  bottom:4px;
  font-size:10px;
  line-height:1;
  padding:2px 4px;
  border-radius:8px;
  background:rgba(0,0,0,.55);
  color:#fff;
}
.searchResultBadge{
  position:absolute;
  right:6px;
  bottom:6px;
  font-size:9px;
  line-height:1;
  padding:2px 6px;
  border-radius:999px;
  background:rgba(0,0,0,.55);
  color:#fff;
  letter-spacing:.4px;
  text-transform:uppercase;
}
.searchResultContent{ min-width:0; display:flex; flex-direction:column; gap:4px; }
.searchResultTitle{
  font-weight:900;
  font-size:1.08rem;
  color:#ffd36a;
  text-shadow:0 2px 12px rgba(255,190,60,.35);
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
  white-space:normal;
  word-break:normal;
  overflow-wrap:break-word;
  text-align:start;
}
.searchResultKind{
  color:#ffcc55;
  font-weight:900;
  letter-spacing:.3px;
}
.searchResultTitleText{
  color:#ffd36a;
}
.searchResultText{
  font-size:.9rem;
  color:rgba(234,244,255,.92);
  white-space:normal;
  word-break:normal;
  overflow-wrap:break-word;
  text-align:start;
}
.searchResultMeta{
  font-size:.78rem;
  color:rgba(234,244,255,.70);
  white-space:normal;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.sortDrop{ position:absolute; top:68px; right:100px; width:120px; border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98); border-radius:12px; padding:6px; z-index:3000 }

.starBtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  
  width:30px;
  height:30px;
  margin-left:6px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.14);
  background:rgba(10,16,28,.25);
}
.dmMiniBtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:30px;
  height:30px;
  margin-left:6px;
  border-radius:10px;
  border:1px solid rgba(140,190,255,.28);
  background:rgba(10,16,28,.18);
  color:rgba(234,244,255,.92);
}
.dmMiniBtn svg{ width:18px; height:18px; }
.starBtn .starPath{
  fill:none;
  stroke:rgba(255,255,255,.75);
  stroke-width:1.8;
  stroke-linejoin:round;
}
.starBtn.on{
  border-color:rgba(255,215,90,.55);
  background:rgba(255,215,90,.12);
}
.starBtn.on .starPath{
  fill:rgba(255,215,90,.95);
  stroke:rgba(255,215,90,.95);
}
.starBtn.dis{ opacity:.45; pointer-events:none; }

.subsCounter{

  position:relative;
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 50px;
  margin-left:0px;
  border-radius:999px;
  border:1px solid rgba(255,215,90,.22);
  background:rgba(10,16,28,.25);
  white-space:nowrap;
  overflow:hidden;
}
.subsCounter .subsRing{
  position:absolute;
  inset:-2px;
  border-radius:999px;
  pointer-events:none;
  background:conic-gradient(
    from 180deg,
    rgba(255,215,90,0) 0deg,
    rgba(255,215,90,.85) 40deg,
    rgba(255,215,90,0) 90deg,
    rgba(255,215,90,.55) 140deg,
    rgba(255,215,90,0) 220deg,
    rgba(255,215,90,.85) 290deg,
    rgba(255,215,90,0) 360deg
  );
  filter:blur(.2px);
  opacity:.75;
  animation:subsRingSpin 2.6s linear infinite;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  -webkit-mask-composite:xor;
  padding:2px;
}
@keyframes subsRingSpin{ to{ transform:rotate(360deg); } }

.subsCounter.noAuth{
  border-color:rgba(255,80,80,.35);
  animation:subsNoAuthPulse 1.2s ease-in-out infinite;
}
@keyframes subsNoAuthPulse{
  0%,100%{ box-shadow:0 0 0 0 rgba(255,80,80,.0); }
  50%{ box-shadow:0 0 0 6px rgba(255,80,80,.12); }
}

.subsCounter .subsStar{ color:rgba(255,215,90,.98); font-size:16px; line-height:1; position:relative; z-index:1; }
.subsCounter .subsValue{ font-variant-numeric:tabular-nums; font-size:12px; position:relative; z-index:1; }

@media (max-width:520px){
  .subsCounter{ margin-left:0; margin-top:8px; }
  .qRowRight{ flex-wrap:wrap; }
}
.subsCounter.noAuth{
  border-color:rgba(255,70,70,.55);
  box-shadow:0 0 0 0 rgba(255,70,70,.35);
  animation:subsPulse 1.2s infinite;
}
.subsCounter.noAuth .starDot{ color:rgba(255,70,70,.95); }

@keyframes subsPulse{
  0%{ box-shadow:0 0 0 0 rgba(255,70,70,.35); }
  70%{ box-shadow:0 0 0 10px rgba(255,70,70,0); }
  100%{ box-shadow:0 0 0 0 rgba(255,70,70,0); }
}

.starModeIcon{ color:rgba(255,215,90,.95); }
.starModeOn{ border-color:rgba(255,215,90,.55) !important; }

.starModeBtn{
  width:44px;
  height:44px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.14);
  background:rgba(10,16,28,.25);
}
.starModeBtn .starPath{ fill:none; stroke:rgba(255,215,90,.8); stroke-width:1.8; stroke-linejoin:round; }
.starModeBtn.on{ border-color:rgba(255,215,90,.55); box-shadow:0 0 0 3px rgba(255,215,90,.08); }

.starModeBtn.on .starPath{ fill:rgba(255,215,90,.95); stroke:rgba(255,215,90,.95); }
    .adminWrap{ position:relative; flex:0 0 auto } /* справа от поиска, в рамках .controls */
    .adminBtn{ border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.55rem .8rem; font-weight:700; letter-spacing:.4px }
    .adminOff{ background:rgba(255,90,90,.10); border-color:rgba(255,120,120,.45); color:#ffb1a1 }
    .adminOn{ background:rgba(70,210,120,.12); border-color:rgba(110,240,170,.45); color:#baf7d6 }
 
    .qft_toast_wrap{ position:fixed; right:16px; bottom:16px; z-index:4000 }
    .qft_toast{ max-width:min(420px,90vw); padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(10,14,22,.94); color:#eaf4ff; box-shadow:0 10px 28px rgba(0,0,0,.45) }
    .qft_toast.ok{ border-color:rgba(70,220,130,.5) } .qft_toast.warn{ border-color:rgba(255,200,80,.5) } .qft_toast.err{ border-color:rgba(255,90,90,.5) }

    /* мини-поповеры */
    .adminPop{
      position:absolute; width: min(62vw, 360px);
      border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98);
      border-radius:12px; padding:10px; z-index:3200; box-shadow:0 10px 30px rgba(0,0,0,.45)
     }
    .reportPopover{
      position:sticky;
      min-width:200px;
      padding:10px;
      border-radius:14px;
      border:1px solid rgba(80,167,255,.35);
      background:rgba(8,14,24,.9);
      box-shadow:0 12px 32px rgba(0,0,0,.45), 0 0 24px rgba(80,167,255,.14);
      z-index:3600;
      backdrop-filter: blur(12px) saturate(140%);
    }
    .reportTitle{
      font-weight:600;
      font-size:14px;
      opacity:.95;
      padding:6px 8px;
      color:#eaf4ff;
    }
    .reportDivider{
      height:1px;
      width:100%;
      margin:6px 0 8px;
      background:linear-gradient(90deg, rgba(80,167,255,.05), rgba(80,167,255,.5), rgba(80,167,255,.05));
      box-shadow:0 0 10px rgba(80,167,255,.18);
    }   
    .reportItem{
      display:flex;
      align-items:center;
      gap:8px;
      width:100%;
      text-align:left;
      padding:8px 10px;
      border-radius:10px;
      background:transparent;
      border:1px solid transparent;
      color:#eaf4ff;
      font-size:13px;
    }
    .reportItem:hover{
      background:rgba(255,255,255,.08);
      border-color:rgba(80,167,255,.3);
    }
    .reportItem:active{ transform: scale(.99); }
    .reportItem:disabled{
      opacity:.5;
      cursor:not-allowed;
      box-shadow:none;
    }
    .reportPopover[data-dir="rtl"]{
      direction:rtl;
    }
    .reportPopover[data-dir="rtl"] .reportItem{
      text-align:right;
    }      

    .deeplinkBanner{
      position:fixed;
      left:50%;
      top:12px;
      transform:translateX(-50%);
      z-index:2147482400;
      padding:10px 12px;
      border-radius:14px;
      border:1px solid rgba(80,167,255,.28);
      background:rgba(8,14,24,.88);
      color:#eaf4ff;
      box-shadow:0 10px 28px rgba(0,0,0,.45);
      backdrop-filter: blur(12px) saturate(140%);
      max-width:min(520px, 92vw);
      font-size:13px;
      text-align:center;
    }

    /* Share post */
    .shareBtn{ min-width:44px; }
    .shareOverlay{
      position:fixed;
      inset:0;
      z-index:2147482500;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:16px;
      background:rgba(0,0,0,.45);
      backdrop-filter: blur(6px);
    }
    .sharePopover{
      width:min(520px, 92vw);
      max-height:min(78vh, 520px);
      overflow:auto;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
      border-radius:16px;
      padding:14px;
      border:1px solid transparent;
      background:
        radial-gradient(120% 140% at 12% 0%, rgba(120,200,255,.22), rgba(10,16,28,.86) 55%),
        linear-gradient(140deg, rgba(8,14,24,.92), rgba(12,20,32,.96)) padding-box,
        linear-gradient(
          90deg,
          rgba(0,255,255,.75),
          rgba(120,80,255,.90),
          rgba(255,215,90,.80),
          rgba(0,255,255,.75)
        ) border-box;
      background-size: auto, auto, 320% 100%;
      background-position: 0 0, 0 0, 0% 50%;
      animation: shareBorderFlow 7.5s linear infinite;
      box-shadow:
        0 18px 54px rgba(0,0,0,.62),
        0 0 46px rgba(80,167,255,.22),
        inset 0 0 0 1px rgba(255,255,255,.06);
      backdrop-filter: blur(16px) saturate(140%);
      position:relative;
    }
    @keyframes shareBorderFlow{
      0%{ background-position: 0 0, 0 0, 0% 50%; }
      100%{ background-position: 0 0, 0 0, 100% 50%; }
    }
    .sharePopover::after{
      content:'';
      position:absolute;
      inset:0;
      border-radius:16px;
      pointer-events:none;
      opacity:.22;
      background:
        radial-gradient(120% 120% at 10% 0%, rgba(120,190,255,.18), rgba(0,0,0,0) 60%),
        repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, rgba(255,255,255,0) 1px 10px);
      mix-blend-mode: screen;
      animation: sharePulse 4.2s ease-in-out infinite;
    }
    @keyframes sharePulse{
      0%,100%{ opacity:.16; }
      50%{ opacity:.28; }
    }
    @media (prefers-reduced-motion: reduce){
      .sharePopover{ animation:none; }
      .sharePopover::after{ animation:none; }
    }
    .shareHead{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:4px 2px 10px;
      position:relative;
      z-index:1;
    }
    .shareTitle{ font-weight:700; font-size:15px; color:#eaf4ff; }
    .shareClose{
      width:36px;
      height:36px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(10,16,28,.25);
      color:#eaf4ff;
    }
    .shareClose:hover{ background:rgba(255,255,255,.06); }
    .shareClose:active{ transform:scale(.98); }
    .shareClose:focus-visible{ outline:2px solid rgba(120,180,255,.55); outline-offset:2px; }

    .shareGrid{
      display:grid;
      gap:10px;
      grid-template-columns:repeat(6, minmax(0,1fr));
      position:relative;
      z-index:1;
    }
    @media (max-width:480px){
      .shareGrid{ grid-template-columns:repeat(2, minmax(0,1fr)); }
    }
    @media (min-width:481px) and (max-width:860px){
      .shareGrid{ grid-template-columns:repeat(3, minmax(0,1fr)); }
    }
    .shareTarget{
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:6px;
      padding:10px 8px;
      border-radius:14px;
      border:1px solid transparent;
      background:
        linear-gradient(180deg, rgba(18,26,46,.72), rgba(8,14,24,.28)) padding-box,
        linear-gradient(90deg, rgba(0,255,255,.55), rgba(120,80,255,.70), rgba(255,215,90,.55), rgba(0,255,255,.55)) border-box;
      background-size: auto, 260% 100%;
      background-position: 0 0, 0% 50%;
      animation: shareBtnFlow 6.2s linear infinite;
      color:#eaf4ff;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
      position:relative;
      overflow:hidden;
    }
    .shareTarget:hover{
      filter:brightness(1.08) saturate(1.08);
      box-shadow:
        0 0 0 1px rgba(140,190,255,.28),
        0 0 18px rgba(80,167,255,.18);
    }
    .shareTarget:active{ transform:scale(.99); }
    .shareTarget:focus-visible{ outline:2px solid rgba(120,180,255,.55); outline-offset:2px; }
    @keyframes shareBtnFlow{
      0%{ background-position: 0 0, 0% 50%; }
      100%{ background-position: 0 0, 100% 50%; }
    }
    @media (prefers-reduced-motion: reduce){
      .shareTarget{ animation:none; }
    }
    .shareIcon{
      width:40px;
      height:40px;
      display:grid;
      place-items:center;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.10);
      background:
        radial-gradient(circle at 30% 20%, rgba(0,255,255,.18), rgba(0,0,0,0) 55%),
        linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.04),
        0 0 18px rgba(80,167,255,.12);
    }
    .shareLabel{
      font-size:12px;
      opacity:.95;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width:100%;
    }
    .shareCopyBlock{
      margin-top:12px;
      padding-top:12px;
      border-top:1px solid rgba(255,255,255,.10);
      position:relative;
      z-index:1;
    }
    .shareCopyRow{ display:flex; gap:8px; align-items:center; }
    .shareUrlInput{
      flex:1 1 auto;
      min-width:0;
      height:40px;
      border-radius:12px;
      padding:0 10px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(10,16,28,.18);
      color:#eaf4ff;
      font-size:12px;
    }
    .shareUrlInput:focus{
      outline:none;
      border-color:rgba(120,180,255,.45);
      box-shadow:0 0 0 3px rgba(120,180,255,.12);
    }
    .shareHint{ margin-top:8px; font-size:12px; opacity:.85; }
    .shareCopyBtn{
      height:40px;
      border-radius:12px;
      border:1px solid rgba(140,190,255,.22);
      background:rgba(10,16,28,.18);
      color:#eaf4ff;
      padding:0 12px;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
      transition: filter .14s ease, transform .12s ease, background .18s ease, border-color .18s ease;
    }
    .shareCopyBtn:hover{
      filter:brightness(1.08) saturate(1.08);
      box-shadow: 0 0 20px rgba(80,167,255,.16), inset 0 0 0 1px rgba(255,255,255,.06);
    }
    .shareCopyBtn:active{ transform:scale(.99); }
    .shareCopyBtn.copied{
      border-color:rgba(70,220,130,.55) !important;
      background:linear-gradient(120deg, rgba(12,30,18,.75), rgba(70,210,120,.18)) !important;
      color:#baf7d6 !important;
      box-shadow: 0 0 26px rgba(70,220,130,.18), inset 0 0 0 1px rgba(255,255,255,.06);
    }
    .lockable{ position:relative; }
    .lockBadge{
      position:absolute;
      left:-7px;
      top:-4px;
      width:16px;
      height:16px;
      border-radius:999px;
      background:rgba(10,14,22,.9);
      border:1px solid rgba(255,255,255,.35);
      display:grid;
      place-items:center;
      font-size:10px;
      line-height:1;
      box-shadow:0 0 10px rgba(80,167,255,.2);
      pointer-events:none;
    }
    .iconBtn.isLocked{
      opacity:.55;
      cursor:not-allowed;
      border-color:rgba(255,255,255,.12);
      box-shadow:none;
    }
    .profilePop{

      position:absolute; width: min(75vw, 500px);
      border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.98);
      border-radius:12px; padding:10px; z-index:3200; box-shadow:0 10px 30px rgba(0,0,0,.45)
    }
    .userInfoPopover{
      position:fixed;
      width:min(78vw, 380px);
      border:1px solid rgba(120,170,255,.35);
      background:
        radial-gradient(circle at top, rgba(120,180,255,.18), rgba(10,16,28,.82) 55%),
        linear-gradient(140deg, rgba(8,14,24,.86), rgba(12,20,32,.95));
      border-radius:16px;
      padding:14px;
      z-index:2147483000;
      box-shadow:0 16px 40px rgba(0,0,0,.55), 0 0 28px rgba(80,167,255,.18);
      backdrop-filter: blur(16px) saturate(140%);
    }
    .userInfoBioRow{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:8px;
    }
    .userInfoDmBtn{
      width:46px; height:46px;
      border-radius:999px;
      display:inline-flex; align-items:center; justify-content:center;
      position:relative;
      border:1px solid rgba(140,190,255,.45);
      background:linear-gradient(120deg, rgba(12,20,34,.7), rgba(60,120,255,.18));
      color:#eaf4ff;
      box-shadow:0 0 22px rgba(80,167,255,.35), inset 0 0 10px rgba(120,180,255,.15);
      transition: transform .12s ease, filter .14s ease, box-shadow .18s ease;
      animation: dmBeacon 2.8s ease-in-out infinite;
    }
    .userInfoDmBtn::before{
      content:'';
      position:absolute; inset:-6px;
      border-radius:999px;
      background:radial-gradient(circle, rgba(120,190,255,.35), transparent 65%);
      opacity:.6;
      pointer-events:none;
      animation: dmBeacon 2.8s ease-in-out infinite;
    }
    .userInfoDmBtn svg{ width:24px; height:24px; }
    .userInfoDmBtn:hover{ filter:brightness(1.08) saturate(1.1); }
    .userInfoDmBtn:active{ transform:translateY(1px) scale(.98); }
    @keyframes dmBeacon{
      0%,100%{ transform:scale(1); filter:brightness(1); opacity:.9; }
      50%{ transform:scale(1.04); filter:brightness(1.15); opacity:1; }
    }
    .userInfoTranslateToggle{
      border:1px solid rgba(140,170,255,.35);
      background:linear-gradient(120deg, rgba(10,18,32,.55), rgba(60,120,255,.18));
      color:#e6f0ff;
      padding:6px 12px;
      border-radius:999px;
      font-size:12px;
      line-height:1;
      white-space:nowrap;
      display:inline-flex;
      align-items:center;
      gap:6px;
      box-shadow:0 0 18px rgba(80,167,255,.12);      
    }
    .userInfoTranslateToggle[disabled]{
      opacity:.6;
      cursor:default;
      box-shadow:none;      
    }
    .userInfoBioText{
      font-size:13px;
      line-height:1.45;
      color:#eaf4ff;
      white-space:pre-wrap;
    }
    .userInfoTranslateShimmer{
      width:10px;
      height:10px;
      border-radius:999px;
      background:linear-gradient(120deg, rgba(120,180,255,.2), rgba(255,255,255,.7), rgba(120,180,255,.2));
      background-size:200% 100%;
      animation: shimmer 1.4s linear infinite;
    }
    .userInfoRail{
      height:1px;
      width:100%;
      margin:10px 0 8px;
      background:linear-gradient(90deg, rgba(120,180,255,.08), rgba(120,180,255,.6), rgba(120,180,255,.08));
      box-shadow:0 0 16px rgba(120,180,255,.18);
    }      
    .userInfoStats{
      display:grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap:8px;
      margin-top:12px;
    }
    .userInfoStat{
      display:flex;
      flex-direction:column;
      gap:4px;
      padding:8px 10px;
      border-radius:10px;
      border:1px solid rgba(140,170,255,.22);
      background:rgba(10,16,28,.35);
    }
    .userInfoStatLabel{
      font-size:11px;
      color:rgba(200,220,255,.7);
      display:flex;
      align-items:center;
      gap:6px;      
    }
    .userInfoStatValue{
      font-weight:700;
      font-size:15px;
      color:#eaf4ff;
    }
    .userInfoStarBadge{
 
      position:relative;
      width:100%;
      height:26px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border-radius:999px;
      border:1px solid rgba(0, 217, 255, 0);      
  background:conic-gradient(
    from 180deg,
    rgb(90, 255, 255) 0deg,
    rgba(0, 178, 248, 0.53) 40deg,
    rgba(217, 90, 255, 0.18) 90deg,
    rgba(90, 255, 233, 0.92) 140deg,
    rgba(90, 230, 255, 0.56) 220deg,
    rgba(190, 67, 238, 0.23) 290deg,
    rgba(0, 247, 255, 0.84) 360deg
  );      
      // background:rgba(27, 78, 99, 0.45);
      overflow:hidden;
    }
    .userInfoStarBadge .subsRing{
      inset:-4px;
      opacity:.9;    
      animation-duration:3.4s;
    }
    .userInfoStarBadge .subsStar{
      font-size:22px;
      color:rgb(255, 208, 0);
    }      
    .userInfoSkeleton{
      height:12px;
      border-radius:999px;
      background:linear-gradient(90deg, rgba(140,170,255,.08), rgba(140,170,255,.22), rgba(140,170,255,.08));
      background-size:200% 100%;
      animation: shimmer 1.6s linear infinite;
    }    
    .srOnly{
      position:absolute !important;
      height:1px;
      width:1px;
      overflow:hidden;
      clip:rect(1px,1px,1px,1px);
      white-space:nowrap;
    }       
    .profileList{ max-height:260px; overflow:auto; padding:4px; border:1px solid rgba(255,255,255,.08); border-radius:10px; background:rgba(255,255,255,.03) }

    /* ===== Avatar Upload UI (ProfilePopover) ===== */
    .profileAvatarHead{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:6px;
    }

    .avaUploadCard{
      flex:0 0 auto;
      display:flex;
      align-items:center;
      justify-content:flex-end;
    }

    .avaUploadBtn{
      width:96px;
      height:34px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(10,16,28,.25);
      color:#eaf4ff;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:0;
      line-height:1;
      cursor:pointer;
      user-select:none;
    }
    .avaUploadLabel{ font-weight:900; letter-spacing:.12em; font-size:11px; opacity:.95; }
    .avaUploadSub{ font-size:10px; opacity:.65; margin-top:2px; }
    @media (hover:hover){
      .avaUploadBtn:hover{ transform:translateY(-1px); filter:saturate(1.15); }
      .avaUploadBtn:active{ transform:translateY(0); }
    }

    .avaCropPanel{
      margin:6px 0 10px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(255,255,255,.03);
      border-radius:12px;
      padding:10px;
      display:grid;
      grid-template-columns: 120px 1fr;
      gap:10px;
      align-items:stretch;
    }

    .avaCropBox{
      width:120px;
      height:120px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(0,0,0,.35);
      overflow:hidden;
      position:relative;
      touch-action:none;
    }

    .avaCropImg{
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      transform-origin:center center;
      width:auto;
      height:auto;
      max-width:none;
      max-height:none;
      user-select:none;
      pointer-events:none;
    }

    .avaCropHint{
      position:absolute;
      left:8px;
      bottom:8px;
      font-size:10px;
      padding:4px 6px;
      border-radius:10px;
      background:rgba(0,0,0,.35);
      border:1px solid rgba(255,255,255,.10);
      color:rgba(240,248,255,.85);
    }

    .avaCropRight{ display:flex; flex-direction:column; gap:8px; min-width:0; }
    .avaCropMeta{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
    .avaCropName{ font-weight:800; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .avaCropDims{ font-size:11px; opacity:.7; flex:0 0 auto; }

    .avaZoomRow{
      display:flex;
      align-items:center;
      gap:10px;
    }
    .avaZoomTxt{ font-size:11px; opacity:.8; width:44px; }
    .avaZoomRow input[type="range"]{ width:100%; }

    .avaCropBtns{ display:flex; gap:8px; justify-content:flex-end; }

    /* На мобиле делаем превью “выше/ниже”, как ты просил */
    @media (max-width:520px){
      .avaUploadBtn{ width:86px; height:32px; border-radius:12px; }
      .avaCropPanel{
        grid-template-columns: 1fr;
      }
      .avaCropBox{
        width:100%;
        height:140px;   /* чуть выше на мобиле */
      }
    }
/* Вьюпорты: переносим ВЕСЬ ряд под аватар, но внутри — одна строка */
@media (max-width:860px){
  .controls{
    order:3;
    flex:0 0 100%;
    min-width:100%;
    display:flex;
    align-items:center;
    gap:6px;
    flex-wrap:nowrap;         /* в†ђ РќР• РџР•Р Р•РќРћРЎРРўРЎРЇ Р’РќРЈРўР Р */
  }
  .search{ flex:1 1 0; min-width:120px } /* сжимается первой */
}

/* Уже уже: ещё сильнее ужимаем поиск, кнопки остаются */
@media (max-width:560px){
  .head{ padding:10px }
  .controls{
    order:3;
    flex:0 0 100%;
    min-width:100%;
    flex-wrap:nowrap;         /* ← всё ещё одна линия */
  }
  .search{ flex:1 1 0; min-width:90px }
  .iconBtn{ width:36px; height:36px }
}

/* Совсем узко: минимальный допуск для поиска */
@media (max-width:420px){
  .search{ flex:1 1 0; min-width:70px }
}
/* === VIP styles (кнопка + поповер) === */
.iconBtn.vip { border-color: rgba(255,215,0,.55); color:#ffd700; box-shadow:0 0 14px rgba(255,215,0,.25) }
.iconBtn.vipGray { opacity:.85 }
.vipWrap { position:relative }
.forumVipControlBtn{
  position: relative;
  min-width: 74px;
  padding-inline: 12px;
  overflow: hidden;
  isolation: isolate;
  border-color: rgba(160,190,220,.34);
  background:
    radial-gradient(120% 140% at 20% 20%, rgba(255,255,255,.14), rgba(255,255,255,0) 44%),
    linear-gradient(180deg, rgba(9,16,28,.94), rgba(6,12,22,.98));
  box-shadow:
    0 0 14px rgba(80,167,255,.16),
    inset 0 0 16px rgba(120,200,255,.08);
}
.forumVipControlBtn::before,
.forumVipControlBtn::after{
  content:'';
  position:absolute;
  pointer-events:none;
}
.forumVipControlBtn::before{
  inset:-30%;
  border-radius:inherit;
  z-index:0;
}
.forumVipControlBtn::after{
  top:-120%;
  left:-42%;
  width:38%;
  height:320%;
  z-index:1;
  transform: rotate(20deg);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.88), transparent);
}
.forumVipControlBtn.is-vip-invite{
  border-color: rgba(120,190,255,.46);
  box-shadow:
    0 0 18px rgba(80,167,255,.22),
    inset 0 0 18px rgba(120,200,255,.10);
}
.forumVipControlBtn.is-vip-invite::before{
  background:
    radial-gradient(circle at 28% 28%, rgba(255,255,255,.16), transparent 20%),
    radial-gradient(circle at 72% 74%, rgba(70,190,255,.26), transparent 26%),
    radial-gradient(circle, rgba(255,213,112,.16), rgba(255,213,112,0) 62%);
  animation: vipInviteAura 3.2s ease-in-out infinite;
}
.forumVipControlBtn.is-vip-invite::after{
  opacity:.76;
  animation: vipInviteSweep 2.8s linear infinite;
}
.forumVipControlBtn.is-vip-active{
  border-color: rgba(255,215,90,.88);
  background:
    radial-gradient(120% 150% at 20% 18%, rgba(255,255,255,.18), rgba(255,255,255,0) 42%),
    linear-gradient(180deg, rgba(58,38,0,.94), rgba(26,18,0,.98));
  box-shadow:
    0 0 22px rgba(255,215,90,.34),
    inset 0 0 18px rgba(255,225,130,.18),
    0 0 0 1px rgba(255,240,180,.08);
}
.forumVipControlBtn.is-vip-active::before{
  background:
    radial-gradient(circle at 26% 28%, rgba(255,255,255,.22), transparent 20%),
    radial-gradient(circle at 78% 74%, rgba(255,228,140,.30), transparent 28%),
    radial-gradient(circle, rgba(255,215,90,.18), rgba(255,215,90,0) 62%);
  animation: vipActiveAura 2.6s ease-in-out infinite;
}
.forumVipControlBtn.is-vip-active::after{
  opacity:.94;
  animation: vipActiveSweep 2.15s linear infinite;
}
.forumVipControlText{
  position:relative;
  z-index:2;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:40px;
  font-weight: 900;
  letter-spacing:.08em;
  text-align:center;
  text-transform: uppercase;
  line-height:1;
  transition: transform .2s ease, filter .2s ease;
}
.forumVipControlBtn.is-vip-invite .forumVipControlText{
  background: linear-gradient(120deg, #f7fbff 0%, #caecff 28%, #ffeaa6 58%, #ffffff 100%);
  background-size:220% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  animation: vipInviteTextPulse 2.8s ease-in-out infinite, vipInviteTextShine 4.6s linear infinite;
}
.forumVipControlBtn.is-vip-active .forumVipControlText{
  background: linear-gradient(135deg, #7a5c00 0%, #ffd700 18%, #fff6c5 34%, #ffd700 50%, #ffef9a 68%, #7a5c00 100%);
  background-size:220% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  text-shadow: 0 0 12px rgba(255,225,130,.38);
  animation: vipActiveTextGlow 1.9s ease-in-out infinite, vipInviteTextShine 4.2s linear infinite;
}
@keyframes vipInviteAura{
  0%,100%{ transform: scale(.92); opacity:.52; filter: saturate(1); }
  50%{ transform: scale(1.04); opacity:.88; filter: saturate(1.15); }
}
@keyframes vipInviteSweep{
  0%{ transform: translateX(-12%) rotate(20deg); }
  100%{ transform: translateX(320%) rotate(20deg); }
}
@keyframes vipActiveAura{
  0%,100%{ transform: scale(.95); opacity:.58; }
  50%{ transform: scale(1.06); opacity:.96; }
}
@keyframes vipActiveSweep{
  0%{ transform: translateX(-12%) rotate(20deg); }
  100%{ transform: translateX(335%) rotate(20deg); }
}
@keyframes vipInviteTextPulse{
  0%,100%{ transform: scale(1); letter-spacing:.08em; filter: brightness(1); }
  50%{ transform: scale(1.05); letter-spacing:.11em; filter: brightness(1.12); }
}
@keyframes vipInviteTextShine{
  0%{ background-position: 0% 50%; }
  100%{ background-position: 220% 50%; }
}
@keyframes vipActiveTextGlow{
  0%,100%{ transform: scale(1); filter: brightness(1); text-shadow: 0 0 10px rgba(255,225,130,.28); }
  50%{ transform: scale(1.03); filter: brightness(1.16); text-shadow: 0 0 16px rgba(255,232,160,.52); }
}

/* вне медиа: фиксируем, что кнопки/чипы не сжимаются */
.iconBtn,
.sortWrap,
.adminWrap,
.adminBtn{ flex:0 0 auto; }
/* в твои глобалы/модуль */
.emojiGrid.vip { outline: 1px dashed rgba(255,215,0,.25); border-radius: 10px; padding: 6px; }
.emojiBtn.vipAnim { will-change: transform; }
.emojiBtn.vipAnim:hover { transform: translateY(-1px) scale(1.02); }

/* лёгкое подпрыгивание на hover */
.hoverPop {
  transition: filter .12s ease, color .12s ease, background-color .12s ease, border-color .12s ease;
  will-change: auto;
}
@media (hover:hover) {
@media (hover:hover) and (pointer:fine){
  .hoverPop:hover{ filter: brightness(1.06); }
}
.hoverPop:active{ filter: brightness(0.98); }
.hoverPop:focus-visible{
  outline: 2px solid rgba(120, 200, 255, .55);
  outline-offset: 2px;
}
  .hoverPop:active {
    transform: translateY(0) scale(0.98);
  }
}
.vipEmojiIcon { display:block; width:100%; height:100%; object-fit:cover; }
.emojiBtn { position: relative; }
.vipLock { position:absolute; right:-4px; top:-4px; font-size:12px; pointer-events:none; }
.vipComposerPreview{ margin-top:6px; }
:root{ --vip-emoji-size:48px; }
.vipEmojiBig{ display:inline-block; vertical-align:middle; }
.vipComposerPreview{ margin-top:6px; }
:root{ --vip-emoji-size:48px; --vip-emoji-size-sm:32px; }
.vipEmojiBig{ display:inline-block; vertical-align:middle; }
@media (max-width:480px){
  .vipEmojiBig{ width:var(--vip-emoji-size-sm); height:var(--vip-emoji-size-sm); }
}
/* Крупный аккуратный бейдж ника (единый для всех) */
.nick-badge{
  display:inline-flex;
  align-items:center;
  padding:.3rem .6rem;
  border:2px solid transparent;
  border-radius:12px;
  background:
    linear-gradient(#0b1220,#0b1220) padding-box,
    linear-gradient(135deg,#5b9dff,#9b5bff,#ff5bb2) border-box;
  box-shadow:
    0 0 .5rem rgba(91,157,255,.3),
    inset 0 0 .35rem rgba(155,91,255,.18);
  color:#eaf4ff;
  font-weight:800;
  font-size:1.05rem;
  line-height:1;
}
.nick-text{
  max-width:22ch;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:ellipsis;
}
@media (max-width:640px){
  .nick-text{ max-width:16ch; }
}
/* --- VIP badge над ником (20s / 5s) ---
   Настройка позиционирования/размера:
   --vip-badge-w, --vip-badge-h  (размер)
   --vip-badge-gap              (расстояние между бейджем и ником)
   --vip-badge-shift-x/y        (сдвиг бейджа)
*/
:root{
  --vip-badge-w: clamp(42px, 9vw, 54px);
  --vip-badge-h: clamp(42px, 8.2vw, 58px);
  --vip-badge-gap: 2px;
  --vip-badge-shift-x: 0px;
  --vip-badge-shift-y: 0px;
}

.nick-badge.vipNick{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap: var(--vip-badge-gap);
  line-height: 1.1;
}

.vipFlip{

  position:relative;
  width: var(--vip-badge-w);
  height: var(--vip-badge-h);
  transform: translate(var(--vip-badge-shift-x), var(--vip-badge-shift-y));
}

.vipFlipImg{
 
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
  will-change: opacity;
}

/* общий цикл 25s: 1.png видно 0..20s (80%), 2.png видно 20..25s (20%) */
@keyframes vipFlipA{
  0%, 79.99% { opacity: 1; }
  80%, 100%  { opacity: 0; }
}
@keyframes vipFlipB{
  0%, 79.99% { opacity: 0; }
  80%, 100%  { opacity: 1; }
}
.vipFlipImg.vip1{ animation: vipFlipA 25s infinite linear; }
.vipFlipImg.vip2{ animation: vipFlipB 25s infinite linear; }

@media (prefers-reduced-motion: reduce){
  .vipFlipImg.vip1, .vipFlipImg.vip2{ animation:none; }
  .vipFlipImg.vip2{ opacity:0; }
}


/* ====== РђРќРРњРђР¦РРЇ РќРРљРђ ====== */
.nick-animate{
  position: relative;
  /* бегущий градиент по рамке */
  background:
    linear-gradient(#0b1220,#0b1220) padding-box,
    linear-gradient(135deg,#5b9dff,#9b5bff,#ff5bb2,#5b9dff) border-box;
  background-size: 200% 200%, 300% 300%;
  animation: nickGradient 6s linear infinite, nickGlow 2.2s ease-in-out infinite;
}

/* мягкое свечение */
@keyframes nickGlow{
  0%,100%{ box-shadow: 0 0 .5rem rgba(91,157,255,.28), inset 0 0 .35rem rgba(155,91,255,.16) }
  50%   { box-shadow: 0 0 1.15rem rgba(91,157,255,.55), inset 0 0 .55rem rgba(155,91,255,.28) }
}

/* движение градиента рамки */
@keyframes nickGradient{
  0%   { background-position: 0% 0%, 0% 50% }
  100%{ background-position: 200% 200%, 300% 50% }
}

/* уважение к reduced motion */
@media (prefers-reduced-motion: reduce){
  .nick-animate{ animation: none }
}
    /* === char counters === */
    .charRow{
      display:flex; align-items:center; gap:6px;
      margin-top:6px; font-size:.82rem; opacity:.9;
    }
    .charNow{ font-weight:800; letter-spacing:.2px }
    .charSep{ opacity:.6 }
    .charMax{ opacity:.7 }
    .charOver{ color:#ffb1a1; text-shadow:0 0 12px rgba(255,90,90,.25) }
/* --- lockable attach button --- */
.lockable{ position:relative }
.lockable[data-locked="true"]{ opacity:.6; cursor:not-allowed; }
.lockable[data-locked="true"] .clipSvg{ filter:grayscale(1); opacity:.8 }
.lockBadge{
  position:absolute; right:-6px; top:0px;
  font-size:14px; line-height:1;
  background:rgba(15, 25, 45, 0); border:1px solid rgba(255, 140, 140, 0);
  border-radius:8px; padding:2px 4px;
  box-shadow:0 0 10px rgba(90, 120, 255, 0);
}
/* галерея изображений в посте */
.postGallery{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-top:8px }
.postGallery .thumb{ position:relative; padding:0; border:0; background:transparent; border-radius:8px; overflow:hidden; outline:1px solid rgba(140,170,255,.25) }
.postGallery img{ width:100%; height:100%; object-fit:cover; display:block; aspect-ratio:1 / 1; }

/* лайтбокс */
.lightbox{
  position:fixed; inset:0; background:rgba(8,12,22,.9);
  display:flex; align-items:center; justify-content:center; z-index:1000;
}
.lightbox img{ max-width:96vw; max-height:92vh; border-radius:10px; outline:1px solid rgba(160,180,255,.25) }
.lightbox .nav{
  position:fixed; top:50%; transform:translateY(-50%);
  background:rgba(20,30,55,.7); border:1px solid rgba(160,180,255,.4);
  color:#eaf4ff; font-size:28px; line-height:1; padding:8px 12px; border-radius:10px;
}
.lightbox .prev{ left:16px }
.lightbox .next{ right:16px }
/* локализация только внутри строки композера */
.forumComposer .attachPreviewRow{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 0 0 8px !important;
}

.forumComposer .attachPreviewItem{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.forumComposer .attachPreviewItem img{
  display: block;
}

/* cерость могла приходить от глобальных стилей button */
.forumComposer .attachPreviewRow button{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0;
}

/* а для крестика задаём свой тёмный кружок отдельно */
.forumComposer .attachPreviewRemove{
  position: absolute;
  top: -6px; right: -6px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,.6) !important;
  color: #fff;
  line-height: 18px;
  font-size: 12px;
  cursor: pointer;
}

`;

export default profileStyles

