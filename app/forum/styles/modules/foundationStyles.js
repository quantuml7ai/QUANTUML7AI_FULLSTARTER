const foundationStyles = String.raw`
    :root{
      --ink:#eaf4ff;
      --b:rgba(80,167,255,.32);
      /* Telegram Mini App: подними/опусти липкую панель Quantum Messenger */
      --tma-inbox-sticky-top: 45px;
    }
    .forum_root{ color:var(--ink) }
    .glass{ background:rgba(8,13,20,.94); border:1px solid rgba(255,255,255,.10); border-radius:16px; backdrop-filter: blur(12px) }
    .neon{ box-shadow:0 0 28px rgba(25,129,255,.14), inset 0 0 18px rgba(25,129,255,.06) }
    .postBody{ white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word }

    /* === Post message window (rounded frame for post body text) === */
    .postBodyFrame{
      position: relative;
      display: block;
      width: 100%;
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 16px;
      background:
        radial-gradient(140% 160% at 8% 0%, rgba(120,200,255,.18), rgba(10,16,24,.7) 55%),
        linear-gradient(160deg, rgba(8,12,22,.92), rgba(16,26,42,.86));
      backdrop-filter: blur(12px) saturate(135%);
      border: 1px solid rgba(140, 190, 255, .26);
      box-shadow:
        0 14px 34px rgba(0,0,0,.3),
        inset 0 0 0 1px rgba(255,255,255,.06),
        0 0 24px rgba(80,160,255,.16);
    }
    .postBodyFrame::before{
      content:"";
      position:absolute;
      inset: 1px;
      border-radius: 15px;
      pointer-events:none;
      background: radial-gradient(140% 140% at 0% 0%, rgba(120,200,255,.22), rgba(0,0,0,0) 62%);
      opacity: .85;
    }
    .postBodyFrame::after{
      content:"";
      position:absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events:none;
      background: linear-gradient(120deg, rgba(255,255,255,.04), transparent 35%, rgba(120,200,255,.08));
      opacity:.7;
    }
    .postBodyFrame > *{
      position: relative;
      z-index: 1;
    }
    .postBodyContent{
      position: relative; /* поверх ::before */
      min-height: 22px;
      color: #eaf1ff;
    }
    .forum_root{
      --mb-video-h-mobile: 650px;
      --mb-video-h-tablet: 550px;
      --mb-video-h-desktop: 550px;
  /* Video: минимальная высота */
  --mb-video-min-h-mobile: 420px;
  --mb-video-min-h-tablet: 550px;
  --mb-video-min-h-desktop: 550px;      
      --mb-image-h-mobile: 700px;
      --mb-image-h-tablet: 550px;
      --mb-image-h-desktop: 550px;
      --mb-iframe-h-mobile: 700px;
      --mb-iframe-h-tablet: 550px;
      --mb-iframe-h-desktop: 550px;
  /* YouTube iframe: минимальная высота (моб/планш/десктоп)
     - max-height уже управляется через --mb-iframe-h-*
     - это именно нижняя граница, чтобы карточка YouTube не была «слишком низкой»
  */
  --mb-yt-iframe-min-h-mobile: 420px;
  --mb-yt-iframe-min-h-tablet: 550px;
  --mb-yt-iframe-min-h-desktop: 550px;      
      --mb-audio-h-mobile: 630px;
      --mb-audio-h-tablet: 650px;
      --mb-audio-h-desktop: 700px;
      --mb-qcast-h-mobile: 400px;
      --mb-qcast-h-tablet: 650px;
      --mb-qcast-h-desktop: 650px;      
      --mb-ad-h-mobile: 200px;
      --mb-ad-h-tablet: 260px;
      --mb-ad-h-desktop: 320px;

  /* VIP emoji / MOZI sticker cards fixed height (как mediaBox) */
  --mb-vip-emoji-h-mobile: 260px;
  --mb-vip-emoji-h-tablet: 320px;
  --mb-vip-emoji-h-desktop: 380px;

  --mb-sticker-h-mobile: 260px;
  --mb-sticker-h-tablet: 320px;
  --mb-sticker-h-desktop: 380px;      
      --mb-video-h: var(--mb-video-h-mobile);
      --mb-video-min-h: var(--mb-video-min-h-mobile);
      --mb-image-h: var(--mb-image-h-mobile);
      --mb-iframe-h: var(--mb-iframe-h-mobile);
      --mb-yt-iframe-min-h: var(--mb-yt-iframe-min-h-mobile);
      --mb-audio-h: var(--mb-audio-h-mobile);
      --mb-qcast-h: var(--mb-qcast-h-mobile);
      --mb-ad-h: var(--mb-ad-h-mobile);
 --mb-vip-emoji-h: var(--mb-vip-emoji-h-mobile);
  --mb-sticker-h: var(--mb-sticker-h-mobile);   
      }
    @media (min-width: 640px){
      .forum_root{
        --mb-video-h: var(--mb-video-h-tablet);
        --mb-video-min-h: var(--mb-video-min-h-tablet);
        --mb-image-h: var(--mb-image-h-tablet);
        --mb-iframe-h: var(--mb-iframe-h-tablet);
        --mb-yt-iframe-min-h: var(--mb-yt-iframe-min-h-tablet);
        --mb-audio-h: var(--mb-audio-h-tablet);
        --mb-qcast-h: var(--mb-qcast-h-tablet);
        --mb-ad-h: var(--mb-ad-h-tablet);

    --mb-vip-emoji-h: var(--mb-vip-emoji-h-tablet);
    --mb-sticker-h: var(--mb-sticker-h-tablet);        
      }
    }
    @media (min-width: 1024px){
      .forum_root{
        --mb-video-h: var(--mb-video-h-desktop);
        --mb-video-min-h: var(--mb-video-min-h-desktop);
        --mb-image-h: var(--mb-image-h-desktop);
        --mb-iframe-h: var(--mb-iframe-h-desktop);
        --mb-yt-iframe-min-h: var(--mb-yt-iframe-min-h-desktop);
        --mb-audio-h: var(--mb-audio-h-desktop);
        --mb-qcast-h: var(--mb-qcast-h-desktop);
        --mb-ad-h: var(--mb-ad-h-desktop);

    --mb-vip-emoji-h: var(--mb-vip-emoji-h-desktop);
    --mb-sticker-h: var(--mb-sticker-h-desktop);        
      }
    }
    /* =========================================================
       VIP emoji / MOZI sticker fixed card (аналог mediaBox)
    ========================================================= */
    .vipMediaBox{
      position: relative;
      width: 100%;
      height: var(--vipmb-h, 260px);
      overflow: hidden;
      border-radius: 12px;
      background: rgba(8,12,20,.7);
      border: 1px solid rgba(140,170,255,.25);
      contain: layout paint;
      display:flex;
      align-items:center;
      justify-content:center;
      padding: 10px;
    }

    .vipMediaBox[data-kind="vip-emoji"]{ --vipmb-h: var(--mb-vip-emoji-h); }
    .vipMediaBox[data-kind="sticker"]{  --vipmb-h: var(--mb-sticker-h); }

    .vipMediaBox > img{
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display:block;
      border-radius: 10px;
    }
    .mediaBox{
      position:relative;
      width:100%;
      /* Резиновая карточка: растёт по контенту, но не выше max-height (переменной) */
      max-height:var(--mb-h, 240px);
      height:auto;
      overflow:hidden;
      border-radius:12px;
      background:rgba(8,12,20,.7);
      border:1px solid rgba(140,170,255,.25);
      contain: layout paint;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .mediaBox[data-kind="video"]{ --mb-h: var(--mb-video-h); height: var(--mb-video-h); max-height: var(--mb-video-h); background:#000; }
    .mediaBox[data-kind="image"]{ --mb-h: var(--mb-image-h); }
    .mediaBox[data-kind="iframe"]{ --mb-h: var(--mb-iframe-h); background:#000; }
    .mediaBox[data-kind="audio"]{ --mb-h: var(--mb-audio-h); }
    /* QCast: отдельная максимальная высота */
    .mediaBox[data-kind="qcast"]{ --mb-h: var(--mb-qcast-h); background:#060b16; }
    .mediaBox[data-kind="ad"]{ --mb-h: var(--mb-ad-h); background:rgba(2,8,23,.7); }

    /* Универсальный элемент медиа: без absolute — чтобы контейнер мог ужиматься */
    .mediaBoxItem{
      position:relative;
      display:block;
      width:100%;
      height:auto;
      max-width:100%;
      max-height:100%;
    }

    .mediaBox > img,
    .mediaBox > video{
      object-fit:contain;
    }
    .mediaBox > video{
      width:100%;
      height:auto;
      min-height: var(--mb-video-min-h, 0px);
      max-height:100%;
      background:#000;
    }

    /* Video/iframe cards: фиксируем внутренний плеер по высоте контейнера */
    .mediaBox[data-kind="video"] > video{
      height:100%;
      min-height:100%;
    }

    /* iframe: по умолчанию 16:9, для TikTok — 9:16 */
    .mediaBox > iframe{
      width:100%;
      height:auto;
      max-height:100%;
      border:0;
      aspect-ratio:16/9;
      display:block;
      background:#000;
    }
/* YouTube iframe: минимальная высота отдельно (переменная под моб/десктоп) */
.mediaBox > iframe[data-forum-media="youtube"]{
  min-height: var(--mb-yt-iframe-min-h, 0px);
}      
    .mediaBox > iframe[data-forum-media="tiktok"]{
      aspect-ratio:9/16;
      background:#000;
    }

    .mediaBoxInner{
      position:relative;
      width:100%;
      height:auto;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:0 14px;
    }
    .mediaBoxAudio{
      width:100%;
      height:auto;
      color-scheme:dark;
    }
    :root{
  --vip-emoji-size: 48px;      /* можно быстро настроить под себя */
  --vip-emoji-size-sm: 48px;   /* на мобильных */
}
.vipEmojiBig{
  width: var(--vip-emoji-size);
  height: var(--vip-emoji-size);
  display: inline-block;
  vertical-align: middle;
}
@media (max-width:480px){
  .vipEmojiBig{ width: var(--vip-emoji-size-sm); height: var(--vip-emoji-size-sm); }
} 


/* превью-контейнер и крестик удаления */
.vipComposerPreview{ position:relative; display:inline-block; margin-top:6px }
.vipComposerPreview .vipRemove{
  position:absolute; top:-6px; right:-6px;
  border:0; border-radius:8px; padding:2px 5px; line-height:1;
  background:rgba(0,0,0,.7); color:#fff; cursor:pointer;
}
/* поддержка MOZI-эмодзи (размер — теми же переменными, можно разделить при желании) */
.moziEmojiBig{ width: var(--mozi-emoji-size, var(--vip-emoji-size)); height: var(--mozi-emoji-size, var(--vip-emoji-size)); display:inline-block; vertical-align:middle; }
    .btn, .tag, .iconBtn, .adminBtn, .emojiBtn { cursor:pointer }
    /* === clicky effects for small chips/buttons === */
    .tag,
    .item .tag,
    .reactionBtn {
      cursor: pointer;
      transition: transform .08s ease, box-shadow .18s ease, filter .14s ease;
      user-select: none;
    }

    .tag:hover,
    .item .tag:hover,
    .reactionBtn:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 18px rgba(80,167,255,.25);
      filter: brightness(1.08);
    }

    .tag:active,
    .item .tag:active,
    .reactionBtn:active {
      transform: translateY(0) scale(.97);
    }

    /* компактный вариант для action-кнопок на карточке */
    .btnSm { padding: 6px 8px; font-size: 12px; line-height: 1; }
/* ----- Reply-chip около ника ----- */

@media (max-width: 680px) {
  /* строка с аватаром и ником + чипом ответа */
  .postUserRow {
    display: flex;
    align-items: center;
    flex-wrap: wrap; /* разрешаем перенос на новую строку */
  }

  /* ник не даём сжимать вообще */
  .postUserRow .nick-badge {
    flex-shrink: 0;
  }

  /* сам чип "Ответ для ..." */
  .postUserRow .replyTag {
    font-size: 7px;          /* поменьше шрифт на мобиле */
    line-height: 1.1;
    white-space: normal;      /* разрешаем перенос по словам */
    word-break: normal;
    overflow-wrap: break-word;/* если очень длинный ник/текст – переносим, но не по буквам */

    max-width: 100%;
    flex-basis: 100%;         /* при нехватке места уходит НА СЛЕДУЮЩУЮ СТРОКУ под ником */
    margin-left: 0;           /* под ником, а не сбоку */
    margin-top: 2px;
  }
  .postUserRow .replyTagSnippet{
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  }
/* reply badge (кликабельный) */
.replyTagBtn{
font-size: 12px;
  cursor: pointer;
  text-align: center;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.replyTagBtn:active{ transform: translateY(0) scale(.97); }

.replyTagMain{
  display:block;
}
.replyTagSnippet{
  display:block;
  font-size: 8px;
  line-height: 1.15;
  opacity: .65;
  max-width: 100%;
  white-space: wrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* подсветка сообщения-цели при переходе */
.replyTargetFlash{
  animation: replyTargetFlash 1.1s ease-out;
}
@keyframes replyTargetFlash{
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,.0); transform: scale(1); }
  20%  { box-shadow: 0 0 0 3px rgba(255,255,255,.18); transform: scale(1.01); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,.0); transform: scale(1); }
}
/* --- header: ... --- */
.head{
  position:sticky; top:0; z-index:70; overflow:visible;
  padding:12px 14px;
  border-bottom:1px solid rgba(255,255,255,.1);
  /* collapse animation */
  transition: transform 220ms ease, opacity 160ms ease;
  will-change: transform;
  transform: translateY(0);
  opacity: 1;
}
.headInner{
  display:flex; align-items:center; gap:12px;
  flex-wrap:wrap;
  width:100%;
}
.head.head--collapsed{
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
  padding: 0;
  margin: 0;
  border: 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
}
html[data-video-feed="1"] .head.head--collapsed{
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
  padding: 0;
  margin: 0;
  border: 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
}
.headPeekBtn{
  position: fixed;
  left: 50%;
  top: calc(45px + env(safe-area-inset-top, 0px));
  transform: translateX(-50%);
  z-index: 91;
  width: 54px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 255, 0);
  background: rgba(10, 16, 26, 0.21);
  color: rgb(255, 255, 255);
  display:flex;
  align-items:center;
  justify-content:center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 22px rgb(80, 205, 255), inset 0 0 16px rgba(80, 167, 255, .14);
  cursor:pointer;
  transition: top .18s ease, transform .12s ease;
}
.headPeekBtn:active{ transform: translateX(-50%) scale(.97); }
html[data-inbox-open="1"] .headPeekBtn{
  top: calc(90px + env(safe-area-inset-top, 0px));
}
/* ✅ Telegram Mini App: опускаем стрелку чуть ниже, чтобы не налезала на табы */
html[data-tma="1"][data-inbox-open="1"] .headPeekBtn{
  top: calc(120px + env(safe-area-inset-top, 0px)); /* +8px */
}  
.headCollapseBtn{
  position: absolute;
  left: 50%;
  bottom: -45px;
  transform: translateX(-50%);
  z-index: 60;
  width: 54px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(120, 201, 255, 0);
  background: rgb(10, 16, 26);
  color: rgb(255, 255, 255);
  display:flex;
  align-items:center;
  justify-content:center;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 22px rgb(80, 205, 255), inset 0 0 16px rgba(80, 167, 255, .10);
  cursor:pointer;
}
.headCollapseBtn:active{ transform: translateX(-50%) scale(.97); }

.headArrowSvg{ width: 26px; height: 26px; display:block; }
.headArrowSvg.up{ transform: rotate(180deg); transform-origin: 50% 50%; }
.headArrowSvg .chev{
  opacity: .20;
  filter: drop-shadow(0 0 0 rgba(80,167,255,0));
  animation: headChev 1.1s infinite ease-in-out;
}
.headArrowSvg .chev2{ animation-delay: .12s; }
.headArrowSvg .chev3{ animation-delay: .24s; }
@keyframes headChev{
  0%{ opacity:.15; filter: drop-shadow(0 0 0 rgba(80,167,255,0)); }
  35%{ opacity: 1; filter: drop-shadow(0 0 8px rgba(80,167,255,.75)); }
  70%{ opacity:.15; filter: drop-shadow(0 0 0 rgba(80,167,255,0)); }
  100%{ opacity:.15; filter: drop-shadow(0 0 0 rgba(80,167,255,0)); }
}
@media (prefers-reduced-motion: reduce){
  .head{ transition: none; }
  .headArrowSvg .chev{ opacity: .85; }
}
/* [STYLES:BODY-SCOPE] — ограничиваем область действия .body только форумом */
.forum_root .body{ padding:12px; overflow:visible }
html[data-head-hidden="1"] .forum_root .body{ padding-top:0; margin-top:0; }
html[data-video-feed="1"] .forum_root .body{ padding-top:0; }

/* [STYLES:LAYOUT-FLEX] — делаем «коридор» высоты и скроллящиеся тела секций */
.forum_root{
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.forum_root .grid2{
  /* в рендере ты уже добавил inline flex, дублируем на всякий в CSS, чтобы не зависеть от inline */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;         /* ← даём детям право сжиматься по высоте */
}

/* каждая секция (список тем / выбранная тема) — колонка, занимающая остаток */
.forum_root .grid2 > section{
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;         /* ← критично для появления внутреннего скролла */
}

/* собственно скролл включаем ТОЛЬКО на «телах» секций */
.forum_root .grid2 > section > .body{
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;                 /* стабилизирует высоту области скролла */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
/* [STYLES:OVERFLOW-PROBE] — на всякий, не даём карточке-обёртке резать содержимое */
.forum_root .glass.neon{ overflow: visible !important; }

    /* ДОБАВЬ в Styles() (любой блок <style jsx global>) */
    .tagOk{ border-color: rgba(110,240,170,.45)!important; color:#baf7d6!important; background: rgba(70,210,120,.12)!important }
    .tagDanger{ border-color: rgba(255,120,120,.45)!important; color:#ffb1a1!important; background: rgba(255,90,90,.10)!important }

    /* эффекты клика уже есть: для .btn, .tag, .reactionBtn — hover/active добавлены */

    .btn{ border:1px solid var(--b); background:linear-gradient(180deg, rgba(25,129,255,.28),rgba(25,129,255,.15));
      padding:.62rem .95rem; border-radius:12px; color:var(--ink); display:inline-flex; align-items:center; gap:.6rem;
      box-shadow:0 0 14px rgba(25,129,255,.18); transition:filter .14s, transform .08s, box-shadow .2s; white-space:nowrap }
    .btn:hover{ filter:brightness(1.08); box-shadow:0 0 26px rgba(25,129,255,.32) } .btn:active{ transform:scale(.985) }
    .btnGhost{ background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.16) }

    .tag{ border-radius:10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14); padding:.35rem .52rem; display:inline-flex; align-items:center; gap:.35rem }
    .item{ border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); border-radius:14px; padding:12px; transition:transform .08s, background .15s }
    .item:hover{ background:rgba(255,255,255,.08); transform:translateY(-1px) }
    .title{ font-size:1.8rem; font-weight:800; letter-spacing:.2px;  color: #febf01ff; }
    .meta{ font-size:.84rem; opacity:.78 }
    .nick{ font-weight:700; letter-spacing:.15px }

    .input,.ta{ width:100%; background:#0b1018; color:var(--ink); border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.7rem .9rem; outline:none }
    .input:focus,.ta:focus{ box-shadow:0 0 0 2px rgba(80,167,255,.35) }
    .ta{ min-height:80px; resize:vertical }

    .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px }
    @media (max-width:1024px){ .grid2{ grid-template-columns:1fr } }
/* [SCROLL_FIX] — внутри форума .grid2 ДОЛЖНА быть flex-колонкой */
.forum_root .grid2{
  display:flex !important;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;           /* критично для появления внутреннего скролла */
}

/* каждая секция внутри grid2 — тоже колонка, которая занимает остаток */
.forum_root .grid2 > section{
  display:flex;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;           /* не даём секции «распереть» родителя по высоте */
}

/* скроллим ИМЕННО тело секции */
.forum_root .grid2 > section > .body{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}
/* [TOPICS_BODY_OVERRIDE] — жёстко включаем скролл тела в режиме списка тем */
.forum_root[data-view="topics"] .grid2{ min-height:0 !important; }
.forum_root[data-view="topics"] .grid2 > section{
  display:flex !important;
  flex-direction:column !important;
  flex:1 1 auto !important;
  min-height:0 !important;
}
.forum_root[data-view="topics"] .grid2 > section > .body{
  flex:1 1 auto !important;
  min-height:0 !important;
  max-height:none !important;
  overflow-y:auto !important;
  -webkit-overflow-scrolling:touch;
}


    .composer{ position:sticky; bottom:0; z-index:5; border-top:1px solid rgba(255,255,255,.1); background:rgba(10,14,22,.96); padding:.8rem }

    .emojiPanel{ margin-top:10px; background:rgba(10,14,20,.98); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:10px; max-height:300px; overflow:auto }
    .emojiTitle{ font-size:.86rem; opacity:.8; margin:2px 2px 6px }
    .emojiGrid{ display:grid; grid-template-columns: repeat(auto-fit, 38px); gap:6px }
    .emojiBtn{ width:38px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); font-size:22px; color:#fff; transition: transform .06s }
    .emojiBtn:hover{ transform:translateY(-1px); background:rgba(255,255,255,.12) }
    .emojiBtn, .vipEmojiIcon, .lockBadge, .emojiPostBig{
      font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif !important;
    }
    .emojiOutline{ background:none; border:none; padding:0; width:38px; height:38px; display:inline-flex; align-items:center; justify-content:center; color:#eaf4ff }
    /* VIP emoji preview in panel */
.vipEmojiIcon { display:inline-block; width:100%; height:100%; }
.vipEmojiIcon img, .vipEmojiIcon { object-fit:cover; border-radius:8px }

/* Big VIP emoji in posts */
:root{
  --vip-emoji-size: 48px;      /* базовый размер */
  --vip-emoji-size-sm: 40px;   /* на узких экранах */
}
 /* --- Emoji panel tabs --------------------------------------------------- */
.emojiTabs{
  display:flex;
  gap: 6px;
  margin: 0 2px 8px;
}

.emojiTabBtn{
  --btn-h: 28px;
  height: var(--btn-h);
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.06);
  color: #eaf4ff;
  font-size: .88rem;
  line-height: calc(var(--btn-h) - 2px);
  cursor: pointer;
  user-select: none;
  transition: background .12s ease, border-color .12s ease, transform .06s ease;
}

/* hover / focus (оба таба) */
.emojiTabBtn:hover{
  background: rgba(255,255,255,.12);
  transform: translateY(-1px);
}
.emojiTabBtn:focus-visible{
  outline: none;
  box-shadow: 0 0 0 2px rgba(80,167,255,.35);
  border-color: rgba(80,167,255,.55);
}

/* активная вкладка: читаемо и «горит» */
/* более яркий актив */
.emojiTabBtn[aria-pressed="true"]{
  background: linear-gradient(0deg, rgba(80,167,255,.22), rgba(80,167,255,.22));
  border-color: rgba(80,167,255,.65);
  box-shadow: 0 0 0 1px rgba(80,167,255,.35) inset, 0 1px 6px rgba(80,167,255,.18);
}


/* мобильный компакт */
@media (max-width: 420px){
  .emojiTabBtn{
    --btn-h: 26px;
    padding: 0 10px;
    font-size: .84rem;
    border-radius: 8px;
  }
}
 
.vipEmojiBig{
  width: var(--vip-emoji-size);
  height: var(--vip-emoji-size);
  display:inline-block;
  vertical-align:middle;
  image-rendering:auto;
}
@media (max-width:480px){
  .vipEmojiBig{ width: var(--vip-emoji-size-sm); height: var(--vip-emoji-size-sm); }
}

    .iconWrap{ display:flex; flex-wrap:wrap; gap:10px }
    .avaBig{ width:112px; height:112px; border-radius:16px; border:1px solid rgba(1, 204, 255, 0.31); display:grid; place-items:center; font-size:48px; background:rgba(119, 0, 255, 0.09) }
    .avaMini{ width:60px; height:60px; border-radius:10px; font-size:18px }
/* === AVATAR FILL (добавка) ============================= */
    /* плавность для мелких аватарок */
    .profileList .avaMini{
      transition: transform .12s ease-out, box-shadow .12s ease-out, outline-color .12s ease-out;
    }

    /* выбранный аватар — чуть крупнее и с ярким контуром */
    .profileList .avaMini.tag{
      transform: translateY(-2px) scale(1.06);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, .9), 0 0 16px rgba(56, 189, 248, .5);
      outline: 2px solid rgba(15, 118, 110, .8);
      outline-offset: 0;
    }
`;

export default foundationStyles
