import React from 'react'

export const FORUM_STYLES = `

    :root{
      --ink:#eaf4ff;
      --b:rgba(80,167,255,.32);
      /* Telegram Mini App: РїРѕРґРЅРёРјРё/РѕРїСѓСЃС‚Рё Р»РёРїРєСѓСЋ РїР°РЅРµР»СЊ Quantum Messenger */
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
      position: relative; /* РїРѕРІРµСЂС… ::before */
      min-height: 22px;
      color: #eaf1ff;
    }
    .forum_root{
      --mb-video-h-mobile: 650px;
      --mb-video-h-tablet: 550px;
      --mb-video-h-desktop: 550px;
  /* Video: РјРёРЅРёРјР°Р»СЊРЅР°СЏ РІС‹СЃРѕС‚Р° */
  --mb-video-min-h-mobile: 420px;
  --mb-video-min-h-tablet: 550px;
  --mb-video-min-h-desktop: 550px;      
      --mb-image-h-mobile: 700px;
      --mb-image-h-tablet: 550px;
      --mb-image-h-desktop: 550px;
      --mb-iframe-h-mobile: 700px;
      --mb-iframe-h-tablet: 550px;
      --mb-iframe-h-desktop: 550px;
  /* YouTube iframe: РјРёРЅРёРјР°Р»СЊРЅР°СЏ РІС‹СЃРѕС‚Р° (РјРѕР±/РїР»Р°РЅС€/РґРµСЃРєС‚РѕРї)
     - max-height СѓР¶Рµ СѓРїСЂР°РІР»СЏРµС‚СЃСЏ С‡РµСЂРµР· --mb-iframe-h-*
     - СЌС‚Рѕ РёРјРµРЅРЅРѕ РЅРёР¶РЅСЏСЏ РіСЂР°РЅРёС†Р°, С‡С‚РѕР±С‹ РєР°СЂС‚РѕС‡РєР° YouTube РЅРµ Р±С‹Р»Р° В«СЃР»РёС€РєРѕРј РЅРёР·РєРѕР№В»
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

  /* VIP emoji / MOZI sticker cards fixed height (РєР°Рє mediaBox) */
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
       VIP emoji / MOZI sticker fixed card (Р°РЅР°Р»РѕРі mediaBox)
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
      /* Р РµР·РёРЅРѕРІР°СЏ РєР°СЂС‚РѕС‡РєР°: СЂР°СЃС‚С‘С‚ РїРѕ РєРѕРЅС‚РµРЅС‚Сѓ, РЅРѕ РЅРµ РІС‹С€Рµ max-height (РїРµСЂРµРјРµРЅРЅРѕР№) */
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
    /* QCast: РѕС‚РґРµР»СЊРЅР°СЏ РјР°РєСЃРёРјР°Р»СЊРЅР°СЏ РІС‹СЃРѕС‚Р° */
    .mediaBox[data-kind="qcast"]{ --mb-h: var(--mb-qcast-h); background:#060b16; }
    .mediaBox[data-kind="ad"]{ --mb-h: var(--mb-ad-h); background:rgba(2,8,23,.7); }

    /* РЈРЅРёРІРµСЂСЃР°Р»СЊРЅС‹Р№ СЌР»РµРјРµРЅС‚ РјРµРґРёР°: Р±РµР· absolute вЂ” С‡С‚РѕР±С‹ РєРѕРЅС‚РµР№РЅРµСЂ РјРѕРі СѓР¶РёРјР°С‚СЊСЃСЏ */
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

    /* Video/iframe cards: С„РёРєСЃРёСЂСѓРµРј РІРЅСѓС‚СЂРµРЅРЅРёР№ РїР»РµРµСЂ РїРѕ РІС‹СЃРѕС‚Рµ РєРѕРЅС‚РµР№РЅРµСЂР° */
    .mediaBox[data-kind="video"] > video{
      height:100%;
      min-height:100%;
    }

    /* iframe: РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ 16:9, РґР»СЏ TikTok вЂ” 9:16 */
    .mediaBox > iframe{
      width:100%;
      height:auto;
      max-height:100%;
      border:0;
      aspect-ratio:16/9;
      display:block;
      background:#000;
    }
/* YouTube iframe: РјРёРЅРёРјР°Р»СЊРЅР°СЏ РІС‹СЃРѕС‚Р° РѕС‚РґРµР»СЊРЅРѕ (РїРµСЂРµРјРµРЅРЅР°СЏ РїРѕРґ РјРѕР±/РґРµСЃРєС‚РѕРї) */
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
  --vip-emoji-size: 48px;      /* РјРѕР¶РЅРѕ Р±С‹СЃС‚СЂРѕ РЅР°СЃС‚СЂРѕРёС‚СЊ РїРѕРґ СЃРµР±СЏ */
  --vip-emoji-size-sm: 48px;   /* РЅР° РјРѕР±РёР»СЊРЅС‹С… */
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


/* РїСЂРµРІСЊСЋ-РєРѕРЅС‚РµР№РЅРµСЂ Рё РєСЂРµСЃС‚РёРє СѓРґР°Р»РµРЅРёСЏ */
.vipComposerPreview{ position:relative; display:inline-block; margin-top:6px }
.vipComposerPreview .vipRemove{
  position:absolute; top:-6px; right:-6px;
  border:0; border-radius:8px; padding:2px 5px; line-height:1;
  background:rgba(0,0,0,.7); color:#fff; cursor:pointer;
}
/* РїРѕРґРґРµСЂР¶РєР° MOZI-СЌРјРѕРґР·Рё (СЂР°Р·РјРµСЂ вЂ” С‚РµРјРё Р¶Рµ РїРµСЂРµРјРµРЅРЅС‹РјРё, РјРѕР¶РЅРѕ СЂР°Р·РґРµР»РёС‚СЊ РїСЂРё Р¶РµР»Р°РЅРёРё) */
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

    /* РєРѕРјРїР°РєС‚РЅС‹Р№ РІР°СЂРёР°РЅС‚ РґР»СЏ action-РєРЅРѕРїРѕРє РЅР° РєР°СЂС‚РѕС‡РєРµ */
    .btnSm { padding: 6px 8px; font-size: 12px; line-height: 1; }
/* ----- Reply-chip РѕРєРѕР»Рѕ РЅРёРєР° ----- */

@media (max-width: 680px) {
  /* СЃС‚СЂРѕРєР° СЃ Р°РІР°С‚Р°СЂРѕРј Рё РЅРёРєРѕРј + С‡РёРїРѕРј РѕС‚РІРµС‚Р° */
  .postUserRow {
    display: flex;
    align-items: center;
    flex-wrap: wrap; /* СЂР°Р·СЂРµС€Р°РµРј РїРµСЂРµРЅРѕСЃ РЅР° РЅРѕРІСѓСЋ СЃС‚СЂРѕРєСѓ */
  }

  /* РЅРёРє РЅРµ РґР°С‘Рј СЃР¶РёРјР°С‚СЊ РІРѕРѕР±С‰Рµ */
  .postUserRow .nick-badge {
    flex-shrink: 0;
  }

  /* СЃР°Рј С‡РёРї "РћС‚РІРµС‚ РґР»СЏ ..." */
  .postUserRow .replyTag {
    font-size: 7px;          /* РїРѕРјРµРЅСЊС€Рµ С€СЂРёС„С‚ РЅР° РјРѕР±РёР»Рµ */
    line-height: 1.1;
    white-space: normal;      /* СЂР°Р·СЂРµС€Р°РµРј РїРµСЂРµРЅРѕСЃ РїРѕ СЃР»РѕРІР°Рј */
    word-break: normal;
    overflow-wrap: break-word;/* РµСЃР»Рё РѕС‡РµРЅСЊ РґР»РёРЅРЅС‹Р№ РЅРёРє/С‚РµРєСЃС‚ вЂ“ РїРµСЂРµРЅРѕСЃРёРј, РЅРѕ РЅРµ РїРѕ Р±СѓРєРІР°Рј */

    max-width: 100%;
    flex-basis: 100%;         /* РїСЂРё РЅРµС…РІР°С‚РєРµ РјРµСЃС‚Р° СѓС…РѕРґРёС‚ РќРђ РЎР›Р•Р”РЈР®Р©РЈР® РЎРўР РћРљРЈ РїРѕРґ РЅРёРєРѕРј */
    margin-left: 0;           /* РїРѕРґ РЅРёРєРѕРј, Р° РЅРµ СЃР±РѕРєСѓ */
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
/* reply badge (РєР»РёРєР°Р±РµР»СЊРЅС‹Р№) */
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

/* РїРѕРґСЃРІРµС‚РєР° СЃРѕРѕР±С‰РµРЅРёСЏ-С†РµР»Рё РїСЂРё РїРµСЂРµС…РѕРґРµ */
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
/* вњ… Telegram Mini App: РѕРїСѓСЃРєР°РµРј СЃС‚СЂРµР»РєСѓ С‡СѓС‚СЊ РЅРёР¶Рµ, С‡С‚РѕР±С‹ РЅРµ РЅР°Р»РµР·Р°Р»Р° РЅР° С‚Р°Р±С‹ */
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
/* [STYLES:BODY-SCOPE] вЂ” РѕРіСЂР°РЅРёС‡РёРІР°РµРј РѕР±Р»Р°СЃС‚СЊ РґРµР№СЃС‚РІРёСЏ .body С‚РѕР»СЊРєРѕ С„РѕСЂСѓРјРѕРј */
.forum_root .body{ padding:12px; overflow:visible }
html[data-head-hidden="1"] .forum_root .body{ padding-top:0; margin-top:0; }
html[data-video-feed="1"] .forum_root .body{ padding-top:0; }

/* [STYLES:LAYOUT-FLEX] вЂ” РґРµР»Р°РµРј В«РєРѕСЂРёРґРѕСЂВ» РІС‹СЃРѕС‚С‹ Рё СЃРєСЂРѕР»Р»СЏС‰РёРµСЃСЏ С‚РµР»Р° СЃРµРєС†РёР№ */
.forum_root{
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.forum_root .grid2{
  /* РІ СЂРµРЅРґРµСЂРµ С‚С‹ СѓР¶Рµ РґРѕР±Р°РІРёР» inline flex, РґСѓР±Р»РёСЂСѓРµРј РЅР° РІСЃСЏРєРёР№ РІ CSS, С‡С‚РѕР±С‹ РЅРµ Р·Р°РІРёСЃРµС‚СЊ РѕС‚ inline */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;         /* в†ђ РґР°С‘Рј РґРµС‚СЏРј РїСЂР°РІРѕ СЃР¶РёРјР°С‚СЊСЃСЏ РїРѕ РІС‹СЃРѕС‚Рµ */
}

/* РєР°Р¶РґР°СЏ СЃРµРєС†РёСЏ (СЃРїРёСЃРѕРє С‚РµРј / РІС‹Р±СЂР°РЅРЅР°СЏ С‚РµРјР°) вЂ” РєРѕР»РѕРЅРєР°, Р·Р°РЅРёРјР°СЋС‰Р°СЏ РѕСЃС‚Р°С‚РѕРє */
.forum_root .grid2 > section{
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;         /* в†ђ РєСЂРёС‚РёС‡РЅРѕ РґР»СЏ РїРѕСЏРІР»РµРЅРёСЏ РІРЅСѓС‚СЂРµРЅРЅРµРіРѕ СЃРєСЂРѕР»Р»Р° */
}

/* СЃРѕР±СЃС‚РІРµРЅРЅРѕ СЃРєСЂРѕР»Р» РІРєР»СЋС‡Р°РµРј РўРћР›Р¬РљРћ РЅР° В«С‚РµР»Р°С…В» СЃРµРєС†РёР№ */
.forum_root .grid2 > section > .body{
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;                 /* СЃС‚Р°Р±РёР»РёР·РёСЂСѓРµС‚ РІС‹СЃРѕС‚Сѓ РѕР±Р»Р°СЃС‚Рё СЃРєСЂРѕР»Р»Р° */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
/* [STYLES:OVERFLOW-PROBE] вЂ” РЅР° РІСЃСЏРєРёР№, РЅРµ РґР°С‘Рј РєР°СЂС‚РѕС‡РєРµ-РѕР±С‘СЂС‚РєРµ СЂРµР·Р°С‚СЊ СЃРѕРґРµСЂР¶РёРјРѕРµ */
.forum_root .glass.neon{ overflow: visible !important; }

    /* Р”РћР‘РђР’Р¬ РІ Styles() (Р»СЋР±РѕР№ Р±Р»РѕРє <style jsx global>) */
    .tagOk{ border-color: rgba(110,240,170,.45)!important; color:#baf7d6!important; background: rgba(70,210,120,.12)!important }
    .tagDanger{ border-color: rgba(255,120,120,.45)!important; color:#ffb1a1!important; background: rgba(255,90,90,.10)!important }

    /* СЌС„С„РµРєС‚С‹ РєР»РёРєР° СѓР¶Рµ РµСЃС‚СЊ: РґР»СЏ .btn, .tag, .reactionBtn вЂ” hover/active РґРѕР±Р°РІР»РµРЅС‹ */

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
/* [SCROLL_FIX] вЂ” РІРЅСѓС‚СЂРё С„РѕСЂСѓРјР° .grid2 Р”РћР›Р–РќРђ Р±С‹С‚СЊ flex-РєРѕР»РѕРЅРєРѕР№ */
.forum_root .grid2{
  display:flex !important;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;           /* РєСЂРёС‚РёС‡РЅРѕ РґР»СЏ РїРѕСЏРІР»РµРЅРёСЏ РІРЅСѓС‚СЂРµРЅРЅРµРіРѕ СЃРєСЂРѕР»Р»Р° */
}

/* РєР°Р¶РґР°СЏ СЃРµРєС†РёСЏ РІРЅСѓС‚СЂРё grid2 вЂ” С‚РѕР¶Рµ РєРѕР»РѕРЅРєР°, РєРѕС‚РѕСЂР°СЏ Р·Р°РЅРёРјР°РµС‚ РѕСЃС‚Р°С‚РѕРє */
.forum_root .grid2 > section{
  display:flex;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;           /* РЅРµ РґР°С‘Рј СЃРµРєС†РёРё В«СЂР°СЃРїРµСЂРµС‚СЊВ» СЂРѕРґРёС‚РµР»СЏ РїРѕ РІС‹СЃРѕС‚Рµ */
}

/* СЃРєСЂРѕР»Р»РёРј РРњР•РќРќРћ С‚РµР»Рѕ СЃРµРєС†РёРё */
.forum_root .grid2 > section > .body{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}
/* [TOPICS_BODY_OVERRIDE] вЂ” Р¶С‘СЃС‚РєРѕ РІРєР»СЋС‡Р°РµРј СЃРєСЂРѕР»Р» С‚РµР»Р° РІ СЂРµР¶РёРјРµ СЃРїРёСЃРєР° С‚РµРј */
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
  --vip-emoji-size: 48px;      /* Р±Р°Р·РѕРІС‹Р№ СЂР°Р·РјРµСЂ */
  --vip-emoji-size-sm: 40px;   /* РЅР° СѓР·РєРёС… СЌРєСЂР°РЅР°С… */
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

/* hover / focus (РѕР±Р° С‚Р°Р±Р°) */
.emojiTabBtn:hover{
  background: rgba(255,255,255,.12);
  transform: translateY(-1px);
}
.emojiTabBtn:focus-visible{
  outline: none;
  box-shadow: 0 0 0 2px rgba(80,167,255,.35);
  border-color: rgba(80,167,255,.55);
}

/* Р°РєС‚РёРІРЅР°СЏ РІРєР»Р°РґРєР°: С‡РёС‚Р°РµРјРѕ Рё В«РіРѕСЂРёС‚В» */
/* Р±РѕР»РµРµ СЏСЂРєРёР№ Р°РєС‚РёРІ */
.emojiTabBtn[aria-pressed="true"]{
  background: linear-gradient(0deg, rgba(80,167,255,.22), rgba(80,167,255,.22));
  border-color: rgba(80,167,255,.65);
  box-shadow: 0 0 0 1px rgba(80,167,255,.35) inset, 0 1px 6px rgba(80,167,255,.18);
}


/* РјРѕР±РёР»СЊРЅС‹Р№ РєРѕРјРїР°РєС‚ */
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
/* === AVATAR FILL (РґРѕР±Р°РІРєР°) ============================= */
    /* РїР»Р°РІРЅРѕСЃС‚СЊ РґР»СЏ РјРµР»РєРёС… Р°РІР°С‚Р°СЂРѕРє */
    .profileList .avaMini{
      transition: transform .12s ease-out, box-shadow .12s ease-out, outline-color .12s ease-out;
    }

    /* РІС‹Р±СЂР°РЅРЅС‹Р№ Р°РІР°С‚Р°СЂ вЂ” С‡СѓС‚СЊ РєСЂСѓРїРЅРµРµ Рё СЃ СЏСЂРєРёРј РєРѕРЅС‚СѓСЂРѕРј */
    .profileList .avaMini.tag{
      transform: translateY(-2px) scale(1.06);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, .9), 0 0 16px rgba(56, 189, 248, .5);
      outline: 2px solid rgba(15, 118, 110, .8);
      outline-offset: 0;
    }
/* ===== Profile popover: badge + avatar upload (header) ===== */
.profileTopRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin: 4px 0 10px;
}

.profileTopRow .profileBadgeLeft{ min-width:0; }

/* РєРІР°РґСЂР°С‚РЅР°СЏ РєРЅРѕРїРєР° СЃРїСЂР°РІР°: РїРѕ РєР»РёРєСѓ вЂ” РІС‹Р±РѕСЂ С„Р°Р№Р»Р°; РїРѕСЃР»Рµ РІС‹Р±РѕСЂР° вЂ” РїСЂРµРІСЊСЋ РІРЅСѓС‚СЂРё */
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
  /* canvas: РІРЅСѓС‚СЂРё СЂРёСЃСѓРµРј СЃР°РјРё, РїРѕСЌС‚РѕРјСѓ object-fit РќР• РЅСѓР¶РµРЅ */
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

/* Р—СѓРј-СЃС‚СЂРѕРєР°: РІСЃРµРіРґР° СЃР»РµРґСѓСЋС‰РµР№ СЃС‚СЂРѕРєРѕР№ Рё РЅР° РІСЃСЋ С€РёСЂРёРЅСѓ РїРѕРїРѕРІРµСЂР° */
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

/* 1) РљРѕРЅС‚РµР№РЅРµСЂ: РЅРёС‡РµРіРѕ РЅРµ РјРµРЅСЏРµРј РєСЂРѕРјРµ РѕР±СЂРµР·РєРё Рё РєРѕРЅС‚РµРєСЃС‚Р° РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРёСЏ */
.avaBig,
.avaMini{
  overflow: hidden;         /* С‡С‚РѕР±С‹ Р»РёС€РЅРµРµ РѕР±СЂРµР·Р°Р»РѕСЃСЊ РїРѕ СЂР°РјРєРµ */
  position: relative;       /* РЅСѓР¶РЅРѕ, С‡С‚РѕР±С‹ next/image РЅРµ В«СѓР±РµР¶Р°Р»В» */
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
/* 2) РћР±С‹С‡РЅС‹Рµ <img>/<video>/<canvas>/<svg> РІРЅСѓС‚СЂРё вЂ” СЂР°СЃС‚СЏРЅСѓС‚СЊ Рё РїРѕРєСЂС‹С‚СЊ */
.avaBig :is(img, video, canvas, svg),
.avaMini :is(img, video, canvas, svg){
  width: 100%;
  height: 100%;
  object-fit: cover;        /* Р·Р°РїРѕР»РЅСЏРµРј Р±РµР· В«РїРёСЃРµРјВ» */
  object-position: center;
  display: block;
  border-radius: inherit;   /* СЃРєСЂСѓРіР»РµРЅРёРµ РєР°Рє Сѓ РєРѕРЅС‚РµР№РЅРµСЂР° */
}

/* 3) Р•СЃР»Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ next/image (img РїРѕР·РёС†РёРѕРЅРёСЂСѓРµС‚СЃСЏ Р°Р±СЃРѕР»СЋС‚РЅРѕ РІРЅСѓС‚СЂРё span) */
.avaBig :is(span, div) > img,
.avaMini :is(span, div) > img{
  inset: 0 !important;      /* СЂР°СЃС‚СЏРіРёРІР°РµРј РІРѕ РІРµСЃСЊ РєРѕРЅС‚РµР№РЅРµСЂ */
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
}

/* 4) РќР° РІСЃСЏРєРёР№ СЃР»СѓС‡Р°Р№ СЂР°СЃС‚СЏРЅРµРј СЃР°Рј РѕР±С‘СЂС‚РѕС‡РЅС‹Р№ span next/image */
.avaBig :is(span, div):has(> img),
.avaMini :is(span, div):has(> img){
  position: absolute;       /* Р·Р°РїРѕР»РЅСЏРµС‚ РІСЃСЋ РєРЅРѕРїРєСѓ */
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

/* ====== РќРћР’РћР•: РїСЂР°РІС‹Р№ Р±Р»РѕРє СѓРїСЂР°РІР»РµРЅРёСЏ РІ С…РµРґРµСЂРµ ====== */
.controls{
  margin-left:auto;
  display:flex; align-items:center; gap:6px;
  flex-wrap: nowrap;            /* в†ђ РљРќРћРџРљР РќР• РџР•Р Р•РќРћРЎРЇРўРЎРЇ */
  flex: 1 1 auto;
  min-width: 0;                 /* в†ђ РјРѕР¶РЅРѕ СѓР¶РёРјР°С‚СЊСЃСЏ */
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
}
.aboutRailPencil{
  position:absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,.9);
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.5));
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

/* РџРѕРёСЃРє РІСЃС‚СЂРѕРµРЅ РІ .controls Рё СЃР¶РёРјР°РµС‚СЃСЏ РїРѕ С€РёСЂРёРЅРµ РЅР° СѓР·РєРёС… СЌРєСЂР°РЅР°С… */
.search{
  position:relative;
  display:flex; align-items:center; gap:8px;
  z-index:60; overflow:visible;
  flex: 1 1 auto;               /* в†ђ РїРѕР»Рµ РїРѕРёСЃРєР° СЂРµР·РёРЅРѕРІРѕРµ */
  min-width: 80px;              /* РЅРёР¶РЅСЏСЏ РіСЂР°РЅРёС†Р° РЅР° РѕС‡РµРЅСЊ СѓР·РєРёС… СЌРєСЂР°РЅР°С… */
}
.searchInputWrap{
  position:relative;
  flex: 1 1 auto;
  min-width:0;
}

/* РёРЅРїСѓС‚ Р·Р°РЅРёРјР°РµС‚ РІСЃС‘ РѕСЃС‚Р°РІС€РµРµСЃСЏ РјРµСЃС‚Рѕ Рё СѓР¶РёРјР°РµС‚СЃСЏ РїРµСЂРІС‹Рј */
.searchInput{
  width:100%;
  flex: 1 1 auto; min-width: 60px; max-width:100%;
  height:40px; border-radius:12px; padding:.55rem .9rem;
  background:#0b1018; color:var(--ink); border:1px solid rgba(255,255,255,.16);
}


/* РєРЅРѕРїРєРё/С‡РёРїС‹ вЂ” С„РёРєСЃ. С€РёСЂРёРЅР°, РЅРµ СЃР¶РёРјР°СЋС‚СЃСЏ Рё РЅРµ РїРµСЂРµРЅРѕСЃСЏС‚СЃСЏ */
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
   /* РќР• РїСЂРёРІСЏР·С‹РІР°РµРј Рє С€РёСЂРёРЅРµ РёРЅРїСѓС‚Р°: РґРµР»Р°РµРј Р°РґР°РїС‚РёРІРЅРѕ */
   inline-size:clamp(250px, 92vw, 560px);
   /* Рё РЅРµ РґР°С‘Рј РІС‹Р»РµР·С‚Рё Р·Р° СЌРєСЂР°РЅ */
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

 /* RTL: РґСЂРѕРїРґР°СѓРЅ РґРѕР»Р¶РµРЅ РѕС‚РєСЂС‹РІР°С‚СЊСЃСЏ РѕС‚ РїСЂР°РІРѕРіРѕ РєСЂР°СЏ РїРѕРёСЃРєР° */
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
    .adminWrap{ position:relative; flex:0 0 auto } /* СЃРїСЂР°РІР° РѕС‚ РїРѕРёСЃРєР°, РІ СЂР°РјРєР°С… .controls */
    .adminBtn{ border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:.55rem .8rem; font-weight:700; letter-spacing:.4px }
    .adminOff{ background:rgba(255,90,90,.10); border-color:rgba(255,120,120,.45); color:#ffb1a1 }
    .adminOn{ background:rgba(70,210,120,.12); border-color:rgba(110,240,170,.45); color:#baf7d6 }
 
    .qft_toast_wrap{ position:fixed; right:16px; bottom:16px; z-index:4000 }
    .qft_toast{ max-width:min(420px,90vw); padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:rgba(10,14,22,.94); color:#eaf4ff; box-shadow:0 10px 28px rgba(0,0,0,.45) }
    .qft_toast.ok{ border-color:rgba(70,220,130,.5) } .qft_toast.warn{ border-color:rgba(255,200,80,.5) } .qft_toast.err{ border-color:rgba(255,90,90,.5) }

    /* РјРёРЅРё-РїРѕРїРѕРІРµСЂС‹ */
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
    .userInfoStat--action{
      text-align:left;
      cursor:pointer;
      transition: transform .12s ease, border-color .18s ease, box-shadow .2s ease, background .2s ease;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
    }
    .userInfoStat--action:hover{
      border-color: rgba(150,195,255,.45);
      background: linear-gradient(120deg, rgba(18,30,52,.52), rgba(35,70,126,.34));
      box-shadow: 0 0 14px rgba(90,162,255,.2), inset 0 0 0 1px rgba(255,255,255,.04);
      transform: translateY(-1px);
    }
    .userInfoStat--action:active{
      transform: translateY(0);
      filter: brightness(.98);
    }
    .userInfoStatArrow{
      margin-left:auto;
      width:20px;
      height:12px;
      position:relative;
      display:inline-flex;
      align-items:center;
      justify-content:flex-end;
    }
    .userInfoStatArrowTail{
      width:11px;
      height:2px;
      border-radius:999px;
      background:linear-gradient(90deg, rgba(125,188,255,.25), rgba(190,230,255,.96));
      box-shadow:0 0 8px rgba(120,180,255,.36);
      animation:userInfoArrowTailPulse 1.45s ease-in-out infinite;
    }
    .userInfoStatArrowHead{
      position:absolute;
      right:1px;
      width:7px;
      height:7px;
      border-top:2px solid rgba(210,236,255,.95);
      border-right:2px solid rgba(210,236,255,.95);
      transform:rotate(45deg);
      animation:userInfoArrowHeadPulse 1.45s ease-in-out infinite;
    }
    @keyframes userInfoArrowTailPulse{
      0%, 100%{ transform: translateX(0); opacity:.55; }
      50%{ transform: translateX(2px); opacity:1; }
    }
    @keyframes userInfoArrowHeadPulse{
      0%, 100%{ transform: translateX(0) rotate(45deg); opacity:.55; }
      50%{ transform: translateX(2px) rotate(45deg); opacity:1; }
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

    /* РќР° РјРѕР±РёР»Рµ РґРµР»Р°РµРј РїСЂРµРІСЊСЋ вЂњРІС‹С€Рµ/РЅРёР¶РµвЂќ, РєР°Рє С‚С‹ РїСЂРѕСЃРёР» */
    @media (max-width:520px){
      .avaUploadBtn{ width:86px; height:32px; border-radius:12px; }
      .avaCropPanel{
        grid-template-columns: 1fr;
      }
      .avaCropBox{
        width:100%;
        height:140px;   /* С‡СѓС‚СЊ РІС‹С€Рµ РЅР° РјРѕР±РёР»Рµ */
      }
    }
/* Р’СЊСЋРїРѕСЂС‚С‹: РїРµСЂРµРЅРѕСЃРёРј Р’Р•РЎР¬ СЂСЏРґ РїРѕРґ Р°РІР°С‚Р°СЂ, РЅРѕ РІРЅСѓС‚СЂРё вЂ” РѕРґРЅР° СЃС‚СЂРѕРєР° */
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
  .search{ flex:1 1 0; min-width:120px } /* СЃР¶РёРјР°РµС‚СЃСЏ РїРµСЂРІРѕР№ */
}

/* РЈР¶Рµ СѓР¶Рµ: РµС‰С‘ СЃРёР»СЊРЅРµРµ СѓР¶РёРјР°РµРј РїРѕРёСЃРє, РєРЅРѕРїРєРё РѕСЃС‚Р°СЋС‚СЃСЏ */
@media (max-width:560px){
  .head{ padding:10px }
  .controls{
    order:3;
    flex:0 0 100%;
    min-width:100%;
    flex-wrap:nowrap;         /* в†ђ РІСЃС‘ РµС‰С‘ РѕРґРЅР° Р»РёРЅРёСЏ */
  }
  .search{ flex:1 1 0; min-width:90px }
  .iconBtn{ width:36px; height:36px }
}

/* РЎРѕРІСЃРµРј СѓР·РєРѕ: РјРёРЅРёРјР°Р»СЊРЅС‹Р№ РґРѕРїСѓСЃРє РґР»СЏ РїРѕРёСЃРєР° */
@media (max-width:420px){
  .search{ flex:1 1 0; min-width:70px }
}
/* === VIP styles (РєРЅРѕРїРєР° + РїРѕРїРѕРІРµСЂ) === */
.iconBtn.vip { border-color: rgba(255,215,0,.55); color:#ffd700; box-shadow:0 0 14px rgba(255,215,0,.25) }
.iconBtn.vipGray { opacity:.85 }
.vipWrap { position:relative }

/* РІРЅРµ РјРµРґРёР°: С„РёРєСЃРёСЂСѓРµРј, С‡С‚Рѕ РєРЅРѕРїРєРё/С‡РёРїС‹ РЅРµ СЃР¶РёРјР°СЋС‚СЃСЏ */
.iconBtn,
.sortWrap,
.adminWrap,
.adminBtn{ flex:0 0 auto; }
/* РІ С‚РІРѕРё РіР»РѕР±Р°Р»С‹/РјРѕРґСѓР»СЊ */
.emojiGrid.vip { outline: 1px dashed rgba(255,215,0,.25); border-radius: 10px; padding: 6px; }
.emojiBtn.vipAnim { will-change: transform; }
.emojiBtn.vipAnim:hover { transform: translateY(-1px) scale(1.02); }

/* Р»С‘РіРєРѕРµ РїРѕРґРїСЂС‹РіРёРІР°РЅРёРµ РЅР° hover */
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
/* РљСЂСѓРїРЅС‹Р№ Р°РєРєСѓСЂР°С‚РЅС‹Р№ Р±РµР№РґР¶ РЅРёРєР° (РµРґРёРЅС‹Р№ РґР»СЏ РІСЃРµС…) */
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
/* --- VIP badge РЅР°Рґ РЅРёРєРѕРј (20s / 5s) ---
   РќР°СЃС‚СЂРѕР№РєР° РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРёСЏ/СЂР°Р·РјРµСЂР°:
   --vip-badge-w, --vip-badge-h  (СЂР°Р·РјРµСЂ)
   --vip-badge-gap              (СЂР°СЃСЃС‚РѕСЏРЅРёРµ РјРµР¶РґСѓ Р±РµР№РґР¶РµРј Рё РЅРёРєРѕРј)
   --vip-badge-shift-x/y        (СЃРґРІРёРі Р±РµР№РґР¶Р°)
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

/* РѕР±С‰РёР№ С†РёРєР» 25s: 1.png РІРёРґРЅРѕ 0..20s (80%), 2.png РІРёРґРЅРѕ 20..25s (20%) */
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
  /* Р±РµРіСѓС‰РёР№ РіСЂР°РґРёРµРЅС‚ РїРѕ СЂР°РјРєРµ */
  background:
    linear-gradient(#0b1220,#0b1220) padding-box,
    linear-gradient(135deg,#5b9dff,#9b5bff,#ff5bb2,#5b9dff) border-box;
  background-size: 200% 200%, 300% 300%;
  animation: nickGradient 6s linear infinite, nickGlow 2.2s ease-in-out infinite;
}

/* РјСЏРіРєРѕРµ СЃРІРµС‡РµРЅРёРµ */
@keyframes nickGlow{
  0%,100%{ box-shadow: 0 0 .5rem rgba(91,157,255,.28), inset 0 0 .35rem rgba(155,91,255,.16) }
  50%   { box-shadow: 0 0 1.15rem rgba(91,157,255,.55), inset 0 0 .55rem rgba(155,91,255,.28) }
}

/* РґРІРёР¶РµРЅРёРµ РіСЂР°РґРёРµРЅС‚Р° СЂР°РјРєРё */
@keyframes nickGradient{
  0%   { background-position: 0% 0%, 0% 50% }
  100%{ background-position: 200% 200%, 300% 50% }
}

/* СѓРІР°Р¶РµРЅРёРµ Рє reduced motion */
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
/* РіР°Р»РµСЂРµСЏ РёР·РѕР±СЂР°Р¶РµРЅРёР№ РІ РїРѕСЃС‚Рµ */
.postGallery{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-top:8px }
.postGallery .thumb{ position:relative; padding:0; border:0; background:transparent; border-radius:8px; overflow:hidden; outline:1px solid rgba(140,170,255,.25) }
.postGallery img{ width:100%; height:100%; object-fit:cover; display:block; aspect-ratio:1 / 1; }

/* Р»Р°Р№С‚Р±РѕРєСЃ */
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
/* Р»РѕРєР°Р»РёР·Р°С†РёСЏ С‚РѕР»СЊРєРѕ РІРЅСѓС‚СЂРё СЃС‚СЂРѕРєРё РєРѕРјРїРѕР·РµСЂР° */
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

/* cРµСЂРѕСЃС‚СЊ РјРѕРіР»Р° РїСЂРёС…РѕРґРёС‚СЊ РѕС‚ РіР»РѕР±Р°Р»СЊРЅС‹С… СЃС‚РёР»РµР№ button */
.forumComposer .attachPreviewRow button{
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0;
}

/* Р° РґР»СЏ РєСЂРµСЃС‚РёРєР° Р·Р°РґР°С‘Рј СЃРІРѕР№ С‚С‘РјРЅС‹Р№ РєСЂСѓР¶РѕРє РѕС‚РґРµР»СЊРЅРѕ */
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

/* === Q COIN (РёРЅР»Р°Р№РЅ + РјРѕРґР°Р»РєР°) === */
.qcoinRow{
  display:inline-flex; align-items:center; gap:10px; margin-left:10px;
}

/* Р—РѕР»РѕС‚Р°СЏ РЅР°РґРїРёСЃСЊ СЃ РїРµСЂРµР»РёРІРѕРј Рё СЃРІРµС‡РµРЅРёРµРј */
.qcoinLabel{
  font-size:2.4em; font-weight:900; letter-spacing:.4px;
  background:
    linear-gradient(135deg,
      #7a5c00 0%,
      #ffd700 18%,
      #fff4b3 32%,
      #ffd700 46%,
      #ffea80 60%,
      #b38400 74%,
      #ffd700 88%,
      #7a5c00 100%);
  background-size:200% 100%;
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
  text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35);
}
@keyframes qcoinShine{ 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes qcoinGlow{
  0%{ text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35) }
  50%{ text-shadow:0 0 .9СЂРµРј rgba(255,215,0,.55), 0 0 .25rem rgba(255,255,190,.55) }
  100%{ text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35) }
}

/* РЎР°РјРѕ С‡РёСЃР»Рѕ вЂ” РєСЂСѓРїРЅРµРµ, СЃ В«СЃС‚РµРєР»СЏРЅРЅРѕР№В» РїРѕРґР»РѕР¶РєРѕР№ */
.qcoinValue{
  font-size:1.6em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight:800; padding:.20em .66em; border-radius:.36em;
  border:1px solid rgba(162, 0, 255, 0.33);
  background:linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0));
  backdrop-filter: blur(6px);
}
.qcoinValue.live{ color:#ffd700 }
.qcoinValue.paused{ color:#ff8c8c; animation:blinkPause .9s steps(1) infinite }
@keyframes blinkPause{ 50%{ opacity:.45 } }

@media (max-width: 680px){
  .headInner .qRowRight{
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-width: 0;
    padding-right: 2px;
  }
  .headInner .qRowRight > *{
    width: auto;
    max-width: 100%;
    flex: 0 1 auto;
    justify-content: center;
    text-align: center;
    overflow: visible;
    font-size: inherit;
  }
  .headInner .qRowRight > .qcoinRow.qcoinCol{
    margin-left: 0;
    gap: 10px;
    align-items: center;
  }
  .headInner .qRowRight .qcoinTop{
    justify-content: center;
    gap: 12px;
  }
  .headInner .qRowRight .qcoinLabel{
    font-size: clamp(2.72em, 8vw, 3.18em);
    line-height: .92;
    letter-spacing: .5px;
  }
  .headInner .qRowRight .qcoinX2{
    min-width: 56px;
    height: 31px;
    padding: 0 9px;
    font-size: 15px;
  }
  .headInner .qRowRight .qcoinValue{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    font-size: clamp(1.72em, 5.2vw, 2.02em);
    padding: .26em .80em;
    line-height: 1.02;
  }
}

/* РјРѕРґР°Р»РєР° вЂ” СЃРєСЂРѕР»Р»РёРј РїРѕРґР»РѕР¶РєСѓ, РєР°СЂС‚РѕС‡РєР° СЂР°СЃС‚СЏРіРёРІР°РµС‚СЃСЏ РїРѕ РєРѕРЅС‚РµРЅС‚Сѓ */
.qcoinModal{
  position:fixed; inset:0; z-index:3200;
  display:grid; align-items:start; justify-items:center; /* РІРјРµСЃС‚Рѕ place-items:center */
  overflow:auto;                     /* СЃРєСЂРѕР»Р» Сѓ РїРѕРґР»РѕР¶РєРё */
  padding:16px 10px;                 /* Р·Р°РїР°СЃ РѕС‚ РєСЂР°С‘РІ СЌРєСЂР°РЅР° */
  background:rgba(8,12,22,.8);
}
.qcoinCard{
  width:min(520px, 88vw);            /* С€РёСЂРёРЅСѓ РќР• С‚СЂРѕРіР°РµРј */
  height:auto !important;
  max-height:none !important;        /* СѓР±РёСЂР°РµРј РѕРіСЂР°РЅРёС‡РµРЅРёРµ РїРѕ РІС‹СЃРѕС‚Рµ */
  overflow:visible !important;       /* Р±РµР· РІРЅСѓС‚СЂРµРЅРЅРµРіРѕ СЃРєСЂРѕР»Р»Р° */
  border:1px solid rgba(255,255,255,.14); border-radius:14px;
  background:rgba(10,14,20,.96); padding:14px;
  box-shadow:0 10px 30px rgba(0,0,0,.45);
}
.qcoinCardHdr{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px }

/* РіРёС„/Р°РІР°С‚Р°СЂ вЂ” РѕРґРЅР° РІРµСЂСЃРёСЏ (СѓР±СЂР°РЅС‹ РґСѓР±Р»Рё) */
.qcoinMini{
  width:  clamp(108px, 12.6vw, 144px);
  height: clamp(108px, 12.6vw, 144px);
  border-radius:10px;
  object-fit:cover;
  border:1px solid rgba(255,215,0,.4);
  flex:0 0 auto;
  background:#000;                   /* РЅР° СЃР»СѓС‡Р°Р№ Р·Р°РіСЂСѓР·РєРё РјРµС‚Р°РґР°РЅРЅС‹С… */
  box-shadow:0 4px 12px rgba(50,80,160,.25);
}

.qcoinPopBody{
  max-height:none !important;        /* СЃРЅРёРјР°РµРј РІС‚РѕСЂРѕР№ Р»РёРјРёС‚ */
  overflow:visible !important;       /* СЃРєСЂРѕР»Р» РЅРµ Р·РґРµСЃСЊ */
}
.qcoinCardHdr img, .qcoinPopBody img{ max-width:100%; height:auto }

/* РєРЅРѕРїРєРё (СЃС‚Р°СЂС‹Рµ) */
.qcoinBtn{
  border:1px solid rgba(255,255,255,.16);
  background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
  padding:.45rem .7rem; border-radius:.7rem; font-weight:700;
  box-shadow:0 0 14px rgba(25,129,255,.18); backdrop-filter: blur(8px);
}
.qcoinBtn.gold{
  border-color:rgba(255,215,0,.55); color:#1a1f2b;
  background:linear-gradient(180deg,#ffe680,#ffd04d);
  box-shadow:0 0 22px rgba(255,215,0,.35);
}

/* РќР•РћРќРћР’РђРЇ В«Р‘РёСЂР¶Р°В» РІ РјРѕРґР°Р»РєРµ */
.qcoinExchangeBtn{
  position:relative;
  padding:.55rem 1rem; border-radius:.8rem; font-weight:800; letter-spacing:.4px;
  color:#0b1220; background:#ffe680; border:1px solid rgba(255,215,0,.65);
  box-shadow:0 0 22px rgba(255,215,0,.35), inset 0 0 12px rgba(255,255,255,.35);
  text-transform:uppercase;
  overflow:hidden; isolation:isolate;
  transition: transform .15s ease-out, box-shadow .15s ease-out;
}
.qcoinExchangeBtn::before{
  content:""; position:absolute; inset:-2px;
  background:
    radial-gradient(60% 80% at 20% 0%, rgba(255,255,255,.35), transparent 60%),
    linear-gradient(135deg, rgba(255,215,0,.35), rgba(255,215,0,.05));
  filter:blur(8px); opacity:.6; z-index:-1;
  animation: exchangeNeon 2.6s ease-in-out infinite;
}
.qcoinExchangeBtn::after{
  content:""; position:absolute; left:-40%; top:-120%; width:80%; height:300%;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent);
  transform: rotate(20deg);
  animation: exchangeShine 3.2s linear infinite;
}
.qcoinExchangeBtn:hover{ transform: translateY(-1px); box-shadow:0 0 28px rgba(255,215,0,.55), inset 0 0 14px rgba(255,255,255,.45) }
.qcoinExchangeBtn:active{ transform: translateY(0) scale(.99) }

@keyframes exchangeNeon{
  0%,100%{ box-shadow:0 0 22px rgba(255,215,0,.35) }
  50%    { box-shadow:0 0 36px rgba(255,215,0,.55) }
}
@keyframes exchangeShine{
  0%{ left:-40% } 100%{ left:140% }
}

/* Р°РЅРёРјР°С†РёРё off РїСЂРё reduced motion */
@media (prefers-reduced-motion: reduce){
  .qcoinLabel{ animation:none }
  .qcoinValue.paused{ animation:none }
  .qcoinExchangeBtn::before, .qcoinExchangeBtn::after{ animation:none }
}

.forumSingle { display: grid; gap: 16px; }
.panel { background: rgba(10,14,22,.96); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:12px; }
.panelTitle { margin:0 0 8px; font-weight:600; opacity:.9; }


.forumTopbar{
  display:flex; gap:8px; align-items:center; justify-content:space-between;
  margin-bottom:10px; flex-wrap:wrap;
}
.forumTopbar .left{ display:flex; gap:6px; align-items:center; }
.forumTopbar .right{ display:flex; gap:6px; align-items:center; }

/* РєР°СЂС‚РѕС‡РєРё РјРѕР¶РЅРѕ РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РёР· Р»РµРІРѕР№/РїСЂР°РІРѕР№ РєРѕР»РѕРЅРѕРє Р±РµР· РёР·РјРµРЅРµРЅРёР№ */

/* === Thread view: С„РёРєСЃ РѕР±СЂРµР·Р°РЅРёР№ СЃРїСЂР°РІР° Рё СЃС‚РѕРїСЂРѕС†РµРЅС‚РЅР°СЏ Р°РґР°РїС‚РёРІРЅРѕСЃС‚СЊ === */
.forum_root, .forum_root * { box-sizing: border-box; }

/* РљР»СЋС‡РµРІРѕРµ: РїРѕР·РІРѕР»СЏРµРј РґРµС‚СЏРј РІ grid/flex СЃР¶РёРјР°С‚СЊСЃСЏ, СѓР±РёСЂР°РµРј В«РЅРµРІРёРґРёРјСѓСЋВ» РїРѕР»РѕРІРёРЅСѓ */
.forum_root .body,
.forum_root .head,
.forum_root .title,
.forum_root .composer { max-width: 100%; min-width: 0; }

/* РЎРїРёСЃРѕРє РїРѕСЃС‚РѕРІ РІРЅСѓС‚СЂРё .body РјРѕР¶РµС‚ Р±С‹С‚СЊ grid/flex вЂ” С‚РѕР¶Рµ РґР°С‘Рј СЃР¶РёРјР°С‚СЊСЃСЏ */
.forum_root .body > .grid,
.forum_root .body > .flex { min-width: 0; }

/* РќР° РІСЃСЏРєРёР№ вЂ” РµСЃР»Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґРІСѓС…РєРѕР»РѕРЅРѕС‡РЅР°СЏ СЃРµС‚РєР° .grid2 */
.grid2 > * { min-width: 0; }

/* Р’РµСЂС‚РёРєР°Р»СЊРЅС‹Р№ СЃРєСЂРѕР»Р», Р° РїРѕ X вЂ” РЅРµ СЂРµР¶РµРј (РєРѕРЅС‚РµРЅС‚ СЃР°Рј СЃРѕР¶РјС‘С‚СЃСЏ) */
.forum_root .body { overflow-y: auto; overflow-x: visible; }

/* Р›РёРїРєРёР№ РєРѕРјРїРѕР·РµСЂ СЂР°СЃС‚СЏРіРёРІР°РµРј РїРѕ С€РёСЂРёРЅРµ РєРѕРЅС‚РµР№РЅРµСЂР°-СЃРєСЂРѕР»Р»Р° */
.forum_root .composer { left: 0; right: 0; width: auto; }

/* === FIX: РєРЅРѕРїРєРё РґРµР№СЃС‚РІРёР№ РІ РєР°СЂС‚РѕС‡РєР°С… РїРѕСЃС‚РѕРІ РІСЃРµРіРґР° РІ РѕРґРёРЅ СЂСЏРґ Рё СЃР¶РёРјР°СЋС‚СЃСЏ === */

/* 1) РЎС‚СЂР°С…СѓРµРј РєРѕРЅС‚РµР№РЅРµСЂС‹ РєР°СЂС‚РѕС‡РµРє РѕС‚ РѕР±СЂРµР·Р°РЅРёСЏ РєРѕРЅС‚РµРЅС‚Р° */
[id^="post_"],
[id^="post_"] > div,
.postCard {
  min-width: 0;         /* РїРѕР·РІРѕР»СЏРµС‚ flex-РґРµС‚СЏРј СЃР¶РёРјР°С‚СЊСЃСЏ */
  overflow: visible;    /* РёСЃРєР»СЋС‡Р°РµС‚ РІРЅСѓС‚СЂРµРЅРЅРµРµ В«РїРѕРґСЂРµР·Р°РЅРёРµВ» */
}

/* 2) Р СЏРґ СЃ РєРЅРѕРїРєР°РјРё РґРµР№СЃС‚РІРёР№ РїРѕСЃС‚Р°: Р·Р°РїСЂРµС‰Р°РµРј РїРµСЂРµРЅРѕСЃ, РґР°С‘Рј СЃР¶Р°С‚РёРµ */
[id^="post_"] .actions,
.postCard .actions,
.post .actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;    /* РЅРёРєРѕРіРґР° РЅРµ РїРµСЂРµРЅРѕСЃРёС‚СЊ РЅР° РІС‚РѕСЂСѓСЋ СЃС‚СЂРѕРєСѓ */
  min-width: 0;
  overflow: visible;
  white-space: nowrap;  /* С‚РµРєСЃС‚С‹ РЅР° РєРЅРѕРїРєР°С… РІ РѕРґРЅСѓ СЃС‚СЂРѕРєСѓ */
}
/* [ACTIONS-SHRINK-EXTRA] РµС‰С‘ СЃРёР»СЊРЅРµРµ СЂР°Р·СЂРµС€Р°РµРј СЃР¶Р°С‚РёРµ РЅР° СЃРІРµСЂС…СѓР·РєРёС… */
.post .actions .btn,
.post .actions .iconBtn {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
}
.post .actions .btn > span { 
  display: inline-block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 3) РЎР°РјРё РєРЅРѕРїРєРё: СЂР°Р·СЂРµС€Р°РµРј СЃР¶РёРјР°С‚СЊСЃСЏ, СѓРјРµРЅСЊС€Р°РµРј РїР°РґРґРёРЅРіРё Рё С€СЂРёС„С‚ РїРѕ РјРµСЂРµ СЃСѓР¶РµРЅРёСЏ */
[id^="post_"] .actions .btn,
[id^="post_"] .actions .iconBtn,
.postCard .actions .btn,
.postCard .actions .iconBtn,
.post .actions .btn,
.post .actions .iconBtn {
  flex: 0 1 auto;                    /* РјРѕР¶РЅРѕ СЃР¶РёРјР°С‚СЊСЃСЏ */
  min-width: 0;                      /* С‡С‚РѕР±С‹ РЅРµ РґРµСЂР¶Р°Р»Рё С€РёСЂРёРЅСѓ */
  height: clamp(26px, 4.2vw, 32px);  /* РЅРёР¶Рµ вЂ” СѓР¶Рµ РЅРµСѓРґРѕР±РЅРѕ РЅР°Р¶РёРјР°С‚СЊ */
  padding-inline: clamp(6px, 1.4vw, 12px);
  padding-block: 4px;
  font-size: clamp(11px, 1.6vw, 14px);
  line-height: 1;                    /* РєРѕРјРїР°РєС‚РЅРµРµ СЃС‚СЂРѕРєР° */
}

/* 4) Р•СЃР»Рё РІ РєРЅРѕРїРєРµ РµСЃС‚СЊ С‚РµРєСЃС‚РѕРІС‹Р№ СЃС‹РЅ вЂ” РїСѓСЃС‚СЊ РѕРЅ СѓР¶РёРјР°РµС‚СЃСЏ СЃ С‚СЂРѕРµС‚РѕС‡РёРµРј */
[id^="post_"] .actions .btn > span,
.postCard .actions .btn > span,
.post .actions .btn > span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 5) РќР° СЃРІРµСЂС…СѓР·РєРёС… вЂ” С‡СѓС‚СЊ СѓРјРµРЅСЊС€Р°РµРј Р·Р°Р·РѕСЂС‹, РЅРѕ РІСЃС‘ РµС‰С‘ РІ РѕРґРёРЅ СЂСЏРґ */
@media (max-width: 360px) {
  [id^="post_"] .actions,
  .postCard .actions,
  .post .actions {
    gap: 6px;
  }
  [id^="post_"] .actions .btn,
  [id^="post_"] .actions .iconBtn,
  .postCard .actions .btn,
  .postCard .actions .iconBtn,
  .post .actions .btn,
  .post .actions .iconBtn {
    padding-inline: clamp(4px, 1.2vw, 10px);
    font-size: clamp(10px, 1.4vw, 13px);
    height: clamp(24px, 3.8vw, 30px);
  }
}
/* === FIX: РїРµСЂРµРЅРѕСЃ РґР»РёРЅРЅС‹С… title/description РІ РєР°СЂС‚РѕС‡РєР°С… С‚РµРј === */

/* СЃС‚СЂР°С…СѓРµРј РєРѕРЅС‚РµР№РЅРµСЂС‹ РєР°СЂС‚РѕС‡РµРє С‚РµРј РѕС‚ В«СЂР°СЃС‚Р°Р»РєРёРІР°РЅРёСЏВ» СЃРѕСЃРµРґРµР№ */
[id^="topic_"],
.topicCard {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden; /* РЅРµ РґР°С‘Рј РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅС‹Р№ СЃРєСЂРѕР»Р» РёР·-Р·Р° РґР»РёРЅРЅС‹С… СЃР»РѕРІ */
}

/* Р·Р°РіРѕР»РѕРІРѕРє С‚РµРјС‹ */
[id^="topic_"] .title,
.topicCard .title,
[id^="topic_"] h2,
.topicCard h2,
[id^="topic_"] h3,
.topicCard h3 {
  white-space: normal !important;   /* СЂР°Р·СЂРµС€Р°РµРј РїРµСЂРµРЅРѕСЃ СЃС‚СЂРѕРє */
  overflow-wrap: anywhere;          /* РїРµСЂРµРЅРѕСЃРёРј РґР°Р¶Рµ В«СЃР»РёС‚РєРёВ» СЃРёРјРІРѕР»РѕРІ */
  word-break: break-word;           /* РєР»Р°СЃСЃРёС‡РµСЃРєРёР№ РїРµСЂРµРЅРѕСЃ РґР»РёРЅРЅС‹С… СЃР»РѕРІ */
  hyphens: auto;                    /* СЂР°СЃСЃС‚Р°РІР»СЏРµРј РјСЏРіРєРёРµ РїРµСЂРµРЅРѕСЃС‹ С‚Р°Рј, РіРґРµ РјРѕР¶РЅРѕ */
  min-width: 0;
  max-width: 100%;
}

/* РѕРїРёСЃР°РЅРёРµ С‚РµРјС‹ (РїРѕРґР·Р°РіРѕР»РѕРІРѕРє/РїСЂРµРІСЊСЋ) */
[id^="topic_"] .desc,
.topicCard .desc,
[id^="topic_"] .subtitle,
.topicCard .subtitle,
[id^="topic_"] p.topic-desc,
.topicCard p.topic-desc {
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  min-width: 0;
  max-width: 100%;
}

/* РµСЃР»Рё РІРЅСѓС‚СЂРё РїРѕРїР°РґР°СЋС‚СЃСЏ РґР»РёРЅРЅС‹Рµ URL вЂ” РЅРµ Р»РѕРјР°РµРј СЂР°СЃРєР»Р°РґРєСѓ, РЅРѕ РїРµСЂРµРЅРѕСЃРёРј */
[id^="topic_"] .title a,
[id^="topic_"] .desc  a,
.topicCard .title a,
.topicCard .desc  a {
  word-break: break-all;    /* Р°РґСЂРµСЃ РјРѕР¶РЅРѕ СЂСѓР±РёС‚СЊ РІ Р»СЋР±РѕРј РјРµСЃС‚Рµ */
  overflow-wrap: anywhere;
  text-decoration: inherit;
}

/* РЅР° СЃРІРµСЂС…СѓР·РєРёС… вЂ” СЃР»РµРіРєР° СѓРјРµРЅСЊС€Р°РµРј РјРµР¶СЃС‚СЂРѕС‡РЅС‹Рµ/РѕС‚СЃС‚СѓРїС‹, С‡С‚РѕР±С‹ С‚РµРєСЃС‚ В«СѓРјРµС‰Р°Р»СЃСЏ РєСЂР°СЃРёРІРѕВ» */
@media (max-width: 360px) {
  [id^="topic_"] .title,
  .topicCard .title { line-height: 1.15; }
  [id^="topic_"] .desc,
  .topicCard .desc  { line-height: 1.2; }
}
/* === HARD FIX: С‚РµРјС‹ РЅРµ РІС‹Р»РµР·Р°СЋС‚, Р»СЋР±С‹Рµ РґР»РёРЅРЅС‹Рµ СЃС‚СЂРѕРєРё РїРµСЂРµРЅРѕСЃСЏС‚СЃСЏ === */

/* 0) РЎС‚СЂР°С…СѓРµРј РєР°СЂС‚РѕС‡РєСѓ С‚РµРјС‹ Рё РІСЃРµС… РµС‘ РґРµС‚РµР№: РјРѕР¶РЅРѕ СЃР¶РёРјР°С‚СЊСЃСЏ, РЅРµР»СЊР·СЏ СЂР°СЃРїРёС…РёРІР°С‚СЊ */
[id^="topic_"],
.topicCard {
  max-width: 100% !important;
  min-width: 0 !important;
  overflow-x: hidden !important;
}
[id^="topic_"] * ,
.topicCard * {
  min-width: 0 !important;            /* РєР»СЋС‡ Рє РЅРѕСЂРјР°Р»СЊРЅРѕРјСѓ СЃР¶Р°С‚РёСЋ РІРѕ flex/grid */
}

/* 1) РЎР°Рј Р·Р°РіРѕР»РѕРІРѕРє С‚РµРјС‹ вЂ” Р»РѕРјР°РµРј РґР°Р¶Рµ В«РѕРѕРѕРѕРѕРѕРѕРѕВ» Рё РґР»РёРЅРЅС‹Рµ URL/СЃР»РёС‚РєРё */
[id^="topic_"] .title,
.topicCard .title,
[id^="topic_"] h1, [id^="topic_"] h2, [id^="topic_"] h3,
.topicCard h1, .topicCard h2, .topicCard h3 {
  display: block;
  white-space: normal !important;
  overflow-wrap: anywhere !important;  /* РіР»Р°РІРЅС‹Р№ РіРµСЂРѕР№ */
  word-break: break-word !important;   /* РєР»Р°СЃСЃРёРєР° */

  hyphens: auto;
  max-width: 100%;

} 


/* РўРµРєСЃС‚РѕРІС‹Рµ СѓР·Р»С‹ РІРЅСѓС‚СЂРё Р·Р°РіРѕР»РѕРІРєР° (span/a/strong Рё С‚.Рї.) вЂ” С‚РѕР¶Рµ Р»РѕРјР°РµРј */
[id^="topic_"] .title *, .topicCard .title * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
}

/* 2) РћРїРёСЃР°РЅРёРµ С‚РµРјС‹ вЂ” С‚Рµ Р¶Рµ РїСЂР°РІРёР»Р° */
[id^="topic_"] .desc,
.topicCard .desc,
[id^="topic_"] .subtitle,
.topicCard .subtitle,
[id^="topic_"] p.topic-desc,
.topicCard p.topic-desc {
  display: block;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
  hyphens: auto;
  max-width: 100%;
}

/* Р›СЋР±С‹Рµ СЃСЃС‹Р»РєРё РІРЅСѓС‚СЂРё title/desc вЂ” РїРѕР·РІРѕР»СЏРµРј СЂСѓР±РёС‚СЊ РІ Р»СЋР±РѕРј РјРµСЃС‚Рµ */
[id^="topic_"] .title a,
[id^="topic_"] .desc a,
.topicCard .title a,
.topicCard .desc a {
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
}

/* 3) Р•СЃР»Рё С€Р°РїРєР° РєР°СЂС‚РѕС‡РєРё вЂ” flex/grid: РєРѕРЅС‚РµРЅС‚РЅР°СЏ РєРѕР»РѕРЅРєР° РґРѕР»Р¶РЅР° РёРјРµС‚СЊ min-width:0 */
[id^="topic_"] .header,
.topicCard .header,
[id^="topic_"] .content,
.topicCard .content {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden;                   /* РЅР° РІСЃСЏРєРёР№, С‡С‚РѕР±С‹ РЅРµ РїРѕСЏРІР»СЏР»СЃСЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅС‹Р№ СЃРєСЂРѕР»Р» */
}

/* 4) Р‘РµР№РґР¶Рё/Р°РІР°С‚Р°СЂ РЅРµ С‚СЏРЅСѓС‚ С€РёСЂРёРЅСѓ: РЅРµ СЂР°СЃС‚СЏРіРёРІР°СЋС‚СЃСЏ Рё РЅРµ Р»РѕРјР°СЋС‚ СЃС‚СЂРѕРєСѓ */
[id^="topic_"] .avatar,
.topicCard .avatar,
[id^="topic_"] .badge,
.topicCard .badge {
  flex: 0 0 auto;
}

/* 5) РќР° СЃРІРµСЂС…СѓР·РєРёС… вЂ” СѓРјРµРЅСЊС€Р°РµРј РјРµР¶СЃС‚СЂРѕС‡РЅС‹Рµ, С‡С‚РѕР±С‹ РІРёР·СѓР°Р»СЊРЅРѕ Р°РєРєСѓСЂР°С‚РЅРѕ СѓРјРµС‰Р°Р»РѕСЃСЊ */
@media (max-width: 360px) {
  [id^="topic_"] .title,
  .topicCard .title { line-height: 1.15; }
  [id^="topic_"] .desc,
  .topicCard .desc  { line-height: 1.2; }
}
/* === FORCE WRAP for topic title/desc (РїРµСЂРµРєСЂС‹РІР°РµРј СЃС‚Р°СЂС‹Рµ РїСЂР°РІРёР»Р°) === */
.topicTitle, .topicTitle * {
  white-space: normal !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;

  max-width: 100% !important;
}
.topicDesc, .topicDesc * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;

  max-width: 100% !important;
}

/* OWNER kebab/menu вЂ” РѕР±С‰РёР№ РґР»СЏ С‚РµРј Рё РїРѕСЃС‚РѕРІ */
 .ownerKebab { 
   position: absolute; 
   right: 8px; 
   top: 8px; 
   z-index: 80;              /* РІС‹С€Рµ РєР»РёРєР°Р±РµР»СЊРЅС‹С… РѕРІРµСЂР»РµРµРІ РєР°СЂС‚РѕС‡РєРё */
   pointer-events: auto;     /* РЅР° СЃР»СѓС‡Р°Р№ РµСЃР»Рё СЂРѕРґРёС‚РµР»СЊ/РѕРІРµСЂР»РµР№ РІРјРµС€РёРІР°РµС‚СЃСЏ */
 }
.kebabBtn{
  width:28px; height:28px; border:0; border-radius:6px;
  background:rgba(255,255,255,.06); color:#eaf4ff; cursor:pointer;
   pointer-events: auto;
   touch-action: manipulation; /* Р±С‹СЃС‚СЂРµРµ/С‡РёС‰Рµ РєР»РёРє РЅР° РјРѕР±РёР»Рµ */  
}
.kebabBtn:hover{ filter:brightness(1.1); }
.ownerMenu{
position:absolute; right:30px; top:0px; display:flex; flex-direction:column; gap:6px; 
padding:8px; background:rgba(12,18,34,.96); border:1px solid rgba(170,200,255,.14);
  border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:20; visibility:hidden;
 pointer-events: auto;
  }
 /* RTL: Р·РµСЂРєР°Р»РёРј РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРёРµ в‹® Рё РІС‹РїР°РґР°СЋС‰РµРіРѕ РјРµРЅСЋ */
 [dir="rtl"] .ownerKebab{ right:auto; left:8px; }
 [dir="rtl"] .ownerMenu{ right:auto; left:30px; }

.ownerKebab:focus-within .ownerMenu,
.ownerKebab:hover .ownerMenu{ visibility:visible; }

 /* owner menu: РѕР±С‹С‡РЅС‹Рµ РєРЅРѕРїРєРё (РЅР°РїСЂРёРјРµСЂ вњЏпёЏ) вЂ” Р±РµР· СЃРµСЂРѕРіРѕ С„РѕРЅР° */
 .ownerMenu button:not(.danger){
   background: transparent !important;
   box-shadow: none !important;
   -webkit-appearance: none;
   appearance: none;
 }
.ownerMenu .danger{
  padding:8px 10px; border-radius:8px; background:rgba(255,60,60,.12); color:#ff6a6a; border:1px solid rgba(255,80,80,.25);
}
.ownerMenu .danger:hover{ filter:brightness(1.1) saturate(1.05); }

/* === confirm delete mini-overlay (portal) === */
.confirmOverlayRoot{
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0,0,0,0); /* РїСЂРѕР·СЂР°С‡РЅР°СЏ Р»РѕРІСѓС€РєР° РєР»РёРєРѕРІ */
}
.confirmPop{
  position: absolute;
  width: 270px;
  max-width: calc(100vw - 16px);
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(12,18,34,.98);
  border: 1px solid rgba(170,200,255,.16);
  box-shadow: 0 10px 30px rgba(0,0,0,.45);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.confirmPopText{
  font-size: 15px;
  color: rgb(255, 255, 255);
  line-height: 1.25;
}
.confirmPopBtns{
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.confirmPopBtn{
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(170,200,255,.16);
  background: rgba(255,255,255,.06);
  color: #eaf4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.confirmPopBtn:hover{ filter: brightness(1.08); }
.confirmPopBtn.ok{
  border-color: rgb(43, 255, 0);
  background: rgba(255, 0, 0, 0.29);
}
.confirmPopBtn.ok:hover{ filter: brightness(1.12) saturate(1.08); }
.confirmPopBtn svg{ width: 18px; height: 18px; }
.dmConfirmOverlay{
  background: rgba(5,8,14,.35);
  backdrop-filter: blur(2px);
}
.dmConfirmPop{
  position:absolute;
  width:320px;
  max-width:calc(100vw - 16px);
  padding:12px 14px;
  border-radius:14px;
  background: linear-gradient(160deg, rgba(12,20,34,.98), rgba(6,10,18,.98));
  border:1px solid rgba(140,190,255,.22);
  box-shadow: 0 18px 36px rgba(0,0,0,.45), 0 0 26px rgba(80,160,255,.18);
  backdrop-filter: blur(10px) saturate(140%);
  display:flex;
  flex-direction:column;
  gap:10px;
  animation: dmPopIn .16s ease-out;
}
.dmConfirmPop::before{
  content:'';
  position:absolute;
  inset:0;
  border-radius:inherit;
  background: radial-gradient(140% 120% at 0% 0%, rgba(120,200,255,.22), transparent 55%);
  opacity:.7;
  pointer-events:none;
}
.dmConfirmPop > *{ position:relative; z-index:1; }
.videoLimitPop{
  position: relative;
  width: min(520px, calc(100vw - 18px));
  margin: max(8px, env(safe-area-inset-top, 0px)) auto;
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(12,20,34,.98), rgba(6,10,18,.98));
  border: 1px solid rgba(140,190,255,.22);
  box-shadow: 0 18px 36px rgba(0,0,0,.45), 0 0 26px rgba(80,160,255,.18);
  backdrop-filter: blur(10px) saturate(140%);
  color: #eaf4ff;
}
.videoLimitTitle{
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
}
.videoLimitBody{
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.35;
  color: #d9ecff;
}
.videoLimitMeta{
  margin-top: 8px;
  font-size: 12px;
  color: #b9d4f5;
}
.videoLimitTipsTitle{
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: #eaf4ff;
}
.videoLimitTips{
  margin: 6px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 5px;
  font-size: 12px;
  color: #cfe4ff;
}
.videoLimitActions{
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.dmConfirmTitle{
  font-size:14px;
  font-weight:900;
  letter-spacing:.04em;
  text-transform:uppercase;
  color:#eaf4ff;
}
.dmConfirmText{
  font-size:13px;
  line-height:1.35;
  color:#d9ecff;
}
.dmConfirmCheck{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color:#cfe4ff;
}
.dmConfirmCheck input{
  width:16px;
  height:16px;
  accent-color:#7fd7ff;
}
.dmConfirmActions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
}
.dmConfirmBtn{
  border:1px solid rgba(140,190,255,.25);
  background: rgba(255,255,255,.05);
  color:#eaf4ff;
  padding:6px 12px;
  border-radius:10px;
  font-size:12px;
  font-weight:800;
  letter-spacing:.02em;
  cursor:pointer;
  transition: transform .12s ease, filter .12s ease, box-shadow .18s ease;
}
.dmConfirmBtn:hover{ filter:brightness(1.08) saturate(1.08); box-shadow:0 0 16px rgba(80,167,255,.25); }
.dmConfirmBtn:active{ transform:translateY(1px) scale(.98); }
.dmConfirmBtn.primary{
  border-color: rgba(140,200,255,.65);
  background: linear-gradient(120deg, rgba(40,140,255,.65), rgba(100,200,255,.35));
  color:#0b1b2e;
  text-shadow:0 0 8px rgba(255,255,255,.4);
}
.dmConfirmBtn.primary:hover{ filter:brightness(1.1) saturate(1.1); }
.dmConfirmBtn.ghost{ background: transparent; color:#d6e9ff; }
@keyframes dmPopIn{
  0%{ opacity:0; transform: translateY(6px) scale(.98); }
  100%{ opacity:1; transform: translateY(0) scale(1); }
}
/* [FOCUS_TOOLS_STYLES:BEGIN] вЂ” РїР°РЅРµР»СЊ РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ РєРѕРјРїРѕР·РµСЂР° РїРѕ С„РѕРєСѓСЃСѓ */
.composer .tools{
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height .2s ease, opacity .2s ease;
}
.composer[data-active="true"] .tools{
  max-height: 480px; /* РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РґР»СЏ 2-3 СЂСЏРґРѕРІ */
  opacity: 1;
  pointer-events: auto;
}
/* [FOCUS_TOOLS_STYLES:END] */
/* === sticky bottom fix === */
.forum_root[data-view="topics"] .body { padding-bottom: 0 !important; margin-bottom: 0 !important; }
.forum_root[data-view="thread"] .body { padding-bottom: 96px !important; } /* РІС‹СЃРѕС‚Р° РєРѕРјРїРѕР·РµСЂР° + С‡СѓС‚СЊ РІРѕР·РґСѓС…Р° */
.forum_root .body > :last-child { margin-bottom: 0 !important; }

/* title wrap in thread header */
.forum_root .head .title,
.forum_root .head .title * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
  min-width: 0;
}
/* [STICKY-HEADER] РІРµСЂС…РЅРёР№ Р±Р»РѕРє РІСЃРµРіРґР° РїСЂРёР»РёРїР°РµС‚ Рє РІРµСЂС…Сѓ РѕРєРЅР° РїСЂРѕРєСЂСѓС‚РєРё С„РѕСЂСѓРјР° */
.forum_root .head {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--glass, rgba(8,13,20,.94));
  backdrop-filter: saturate(140%) blur(8px);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid rgba(255,255,255,.06);
}
/* [BACK-TO-TOP] РїР»Р°РІР°СЋС‰Р°СЏ РєРЅРѕРїРєР° РЅР°РІРµСЂС… (РЅР°Рґ РєРѕРјРїРѕР·РµСЂРѕРј) */
.backToTop{
  position: fixed;
  right: clamp(12px, 3vw, 20px);
  bottom: clamp(110px, 12vh, 140px);
  z-index: 40;
  padding: .55rem .7rem;
  font-size: 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(20,26,36,.8);
  color: #fff;
  box-shadow: 0 6px 20px rgba(0,0,0,.35);
  transition: transform .2s ease, opacity .2s ease;
}
.backToTop:hover{ transform: translateY(-1px); }
@media (max-width: 480px){
  .backToTop{ bottom: clamp(84px, 16dvh, 120px); }
}
/* === PostCard: РїРµСЂРµРІРѕРґ С‚РµРєСЃС‚Р° === */
.translateToggleBtn {
  position: relative;
  display: flex;                 /* СЂР°СЃС‚СЏРіРёРІР°РµРј РєРѕРЅС‚РµРЅС‚ РїРѕ С€РёСЂРёРЅРµ */
  align-items: center;
  justify-content: center;       /* С‚РµРєСЃС‚ Рё РёРєРѕРЅРєРё РїРѕ С†РµРЅС‚СЂСѓ */

  width: 100%;                   /* Р’РЎРЇ С€РёСЂРёРЅР° РєР°СЂС‚РѕС‡РєРё */
  box-sizing: border-box;
  margin-top: 8px;               /* РѕС‚СЃС‚СѓРї РѕС‚ РґР°С‚С‹ */
  margin-left: 0;                /* Р±РѕР»СЊС€Рµ РЅРµ РЅСѓР¶РµРЅ СЃРјРµС‰Р°СЋС‰РёР№ left */

  gap: 8px;                      /* Сѓ С‚РµР±СЏ Р±С‹Р»Рѕ 70x вЂ” РѕРїРµС‡Р°С‚РєР° */
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background:
    radial-gradient(circle at top left, rgba(0, 200, 255, 0.22), rgba(7, 10, 24, 0.96));
  color: #e5f2ff;
  font-size: 15px;
  line-height: 1.1;
  cursor: pointer;
  overflow: hidden;
  opacity: 0.9;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease,
    transform 0.12s ease,
    opacity 0.12s ease;
}

.translateToggleBtn:hover:not(:disabled) {

  box-shadow: 0 0 18px rgba(0, 200, 255, 0.75);
  border-color: rgba(0, 200, 255, 0.95);
  background:
    linear-gradient(120deg, rgba(0, 200, 255, 0.35), rgba(255, 188, 56, 0.45));
  opacity: 1;
}

.translateToggleBtnOn {
  border-color: rgba(255, 188, 56, 0.95);
  box-shadow: 0 0 20px rgba(255, 188, 56, 0.75);
  background:
    linear-gradient(120deg, rgba(255, 188, 56, 0.5), rgba(0, 200, 255, 0.35));
}

.translateToggleBtn:disabled {
  cursor: default;
  opacity: 0.6;
  box-shadow: none;
}

.translateToggleIcon {
  font-size: 13px;
}

/* С‚РµРєСЃС‚ РІРЅСѓС‚СЂРё вЂ” РїРѕРґ РѕР±СЂРµР·, С‡С‚РѕР±С‹ РЅР° РјР°Р»РµРЅСЊРєРёС… СЌРєСЂР°РЅР°С… РЅРµ Р»РѕРјР°Р»Рѕ СЂР°Р·РјРµС‚РєСѓ */
.translateToggleText {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Р°РґР°РїС‚РёРІ: С‡СѓС‚СЊ РјРµРЅСЊС€Рµ С€СЂРёС„С‚ Рё РїР°РґРґРёРЅРіРё РЅР° СѓР·РєРёС… СЌРєСЂР°РЅР°С… */
@media (max-width: 640px) {
  .translateToggleBtn {
    padding: 8px 10px;
    font-size: 13px;
  }
}

/* РєРѕРјРїР°РєС‚РЅРµРµ, С‡РµРј .btnSm вЂ” РїРѕРґ РёРєРѕРЅРєРё/СЃС‡С‘С‚С‡РёРєРё */
.btnXs{
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1;
  height: 26px;            /* СѓРґРѕР±РЅС‹Р№ РјРёРЅРёРјСѓРј */
  border-radius: 10px;
}
@media (max-width:360px){
  .btnXs{ padding: 2px 5px; font-size: 10px; height: 24px; }
}
  /* РџРѕР»РѕСЃР° РґРµР№СЃС‚РІРёР№ РїРѕСЃС‚Р°: РєРЅРѕРїРєРё Р·Р°РЅРёРјР°СЋС‚ РґРѕСЃС‚СѓРїРЅСѓСЋ С€РёСЂРёРЅСѓ Рё СЃР¶РёРјР°СЋС‚СЃСЏ Р±РµР· СЃРєСЂРѕР»Р»Р° */
  .actionBar > * { min-width: 0; }                /* РґРµС‚СЏРј СЂР°Р·СЂРµС€Р°РµРј СЃР¶РёРјР°С‚СЊСЃСЏ */
  .actionBar .btnXs { flex: 1 1 0; min-width: 0; }/* СЃР°РјРё РјР°Р»РµРЅСЊРєРёРµ РєРЅРѕРїРєРё вЂ” РіРёР±РєРёРµ */
.actionBar .tag  { min-width: 0; }              /* СЃС‡С‘С‚С‡РёРєРё С‚РѕР¶Рµ РЅРµ С„РёРєСЃРёСЂСѓРµРј */
.actionBar .reactionBtnLike,
.actionBar .reactionBtnDislike{
  transition: background .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease, opacity .2s ease, transform .12s ease;
}
.actionBar .reactionBtnActive{
  background: linear-gradient(180deg, rgba(10,14,24,.95), rgba(6,10,18,.95)) !important;
  border-color: rgba(120,140,170,.42) !important;
  color: rgba(165,182,210,.95) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.03),
    inset 0 0 0 1px rgba(0,0,0,.35),
    0 0 10px rgba(40,52,78,.35) !important;
  opacity: .92;
  cursor: not-allowed !important;
  filter: saturate(.72);
}
.actionBar .reactionBtnActive:hover,
.actionBar .reactionBtnActive:active{
  transform: none !important;
  filter: saturate(.72) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.03),
    inset 0 0 0 1px rgba(0,0,0,.35),
    0 0 10px rgba(40,52,78,.35) !important;
}
.actionBar .reactionBtnOpposite{
  box-shadow: 0 0 14px rgba(95,165,255,.18);
}

/* ===== PostCard emoji FX (QCast INSANE lite, pooled & fast) ===== */
.postFxLayer{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:8;
  overflow:visible;
  contain: paint;
}
.postFx{
  position:absolute;
  transform:translate3d(-50%,-50%,0);
  font-size:clamp(22px, 4.6vw, 44px);

  /* vars from JS */
  --dx: 60px;
  --dy: -260px;
  --rot: 18deg;
  --sc0: .55;
  --sc1: 1.55;
  --dur: 1200ms;
  --delay: 0ms;
  --hue: 0deg;
  --glow: 1.0;
  --trail: "вњ¦";

  opacity:0;
  will-change: transform, opacity;
  backface-visibility:hidden;

  /* IMPORTANT: РЅРµ Р°РЅРёРјРёСЂСѓРµРјСЃСЏ РЅР° РјР°СѓРЅС‚Рµ (РёРЅР°С‡Рµ РІСЃРїС‹С€РєРё РІ (0,0) РїСЂРё СЃРєСЂРѕР»Р»Рµ) */
  animation:none;
  /* premium glow without blur */
  filter:
    hue-rotate(var(--hue))
    drop-shadow(0 0 calc(12px * var(--glow)) rgba(0,245,255,.20))
    drop-shadow(0 0 calc(14px * var(--glow)) rgba(178,0,255,.12));

  text-shadow:
    0 0 12px rgba(255,255,255,.08),
    -8px 8px 16px rgba(0,245,255,.08),
    10px -10px 18px rgba(178,0,255,.08);
  }

/* РђРЅРёРјР°С†РёСЏ РІРєР»СЋС‡Р°РµС‚СЃСЏ РўРћР›Р¬РљРћ РєРѕРіРґР° РјС‹ СЏРІРЅРѕ Р·Р°Р¶РёРіР°РµРј РЅРѕРґСѓ */
.postFx.isLive{
  animation:
    postFxAlpha var(--dur) cubic-bezier(.16,.9,.22,1) forwards,
    postFxCore  var(--dur) cubic-bezier(.12,.95,.2,1) forwards;
  animation-delay: var(--delay), var(--delay);
}    
.postFx--bad{
  filter:
    hue-rotate(var(--hue))
    drop-shadow(0 0 calc(12px * var(--glow)) rgba(255,80,120,.18))
    drop-shadow(0 0 calc(14px * var(--glow)) rgba(178,0,255,.10));
  text-shadow:
    0 0 12px rgba(255,255,255,.06),
    -8px 8px 16px rgba(255,80,120,.08),
    10px -10px 18px rgba(178,0,255,.08);
}
.postFx::after{
  content: var(--trail);
  position:absolute;
  left:50%;
  top:50%;
  transform: translate3d(-50%,-50%,0) scale(.72);
  font-size: .6em;
  opacity:0;
  pointer-events:none;
  filter: drop-shadow(0 0 16px rgba(255,255,255,.10)) drop-shadow(0 0 18px rgba(178,0,255,.12));
  /* IMPORTANT: trail С‚РѕР¶Рµ РЅРµ РґРѕР»Р¶РµРЅ Р¶РёС‚СЊ РЅР° РјР°СѓРЅС‚Рµ */
  animation:none;
}
.postFx.isLive::after{
  animation: postFxTrail var(--dur) cubic-bezier(.18,.86,.22,1) forwards;
  animation-delay: var(--delay);
}
@keyframes postFxAlpha{
  0%{opacity:0}
  10%{opacity:1}
  72%{opacity:.92}
  100%{opacity:0}
}
@keyframes postFxTrail{
  0%{ opacity:0; transform:translate3d(-50%,-50%,0) scale(.55); }
  18%{ opacity:.85; transform:translate3d(calc(-50% - 10px),calc(-50% + 12px),0) scale(1.10); }
  55%{ opacity:.32; transform:translate3d(calc(-50% + 18px),calc(-50% - 16px),0) scale(.90); }
  100%{ opacity:0; transform:translate3d(calc(-50% + 34px),calc(-50% - 30px),0) scale(.62); }
}
/* motion variants */
.postFx--float{  animation-name: postFxAlpha, postFxFloat;  }
.postFx--spiral{ animation-name: postFxAlpha, postFxSpiral; }
.postFx--rocket{ animation-name: postFxAlpha, postFxRocket; }
.postFx--zigzag{ animation-name: postFxAlpha, postFxZigzag; }
.postFx--bounce{ animation-name: postFxAlpha, postFxBounce; }
.postFx--snap{   animation-name: postFxAlpha, postFxSnap;   }
.postFx--wave{   animation-name: postFxAlpha, postFxWave;   }
.postFx--drift{  animation-name: postFxAlpha, postFxDrift;  }

@keyframes postFxCore{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .90)) rotate(calc(var(--rot) * 1.2)); }
}
@keyframes postFxFloat{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  60%{ transform:translate3d(calc(-50% + (var(--dx) * .45)),calc(-50% + (var(--dy) * .60)),0) scale(calc(var(--sc1) * .86)) rotate(calc(var(--rot) * .8)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .92)) rotate(calc(var(--rot) * 1.25)); }
}
@keyframes postFxSpiral{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(0deg); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(calc(var(--rot) * .8)); }
  50%{ transform:translate3d(calc(-50% + (var(--dx) * -.15)),calc(-50% + (var(--dy) * .55)),0) scale(calc(var(--sc1) * .82)) rotate(calc(var(--rot) * 2.9)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .92)) rotate(calc(var(--rot) * 4.6)); }
}
@keyframes postFxRocket{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  10%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  35%{ transform:translate3d(calc(-50% + (var(--dx) * .18)),calc(-50% + (var(--dy) * .78)),0) scale(calc(var(--sc1) * .78)) rotate(calc(var(--rot) * 1.35)); }
  100%{ transform:translate3d(calc(-50% + (var(--dx) * .32)),calc(-50% + (var(--dy) * 1.18)),0) scale(calc(var(--sc0) * .72)) rotate(calc(var(--rot) * 1.95)); }
}
@keyframes postFxZigzag{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  32%{ transform:translate3d(calc(-50% + (var(--dx) * -.42)),calc(-50% + (var(--dy) * .30)),0) scale(calc(var(--sc1) * .88)) rotate(calc(var(--rot) * 1.35)); }
  55%{ transform:translate3d(calc(-50% + (var(--dx) * .58)),calc(-50% + (var(--dy) * .60)),0) scale(calc(var(--sc1) * .78)) rotate(calc(var(--rot) * 2.2)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .90)) rotate(calc(var(--rot) * 3.25)); }
}
@keyframes postFxBounce{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.15)); }
  14%{ transform:translate3d(-50%,-50%,0) scale(calc(var(--sc1) * 1.06)) rotate(var(--rot)); }
  42%{ transform:translate3d(calc(-50% + (var(--dx) * .26)),calc(-50% + (var(--dy) * .42)),0) scale(calc(var(--sc1) * .90)) rotate(calc(var(--rot) * 1.05)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .86)) rotate(calc(var(--rot) * 1.85)); }
}
@keyframes postFxSnap{
  0%{ transform:translate3d(-50%,-50%,0) scale(.34) rotate(0deg); }
  9%{ transform:translate3d(-50%,-50%,0) scale(calc(var(--sc1) * 1.18)) rotate(calc(var(--rot) * .7)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(.76) rotate(calc(var(--rot) * 1.55)); }
}
@keyframes postFxWave{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  20%{ transform:translate3d(calc(-50% + (var(--dx) * .10)),calc(-50% + (var(--dy) * .20)),0) scale(var(--sc1)) rotate(calc(var(--rot) * .85)); }
  40%{ transform:translate3d(calc(-50% + (var(--dx) * -.26)),calc(-50% + (var(--dy) * .44)),0) scale(calc(var(--sc1) * .88)) rotate(calc(var(--rot) * 1.6)); }
  65%{ transform:translate3d(calc(-50% + (var(--dx) * .40)),calc(-50% + (var(--dy) * .74)),0) scale(calc(var(--sc1) * .76)) rotate(calc(var(--rot) * 2.55)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .90)) rotate(calc(var(--rot) * 3.35)); }
}
@keyframes postFxDrift{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.10)); }
  18%{ transform:translate3d(calc(-50% + (var(--dx) * .10)),calc(-50% + (var(--dy) * .20)),0) scale(var(--sc1)) rotate(calc(var(--rot) * .6)); }
  55%{ transform:translate3d(calc(-50% + (var(--dx) * .65)),calc(-50% + (var(--dy) * .55)),0) scale(calc(var(--sc1) * .70)) rotate(calc(var(--rot) * 1.35)); }
  100%{ transform:translate3d(calc(-50% + (var(--dx) * .35)),calc(-50% + (var(--dy) * 1.05)),0) scale(calc(var(--sc0) * .82)) rotate(calc(var(--rot) * 2.25)); }
}
.postBoom{
  position:absolute;
  left:0; top:0;
  width:12px; height:12px;
  transform:translate3d(-50%,-50%,0) scale(.2);
  border-radius:999px;
  opacity:0;
  --bDur: 480ms;
  --bGlow: 1.0;
  --bHue: 0deg;
  border: 2px solid rgba(0,245,255,.32);
  box-shadow:
    0 0 calc(20px * var(--bGlow)) rgba(0,245,255,.14),
    0 0 calc(24px * var(--bGlow)) rgba(178,0,255,.10);
  filter: hue-rotate(var(--bHue));
  will-change: transform, opacity;
  /* IMPORTANT: РЅРµ Р°РЅРёРјРёСЂРѕРІР°С‚СЊ РЅР° РјР°СѓРЅС‚Рµ */
  animation:none;
}
.postBoom.isLive{
  animation: postBoom var(--bDur) cubic-bezier(.14,.9,.22,1) forwards;
}
.postBoom--bad{
  border-color: rgba(255,80,120,.26);
  box-shadow:
    0 0 calc(20px * var(--bGlow)) rgba(255,80,120,.12),
    0 0 calc(24px * var(--bGlow)) rgba(178,0,255,.09);
}
@keyframes postBoom{
  0%{ opacity:0; transform:translate3d(-50%,-50%,0) scale(.16); }
  12%{ opacity:.88; transform:translate3d(-50%,-50%,0) scale(.55); }
  100%{ opacity:0; transform:translate3d(-50%,-50%,0) scale(4.1); }
}
@media (prefers-reduced-motion: reduce){
  .postFx, .postBoom{ animation:none !important; opacity:0 !important; }
}

/* ---- VOICE dock ---- */
.forumComposer { position: relative; --voice-size: 48px; --voice-right: 10px; }

.voiceDock{
  position:absolute;
  right: var(--voice-right);
  bottom: calc(-1 * (var(--voice-size) - 4px));
  display:inline-flex; align-items:center; gap:8px;
  pointer-events:auto;
  height: var(--voice-size);
  z-index: 1; /* РЅРёР¶Рµ РїРѕРїРѕРІРµСЂРѕРІ/С‚РѕСЃС‚РѕРІ */
}

/* РїСЂСЏС‡РµРј РґРѕРє, РєРѕРіРґР° РєРѕРјРїРѕР·РµСЂ РЅРµ Р°РєС‚РёРІРµРЅ */
.composer:not([data-active="true"]) .voiceDock{
  opacity: 0; pointer-events: none;
  transform: translateY(4px) scale(.98);
  transition: opacity .12s ease, transform .12s ease;
}
.composer[data-active="true"] .voiceDock{
  opacity: 1; pointer-events: auto;
  transition: opacity .12s ease, transform .12s ease;
}

/* РєРЅРѕРїРєР° РјРёРєСЂРѕС„РѕРЅР° */
.voiceBtn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  width:var(--voice-size); height:var(--voice-size);
  border-radius:50%; border:0; background:transparent;
  color:#cfe0ff; cursor:pointer;
  transition: transform .12s ease, filter .18s ease;
}
.voiceBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.voiceBtn:active{ transform:translateY(1px) scale(.98); }

/* Р·Р°РїРёСЃСЊ */
.voiceBtn.rec{

  box-shadow:0 0 0 2px rgba(255,90,90,.9), 0 0 14px 2px rgba(255,90,90,.25);
  color:#ffd1d1;
}
.voiceBtn .recDot{
  position:absolute; top:6px; right:6px; width:7px; height:7px; border-radius:50%;
  background:#ff5959; box-shadow:0 0 6px rgba(255,0,0,.75);
}

/* Р°РІС‚Рѕ-РјР°СЃС€С‚Р°Р± РёРєРѕРЅРєРё РїРѕРґ СЂР°Р·РјРµСЂ РєРЅРѕРїРєРё */
.voiceBtn svg{
  width:calc(var(--voice-size)*.46);
  height:calc(var(--voice-size)*.46);
}
    .micBtn { position: relative; }
    .micBtn .micTimer{
      position:absolute; top:-30px; left:50%; transform:translateX(-50%);
      font-size:11px; line-height:1; padding:5px 10px; border-radius:4px;
      background:rgba(252, 0, 0, 0.34); color:#fff; pointer-events:none;
    }
/* Р±РµР№РґР¶-Р·Р°РјРѕРє: РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ СЃРєСЂС‹С‚ */
.voiceBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:none; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
  pointer-events:none; z-index:2; /* РїРѕРІРµСЂС… svg */
}
/* РїРѕРєР°Р·Р°С‚СЊ Р·Р°РјРѕРє, РєРѕРіРґР° РЅРµС‚ VIP вЂ” СЂРѕРІРЅРѕ РєР°Рє Сѓ СЃРєСЂРµРїРєРё */
.voiceBtn[data-locked="true"] .lockBadge{
  display:inline-flex;
}
/* С‚Р°Р№РјРµСЂ-РїРёР»СЋР»СЏ РЅР°Рґ РєРЅРѕРїРєРѕР№ */
.voiceTimerPill{
  position:absolute; right:0; bottom:calc(var(--voice-size) + 8px);
  padding:4px 10px; border-radius:999px;
  font:600 12px/1 ui-monospace,monospace;
  color:#ffecec;
  background:rgba(255,80,80,.22);
  border:1px solid rgba(255,120,120,.45);
  box-shadow:0 6px 16px rgba(255,80,80,.18), inset 0 0 0 1px rgba(255,255,255,.04);
  backdrop-filter: blur(6px) saturate(120%);
}

/* ---- AUDIO card (РїСЂРµРІСЊСЋ + РїРѕСЃС‚) ---- */
.audioCard{
  position:relative;
  display:flex; align-items:center; gap:10px;
  padding:10px 12px; border-radius:12px;
  background:linear-gradient(180deg, rgba(18,26,46,.45), rgba(12,18,34,.35));
  border:1px solid rgba(160,180,255,.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.03), 0 10px 30px rgba(10,20,40,.22);
  backdrop-filter: blur(8px) saturate(120%);
}
  .audioCard.mediaBox{
  display:block;
  padding:0;
  border-radius:12px;
}
.audioCard.preview{ max-width:min(100%); height:100px; }

.audioIcon{
  width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center;
  color:#9fb7ff; opacity:.95;
}
  .audioCard.mediaBox .audioIcon{
  position:absolute;
  top:10px;
  left:12px;
  z-index:2;
  background:rgba(5,10,18,.4);
  border-radius:8px;
  padding:4px;
}
.audioCard audio{ display:block; width:100%; color-scheme:dark; }
/* СѓР±РёСЂР°РµРј СЃРµСЂСѓСЋ РїР»Р°С€РєСѓ Сѓ Chromium */
.audioCard audio::-webkit-media-controls-panel{ background:transparent !important; }
.audioCard audio::-webkit-media-controls-enclosure{ background:transparent !important; }
.audioCard audio::-webkit-media-controls{ background:transparent !important; }

.audioRemove{
  position:absolute; top:10px; left:5px;
  width:18px; height:18px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:18px; line-height:1;
  background:rgba(0, 0, 0, 0.51); border:1px solid rgba(255, 255, 255, 0.27);
}

.qcastPlayer{
  /* Р±РѕР»СЊС€Рµ РќР• absolute: РєРѕРЅС‚РµР№РЅРµСЂ СЃР°Рј Р·Р°РґР°С‘С‚ РІС‹СЃРѕС‚Сѓ РїРѕ РєРѕРЅС‚РµРЅС‚Сѓ (РґРѕ max-height) */
  position:relative;
  width:100%;
  max-height:100%;
  aspect-ratio:9/16;
  display:flex;
  align-items:stretch;
  justify-content:center;
  background:
    radial-gradient(circle at 18% 12%, rgba(0,245,255,.14), transparent 42%),
    radial-gradient(circle at 88% 68%, rgba(178,0,255,.14), transparent 52%),
    radial-gradient(circle at 60% 95%, rgba(0,255,138,.10), transparent 52%),
    #060b16;
  border-radius:16px;
  overflow:hidden;

  cursor:pointer;
  /* for RTL */
  direction:ltr;
}
.qcastPlayer[dir="rtl"]{ direction:rtl; }  
.qcastCover{
  width:100%;
  height:100%;
  /* РїРѕРґР»РѕР¶РєР° QCast РІСЃРµРіРґР° С†РµР»РёРєРѕРј, Р±РµР· РєСЂРѕРїР° */
  object-fit:contain;
  display:block;
}
  /* ===== Quantum Ring Visualizer (Canvas) ===== */
.qcastViz{
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:0;
  transform:scale(.92);
  filter:blur(12px) saturate(140%) brightness(1.05);
  transition: opacity .26s cubic-bezier(.2,.8,.2,1),
              transform .26s cubic-bezier(.2,.8,.2,1),
              filter .26s cubic-bezier(.2,.8,.2,1);
  mix-blend-mode:screen;
  contain:layout paint;
  will-change:opacity, transform, filter;
}
.qcastViz[data-on="1"]{
  opacity:1;
  transform:scale(1);
  filter:blur(0px) saturate(175%) brightness(1.15);
}
/* Mobile/WebView profile:
   keep effects visible but use a lightweight preset to avoid tab kills. */
@media (pointer: coarse), (max-width: 860px){
  .qcastViz{
    opacity:.52 !important;
    transform:scale(.985) !important;
    filter:blur(5px) saturate(132%) brightness(1.03) !important;
  }
}

.qcastAudio{
  position:absolute;
  width:1px;
  height:1px;
  opacity:0;
  pointer-events:none;
}
/* ===== QCast emoji FX (INSANE, fast, spread over the whole card) ===== */
.qcastFxLayer{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:6;
  overflow:hidden;
  contain: paint;
}
.qcastFx{
  position:absolute;
  transform:translate3d(-50%,-50%,0);
  font-size:clamp(32px, 6vw, 72px);

  /* vars from JS */
  --dx: 60px;
  --dy: -260px;
  --rot: 18deg;
  --sc0: .60;
  --sc1: 1.75;
  --dur: 1500ms;
  --delay: 0ms;
  --hue: 0deg;
  --glow: 1.25;
  --trail: "вњ¦";

  opacity:0;
  will-change: transform, opacity;
  backface-visibility:hidden;

  /* INSANE glow but still cheap (no blur) */
  filter:
    hue-rotate(var(--hue))
    drop-shadow(0 0 calc(14px * var(--glow)) rgba(0,245,255,.26))
    drop-shadow(0 0 calc(18px * var(--glow)) rgba(178,0,255,.18));

  /* ghost trail without extra DOM (cheap) */
  text-shadow:
    0 0 14px rgba(255,255,255,.10),
    -10px 10px 18px rgba(0,245,255,.10),
    12px -12px 22px rgba(178,0,255,.10);

  /* IMPORTANT: do not animate on mount (prevents top-left flashes) */
  animation:none;
}
.qcastFx--bad{
  filter:
    hue-rotate(var(--hue))
    drop-shadow(0 0 calc(14px * var(--glow)) rgba(255,80,120,.22))
    drop-shadow(0 0 calc(18px * var(--glow)) rgba(178,0,255,.16));
  text-shadow:
    0 0 14px rgba(255,255,255,.08),
    -10px 10px 18px rgba(255,80,120,.10),
    12px -12px 22px rgba(178,0,255,.10);
}
.qcastFx.isLive{
  animation:
    qcastFxAlpha var(--dur) cubic-bezier(.16,.9,.22,1) forwards,
    qcastFxCore  var(--dur) cubic-bezier(.12,.95,.2,1) forwards;
  animation-delay: var(--delay), var(--delay);
}

/* sparks/trail */
.qcastFx::after{
  content: var(--trail);
  position:absolute;
  left:50%;
  top:50%;
  transform: translate3d(-50%,-50%,0) scale(.78);
  font-size: .55em;
  opacity:0;
  pointer-events:none;
  filter: drop-shadow(0 0 18px rgba(255,255,255,.12)) drop-shadow(0 0 22px rgba(178,0,255,.16));
  animation:none;
}
.qcastFx.isLive::after{
  animation: qcastFxTrail var(--dur) cubic-bezier(.18,.86,.22,1) forwards;
  animation-delay: var(--delay);
}

@keyframes qcastFxAlpha{
  0%{opacity:0}
  9%{opacity:1}
  72%{opacity:.95}
  100%{opacity:0}
}
@keyframes qcastFxTrail{
  0%{ opacity:0; transform:translate3d(-50%,-50%,0) scale(.6); }
  18%{ opacity:.90; transform:translate3d(calc(-50% - 12px),calc(-50% + 16px),0) scale(1.20); }
  55%{ opacity:.38; transform:translate3d(calc(-50% + 20px),calc(-50% - 18px),0) scale(.92); }
  100%{ opacity:0; transform:translate3d(calc(-50% + 40px),calc(-50% - 36px),0) scale(.62); }
}

/* variants */
.qcastFx--float{  animation-name: qcastFxAlpha, qcastFxFloat;  }
.qcastFx--spiral{ animation-name: qcastFxAlpha, qcastFxSpiral; }
.qcastFx--rocket{ animation-name: qcastFxAlpha, qcastFxRocket; }
.qcastFx--zigzag{ animation-name: qcastFxAlpha, qcastFxZigzag; }
.qcastFx--bounce{ animation-name: qcastFxAlpha, qcastFxBounce; }
.qcastFx--snap{   animation-name: qcastFxAlpha, qcastFxSnap;   }
.qcastFx--wave{   animation-name: qcastFxAlpha, qcastFxWave;   }
.qcastFx--drift{  animation-name: qcastFxAlpha, qcastFxDrift;  }

@keyframes qcastFxCore{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .90)) rotate(calc(var(--rot) * 1.2)); }
}
@keyframes qcastFxFloat{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  60%{ transform:translate3d(calc(-50% + (var(--dx) * .45)),calc(-50% + (var(--dy) * .60)),0) scale(calc(var(--sc1) * .86)) rotate(calc(var(--rot) * .8)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .92)) rotate(calc(var(--rot) * 1.25)); }
}
@keyframes qcastFxSpiral{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(0deg); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(calc(var(--rot) * .8)); }
  50%{ transform:translate3d(calc(-50% + (var(--dx) * -.15)),calc(-50% + (var(--dy) * .55)),0) scale(calc(var(--sc1) * .82)) rotate(calc(var(--rot) * 2.9)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .92)) rotate(calc(var(--rot) * 4.6)); }
}
@keyframes qcastFxRocket{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  10%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  35%{ transform:translate3d(calc(-50% + (var(--dx) * .18)),calc(-50% + (var(--dy) * .78)),0) scale(calc(var(--sc1) * .76)) rotate(calc(var(--rot) * 1.35)); }
  100%{ transform:translate3d(calc(-50% + (var(--dx) * .32)),calc(-50% + (var(--dy) * 1.18)),0) scale(calc(var(--sc0) * .72)) rotate(calc(var(--rot) * 1.95)); }
}
@keyframes qcastFxZigzag{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  12%{ transform:translate3d(-50%,-50%,0) scale(var(--sc1)) rotate(var(--rot)); }
  32%{ transform:translate3d(calc(-50% + (var(--dx) * -.42)),calc(-50% + (var(--dy) * .30)),0) scale(calc(var(--sc1) * .88)) rotate(calc(var(--rot) * 1.35)); }
  55%{ transform:translate3d(calc(-50% + (var(--dx) * .58)),calc(-50% + (var(--dy) * .60)),0) scale(calc(var(--sc1) * .78)) rotate(calc(var(--rot) * 2.2)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .90)) rotate(calc(var(--rot) * 3.25)); }
}
@keyframes qcastFxBounce{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.15)); }
  14%{ transform:translate3d(-50%,-50%,0) scale(calc(var(--sc1) * 1.10)) rotate(var(--rot)); }
  42%{ transform:translate3d(calc(-50% + (var(--dx) * .26)),calc(-50% + (var(--dy) * .42)),0) scale(calc(var(--sc1) * .90)) rotate(calc(var(--rot) * 1.05)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .86)) rotate(calc(var(--rot) * 1.85)); }
}
@keyframes qcastFxSnap{
  0%{ transform:translate3d(-50%,-50%,0) scale(.32) rotate(0deg); }
  9%{ transform:translate3d(-50%,-50%,0) scale(calc(var(--sc1) * 1.20)) rotate(calc(var(--rot) * .7)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(.76) rotate(calc(var(--rot) * 1.55)); }
}
@keyframes qcastFxWave{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.25)); }
  20%{ transform:translate3d(calc(-50% + (var(--dx) * .10)),calc(-50% + (var(--dy) * .20)),0) scale(var(--sc1)) rotate(calc(var(--rot) * .85)); }
  40%{ transform:translate3d(calc(-50% + (var(--dx) * -.26)),calc(-50% + (var(--dy) * .44)),0) scale(calc(var(--sc1) * .88)) rotate(calc(var(--rot) * 1.6)); }
  65%{ transform:translate3d(calc(-50% + (var(--dx) * .40)),calc(-50% + (var(--dy) * .74)),0) scale(calc(var(--sc1) * .76)) rotate(calc(var(--rot) * 2.55)); }
  100%{ transform:translate3d(calc(-50% + var(--dx)),calc(-50% + var(--dy)),0) scale(calc(var(--sc0) * .90)) rotate(calc(var(--rot) * 3.35)); }
}
@keyframes qcastFxDrift{
  0%{ transform:translate3d(-50%,-50%,0) scale(var(--sc0)) rotate(calc(var(--rot) * -.10)); }
  18%{ transform:translate3d(calc(-50% + (var(--dx) * .10)),calc(-50% + (var(--dy) * .20)),0) scale(var(--sc1)) rotate(calc(var(--rot) * .6)); }
  55%{ transform:translate3d(calc(-50% + (var(--dx) * .65)),calc(-50% + (var(--dy) * .55)),0) scale(calc(var(--sc1) * .70)) rotate(calc(var(--rot) * 1.35)); }
  100%{ transform:translate3d(calc(-50% + (var(--dx) * .35)),calc(-50% + (var(--dy) * 1.05)),0) scale(calc(var(--sc0) * .82)) rotate(calc(var(--rot) * 2.25)); }
}

/* ===== Shockwave / Boom ring (double tap / reactions) ===== */
.qcastBoom{
  position:absolute;
  left:0; top:0;
  width:12px; height:12px;
  transform:translate3d(-50%,-50%,0) scale(.2);
  border-radius:999px;
  opacity:0;
  --bDur: 520ms;
  --bGlow: 1.1;
  --bHue: 0deg;
  border: 2px solid rgba(0,245,255,.35);
  box-shadow:
    0 0 calc(24px * var(--bGlow)) rgba(0,245,255,.18),
    0 0 calc(28px * var(--bGlow)) rgba(178,0,255,.12);
  filter: hue-rotate(var(--bHue));
  will-change: transform, opacity;
  /* IMPORTANT: do not animate on mount */
  animation:none;
}
.qcastBoom.isLive{
  animation: qcastBoom var(--bDur) cubic-bezier(.14,.9,.22,1) forwards;
}
.qcastBoom--bad{
  border-color: rgba(255,80,120,.28);
  box-shadow:
    0 0 calc(24px * var(--bGlow)) rgba(255,80,120,.14),
    0 0 calc(28px * var(--bGlow)) rgba(178,0,255,.10);
}
@keyframes qcastBoom{
  0%{ opacity:0; transform:translate3d(-50%,-50%,0) scale(.16); }
  12%{ opacity:.92; transform:translate3d(-50%,-50%,0) scale(.55); }
  100%{ opacity:0; transform:translate3d(-50%,-50%,0) scale(4.6); }
}

@media (prefers-reduced-motion: reduce){
  .qcastFx, .qcastBoom{ animation:none !important; opacity:0 !important; }
}

.qcastControls{
  position:absolute;
  inset:0;
  padding:10px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;

  /* no overlay panel */
  background:transparent;
  border:none;
  box-shadow:none;
  backdrop-filter:none;

  opacity:0;
  transform: translateY(6px);
  transition: opacity .22s cubic-bezier(.2,.8,.2,1), transform .22s cubic-bezier(.2,.8,.2,1);
  pointer-events:none;
}
.qcastControls[data-visible="1"]{
  opacity:1;
  transform: translateY(0);
  pointer-events:auto;
}
.qcastControls[data-visible="0"] .qcastCtrlShimmer{
  animation:none !important;
  opacity:0 !important;
}
.qcastControls[data-visible="0"] .qcastCtrlBar{
  animation:none !important;
}

/* top HUD (EQ) */
.qcastHudTop{
  display:flex;
  justify-content:center;
  pointer-events:none;
}

/* bottom bar (desktop + base) */
.qcastBottomBar{
  display:flex;
  gap:10px;
  align-items:center;
  justify-content:space-between;
  pointer-events:auto;
}
.qcastBottomLeft,
.qcastBottomCenter,
.qcastBottomRight{
  display:flex;
  align-items:center;
  gap:10px;
  pointer-events:auto;
}
.qcastBottomCenter{ flex: 1; min-width: 0; }
.qcastBottomRight{ justify-content:flex-end; }

.qcastDesktopOnly{ display:none; }
.qcastMobileOnly{ display:flex; }

/* vertical rail (tablet/mobile) */
.qcastSideRail{
  position:absolute;
  right:10px;
  top:50%;
  transform: translateY(-50%);
  display:flex;
  flex-direction:column;
  gap:10px;
  pointer-events:auto;
}

/* desktop layout: everything packed bottom, no side rail */
@media (min-width: 860px){
  .qcastSideRail{ display:none; }
  .qcastDesktopOnly{ display:flex; }
  .qcastMobileOnly{ display:none; }
  .qcastBottomBar{ gap:14px; }
  .qcastBottomCenter{ max-width: min(520px, 52vw); }
}

 /* ===== EQ РЅР°Рґ РєРѕРЅС‚СЂРѕР»Р°РјРё: rail + bars (Р±РµСЂС‘С‚ СЌРЅРµСЂРіРёСЋ РёР· CSS vars --q-all/--q-high) ===== */
.qcastCtrlEQ{
  position:relative;
  padding:10px 10px 4px;
  border-radius:14px;
  background:rgba(3,6,12,.35);
  border:1px solid rgba(160,190,255,.12);
  overflow:hidden;
}
.qcastCtrlRail{
  position:absolute;
  left:10px; right:10px;
  top:50%;
  height:2px;
  transform:translateY(-50%);
  background:linear-gradient(90deg,
    rgba(0,245,255,.10),
    rgba(178,0,255,.16),
    rgba(0,255,138,.10)
  );
  box-shadow:0 0 14px rgba(0,245,255,.12);
  opacity:.85;
}
.qcastCtrlBars{
  position:relative;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:4px;
  height:34px;
}
.qcastCtrlBar{
  width:clamp(4px, .55vw, 7px);
  height:100%;
  border-radius:999px;
  background:linear-gradient(180deg,
    rgba(0,245,255,1),
    rgba(178,0,255,1) 55%,
    rgba(0,255,138,1)
  );
  background-size: 100% 180%;
  transform-origin:50% 100%;
  opacity:.95;
  filter: drop-shadow(0 0 6px rgba(0,245,255,.22))
          drop-shadow(0 0 10px rgba(178,0,255,.16));
animation:qcastCtrlEQ 880ms ease-in-out infinite, qcastCtrlHue 2.4s linear infinite;
  animation-delay:var(--d);
}
.qcastCtrlEQ[data-on="0"] .qcastCtrlBar{
  animation:none;
  transform:scaleY(.12);
  opacity:.25;
  filter:none;
}
@keyframes qcastCtrlEQ{
  0%,100%{
    transform:scaleY(calc(.10 + (var(--h) * (.35 + (var(--q-all, .0) * .9)))));
  }
  50%{
    transform:scaleY(calc(.18 + (var(--h) * (.55 + (var(--q-high, .0) * 1.05)))));
  }
}
 @keyframes qcastCtrlHue{
  0%{ background-position: 0% 0%; }
  100%{ background-position: 0% 100%; }
}
.qcastCtrlShimmer{
  position:absolute;
  inset:-40% -60%;
  background:linear-gradient(110deg, transparent 35%, rgba(180,220,255,.12) 50%, transparent 65%);
  transform: translateX(-60%);
  animation: qcastShimmer 1.9s linear infinite;
  pointer-events:none;
  mix-blend-mode:screen;
}
@keyframes qcastShimmer{
  0%{ transform: translateX(-60%); }
  100%{ transform: translateX(60%); }
}
@media (prefers-reduced-motion: reduce){
  .qcastCtrlShimmer{ animation:none; }
  .qcastCtrlBar{ animation: none; }
}
@media (pointer: coarse), (max-width: 860px){
  .qcastCtrlShimmer{ animation:none; opacity:.18; }
  .qcastCtrlBar{
    animation:none;
    transform:scaleY(calc(.14 + (var(--h) * .42)));
    filter:none;
  }
}

/* ===== New adaptive layout (mobile wrapper + desktop wrapper) ===== */
.qcastGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
}
.qcastGroup{ display:flex; align-items:center; gap:10px; }
.qcastTransport{ justify-content:flex-start; }
.qcastUtility{ justify-content:flex-end; }
.qcastTimeline{ gap:8px; }
.qcastReacts{ justify-content:space-between; }
.qcastSpeedRow{ flex-wrap:wrap; gap:6px; justify-content:flex-end; }
.qcastGrid[data-dir="rtl"] .qcastTransport{ justify-content:flex-end; }
.qcastGrid[data-dir="rtl"] .qcastUtility{ justify-content:flex-start; }
.qcastGrid[data-dir="rtl"] .qcastSpeedRow{ justify-content:flex-start; }
@media (min-width: 720px){
  .qcastGrid{
    grid-template-columns: 1fr 1.35fr 1fr;
    grid-template-areas:
      "transport timeline utility"
      "reacts    timeline speed";
    align-items:center;
  }
  .qcastTransport{ grid-area:transport; }
  .qcastTimeline{ grid-area:timeline; }
  .qcastUtility{ grid-area:utility; }
  .qcastReacts{ grid-area:reacts; justify-content:flex-start; }
  .qcastSpeedRow{ grid-area:speed; justify-content:flex-end; }
  .qcastGrid[data-dir="rtl"]{
    grid-template-areas:
      "utility timeline transport"
      "speed   timeline reacts";
  }
}

.qcastBtn{
  width:44px;
  height:44px;
  border-radius:14px;
  border:1px solid rgba(210,230,255,.16);
  background: rgba(8,12,20,.22);
  color:#f3f7ff;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);

  transition: transform .14s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease, filter .18s ease;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.03),
    0 12px 28px rgba(0,0,0,.22);
}
.qcastBtn--main{
  width:52px;
  height:52px;
  border-radius:18px;
  background: rgba(8,12,20,.28);
  border-color: rgba(0,245,255,.18);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.03),
    0 14px 38px rgba(0,0,0,.26),
    0 0 22px rgba(0,245,255,.10),
    0 0 20px rgba(178,0,255,.08);
}
.qcastBtn--danger{
  border-color: rgba(255,120,120,.24);
  background: rgba(30,6,10,.18);
}
.qcastBtn--rail{
  width:52px;
  height:52px;
  border-radius:18px;
}

.qcastBtn:hover{
  transform: translateY(-1px) scale(1.03);
  border-color: rgba(0,245,255,.28);
  filter: saturate(1.12) brightness(1.06);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.04),
    0 16px 46px rgba(0,0,0,.30),
    0 0 26px rgba(0,245,255,.14),
    0 0 24px rgba(178,0,255,.12);
}
.qcastBtn:active{ transform: translateY(0) scale(.99); }
.qcastBtn.isOn{
  border-color: rgba(0,255,138,.26);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.04),
    0 16px 46px rgba(0,0,0,.30),
    0 0 22px rgba(0,255,138,.14);
}

.qcastIcon{ width:21px; height:21px; fill:currentColor; }

.qcastTime{
  font:600 11px/1 ui-monospace,monospace;
  color:#d8e4ff;
  min-width:42px;
  text-align:center;
}
.qcastRange{
  flex:1;
  appearance:none;
  height:6px;
  border-radius:999px;
  background:linear-gradient(90deg,
    rgba(0,245,255,.30),
    rgba(178,0,255,.26),
    rgba(0,255,138,.26)
  );

  outline:none;
  box-shadow: inset 0 0 14px rgba(0,0,0,.35);
}
.qcastRange::-webkit-slider-thumb{
  appearance:none;
  width:16px;
  height:16px;
  border-radius:50%;
  background:linear-gradient(180deg, rgba(255,255,255,1), rgba(190,210,255,1));
  box-shadow:0 0 14px rgba(0,245,255,.18), 0 0 16px rgba(178,0,255,.14);
}
.qcastRange::-moz-range-thumb{
  width:16px;
  height:16px;
  border-radius:50%;
  background:linear-gradient(180deg, rgba(255,255,255,1), rgba(190,210,255,1));

  border:0;
}

.qcastSpeed{
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(210,230,255,.16);
  background: rgba(8,12,20,.18);
  color:#dbe7ff;
  font-size:11px;
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  transition: transform .14s ease, border-color .18s ease, box-shadow .18s ease;
}
.qcastSpeed:hover{ transform: translateY(-1px); border-color: rgba(0,245,255,.26); }
.qcastSpeed.active{
  background: linear-gradient(180deg, rgba(0,245,255,.92), rgba(178,0,255,.82));
  color:#081021;
  border-color: rgba(180,210,255,.92);
  box-shadow: 0 0 22px rgba(0,245,255,.14), 0 0 20px rgba(178,0,255,.12);
}

.qcastSpeedPill{
  height:46px;
  padding:0 12px;
  border-radius:999px;
  border:1px solid rgba(210,230,255,.16);
  background: rgba(8,12,20,.22);
  color:#f3f7ff;
  font:700 12px/1 ui-monospace,monospace;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  box-shadow: 0 0 0 1px rgba(255,255,255,.03), 0 12px 28px rgba(0,0,0,.22);
  transition: transform .14s ease, border-color .18s ease, box-shadow .18s ease;
}
.qcastSpeedPill:hover{
  transform: translateY(-1px) scale(1.02);
  border-color: rgba(0,245,255,.26);
  box-shadow: 0 0 0 1px rgba(255,255,255,.04), 0 16px 46px rgba(0,0,0,.30);
}


/* ===== Reactions (premium, rail-ready) ===== */
.qcastReact{
  width:56px;
  height:56px;
  border-radius: 58% 42% 54% 46% / 44% 58% 42% 56%;
  border:1px solid rgba(210,230,255,.16);
  background: rgba(8,12,20,.22);
  color:#f3f7ff;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  position: relative;
  isolation: isolate;
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.03),
    0 12px 28px rgba(0,0,0,.22);
  transition: transform .14s ease, box-shadow .18s ease, border-color .18s ease, filter .18s ease;
}
.qcastReact::before{
  content:'';
  position:absolute;
  inset:-2px;
  border-radius: 61% 39% 58% 42% / 49% 52% 48% 51%;
  border:1px solid rgba(255,255,255,.08);
  opacity:.45;
  pointer-events:none;
}
.qcastReact--bad{
  border-radius: 44% 56% 39% 61% / 58% 42% 55% 45%;
}
.qcastReact--bad::before{
  border-radius: 48% 52% 42% 58% / 61% 39% 57% 43%;
}
.qcastReactEmoji{ font-size:28px; line-height:1; }
.qcastReact:hover{
  transform: translateY(-1px) scale(1.03);
  border-color: rgba(0,245,255,.28);
  filter: saturate(1.12) brightness(1.06);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.04),
    0 16px 46px rgba(0,0,0,.30),
    0 0 26px rgba(0,245,255,.14),
    0 0 24px rgba(178,0,255,.12);
}
.qcastReact:active{ transform: translateY(0) scale(.99); }
.qcastReact--bad:hover{ border-color: rgba(255,80,120,.28); }

@media (max-width: 859px){
  .qcastReact, .qcastBtn--rail{ width:58px; height:58px; }
  .qcastReactEmoji{ font-size:30px; }
}


/* ===== Settings popover ===== */
.qcastSettings{
  position:relative;
  margin-top:8px;
  border-radius:16px;
  border:1px solid rgba(160,190,255,.14);
  background:
    radial-gradient(circle at 20% 20%, rgba(0,245,255,.10), transparent 45%),
    radial-gradient(circle at 80% 70%, rgba(178,0,255,.10), transparent 55%),
    linear-gradient(180deg, rgba(8,12,22,.72), rgba(6,9,17,.92));
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.03),
    0 16px 44px rgba(0,0,0,.42);
  overflow:hidden;
  max-height:0;
  opacity:0;
  transform: translateY(-6px) scale(.99);
  transition: max-height .26s ease, opacity .22s ease, transform .22s ease;
  pointer-events:none;
}
.qcastSettings[data-open="1"]{
  max-height: 260px;
  opacity:1;
  transform: translateY(0) scale(1);
  pointer-events:auto;
}
  /* floating settings card (no overlay, sits above bottom bar / rail) */
.qcastSettings--floating{
  position:absolute;
  right:10px;
  bottom:84px;
  width:min(380px, calc(100vw - 28px));
  max-height:min(64vh, 520px);
  overflow:auto;
}
@media (min-width: 860px){
  .qcastSettings--floating{
    right:12px;
    bottom:92px;
    width:min(420px, 40vw);
  }
}

.qcastSettingsHdr{
  display:flex; align-items:center; justify-content:space-between;
  gap:10px;
  padding:10px 12px;
  border-bottom:1px solid rgba(160,190,255,.12);
}
.qcastSettingsTitle{ font-weight:700; font-size:12px; color:#dbe7ff; letter-spacing:.2px; }
.qcastSettingsClose{
  width:30px; height:30px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(10,14,26,.55);
  color:#eaf2ff;
}
.qcastSettingsBody{ padding:10px 12px; display:flex; flex-direction:column; gap:10px; }
.qcastSettingRow{ display:flex; align-items:center; gap:10px; }
.qcastSettingLabel{ min-width:62px; font-size:12px; color:#cfe0ff; opacity:.9; }
.qcastSettingVal{ min-width:44px; text-align:right; font:600 12px/1 ui-monospace,monospace; color:#dbe7ff; }
.qcastRange--vol{ height:8px; }
.qcastPresetChips{ display:flex; flex-wrap:wrap; gap:6px; }
.qcastChip{
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(10,14,26,.55);
  color:#dbe7ff;
  font-size:12px;
}
.qcastChip.active{
  background:linear-gradient(180deg, rgba(0,245,255,.92), rgba(178,0,255,.85));
  color:#081021;
  border-color:rgba(180,210,255,.95);
  box-shadow:0 0 18px rgba(0,245,255,.14), 0 0 18px rgba(178,0,255,.12);
}
.qcastToggle{
  margin-left:auto;
  display:inline-flex; align-items:center; gap:8px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(10,14,26,.55);
  color:#dbe7ff;
}
.qcastToggleDot{
  width:10px; height:10px; border-radius:50%;
  background:rgba(255,255,255,.25);
  box-shadow:0 0 0 1px rgba(255,255,255,.06);
}
.qcastToggle.on{
  border-color:rgba(0,245,255,.32);
  box-shadow:0 0 18px rgba(0,245,255,.16), 0 0 18px rgba(178,0,255,.12);
}
.qcastToggle.on .qcastToggleDot{
  background:linear-gradient(180deg, rgba(0,245,255,1), rgba(178,0,255,1));
  box-shadow:0 0 14px rgba(0,245,255,.18), 0 0 16px rgba(178,0,255,.14);
}
.qcastSettingsHint{
  font-size:11px;
  color:#bcd0ff;
  opacity:.75;
  line-height:1.35;
}

.loadMoreFooter{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding:12px 0 4px;
  color:#cfe0ff;
  font-size:12px;
  opacity:.85;
}
.dmLoadMoreFooter{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
}
.dmLoadMoreFooter .loadMoreShimmer{
  margin-inline:auto;
  text-align:center;
}
.loadMoreShimmer{
  position:relative;
  overflow:hidden;
  padding:6px 16px;
  border-radius:999px;
  border:1px solid rgba(140,170,255,.25);
  background:rgba(8,12,20,.6);
  box-shadow: inset 0 0 18px rgba(80,167,255,.08);
}
.loadMoreShimmer::after{
  content:'';
  position:absolute;
  inset:-40% -60%;
  background:linear-gradient(110deg, transparent 35%, rgba(140,170,255,.35) 50%, transparent 65%);
  animation: shimmer 1.6s linear infinite;
}
@media (prefers-reduced-motion: reduce){
  .loadMoreShimmer::after{ animation: none; }
}
@keyframes shimmer{
  0%{ transform: translateX(-60%); }
  100%{ transform: translateX(60%); }
}
.loadMoreSentinel{ width:100%; height:1px; }
/* --- avatar + nick (РЅРёРє РІСЃРµРіРґР° РїРѕРґ Р°РІР°С‚Р°СЂРѕРј) --- */
.avaNick{
  display:inline-flex;
  align-items:center; justify-content:center;
  margin-top:14px;
  width:84px; 
   width:120px;                  /* = С€РёСЂРёРЅР° С‚РІРѕРµРіРѕ .avaBig; РµСЃР»Рё РґСЂСѓРіР°СЏ вЂ” РїРѕРґСЃС‚Р°РІСЊ РµС‘ */
  text-align:center;
  max-width:clamp;
  padding:2 88px;
  white-space:nowrap;          /* РЅРµ РїРµСЂРµРЅРѕСЃРёРј РЅРёРє */
  overflow:hidden; text-overflow:ellipsis;
}

/* --- РїСЂР°РІР°СЏ РїРѕР»РѕСЃР° СЃ Q COIN --- */
.qRowRight{
  /* РєРѕРЅС‚РµР№РЅРµСЂ QCoin Р·Р°РЅРёРјР°РµС‚ РІСЃСЋ РїСЂР°РІСѓСЋ С‡Р°СЃС‚СЊ Рё РїРѕ РІС‹СЃРѕС‚Рµ СЂРѕРІРЅРѕ Р°РІР°С‚Р°СЂ */
  flex:1 1 auto; min-width:0; width:100%;
  align-self:center;                      /* С†РµРЅС‚СЂ РїРѕ РєРѕР»РѕРЅРєРµ Р°РІР°С‚Р°СЂР° */
  height:var(--ava-size);
  display:flex; align-items:center; justify-content:flex-end; /* РїСЂРёР¶РёРјР°РµРј РєРѕРЅС‚РµРЅС‚ РІРїСЂР°РІРѕ */
  /* С‚РѕРЅРєР°СЏ РІРµСЂС‚РёРєР°Р»СЊРЅР°СЏ РїРѕРґСЃС‚СЂРѕР№РєР° РѕС‚ СЃРµСЂРµРґРёРЅС‹ Р°РІР°С‚Р°СЂР° (РјРѕР¶РЅРѕ РєСЂСѓС‚РёС‚СЊ РёРЅР»Р°Р№РЅРѕРј) */
  --qcoin-y: 0px;
  transform: translateY(var(--qcoin-y));
  transform-origin:left center;
}

/* СЃР°Рј Р±Р»РѕРє QCoin СЂР°СЃС‚СЏРіРёРІР°РµС‚СЃСЏ РЅР° РІСЃСЋ РґРѕСЃС‚СѓРїРЅСѓСЋ С€РёСЂРёРЅСѓ,
   РЅРѕ РЅРµ РїРµСЂРµРЅРѕСЃРёС‚СЃСЏ Рё РЅРµ РІС‹Р»Р°Р·РёС‚ */
.qRowRight > *{
  flex:1 1 auto; min-width:0; width:100%;
  display:inline-flex; align-items:center; justify-content:flex-end;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  text-align:right;
  font-size:clamp(12px, 2.8vw, 24px);     /* Р°РґР°РїС‚РёРІРЅС‹Р№ СЂР°Р·РјРµСЂ С€СЂРёС„С‚Р° */
  max-width:100%;
}

/* --- РџРѕРїРѕРІРµСЂ QCoin РєРѕРЅС‚РµР№РЅРµСЂ --- */
.qcoinPop{
  /* РµСЃР»Рё Сѓ С‚РµР±СЏ СѓР¶Рµ СЃС‚РѕРёС‚ position/left/top/width вЂ” РѕСЃС‚Р°РІСЊ РёС… */
  max-width: 520px;
  z-index: 3200;
}

/* РљР°СЂС‚РѕС‡РєР°: РґРµР»Р°РµРј РєРѕР»РѕРЅРѕС‡РЅС‹Р№ Р»СЌР№Р°СѓС‚ СЃ РїСЂРѕРєСЂСѓС‡РёРІР°РµРјС‹Рј body */
.qcoinCard{
  display:flex; flex-direction:column;
  max-height: min(72vh, 1060px);   /* РѕРіСЂР°РЅРёС‡РёРј РІС‹СЃРѕС‚Сѓ РїРѕРїРѕРІРµСЂР° */
  overflow:hidden;                /* СЃРєСЂРѕР»Р» С‚РѕР»СЊРєРѕ РІ body */
}

/* РЁР°РїРєР° С„РёРєСЃ СЃРІРµСЂС…Сѓ */
.qcoinCardHdr{
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; padding:10px 12px;
  border-bottom:1px solid rgba(160,180,255,.15);
}

/* РўРµР»Рѕ: РёРјРµРЅРЅРѕ РѕРЅРѕ СЃРєСЂРѕР»Р»РёС‚СЃСЏ */
.qcoinPopBody{
  padding:12px; overflow:auto;
  overscroll-behavior: contain;
  max-height: 100%;
}

/* --- РџРѕР»РѕСЃР° РґРµР№СЃС‚РІРёР№: РІСЃРµРіРґР° РѕРґРёРЅ СЂСЏРґ, Р°РґР°РїС‚РёРІРЅРѕ СЃР¶РёРјР°РµС‚СЃСЏ --- */
.qcActions{
  display:flex; flex-wrap:nowrap; gap:10px;
  align-items:center; justify-content:space-between;
  padding:10px 12px; border-top:1px solid rgba(160,180,255,.15);
}

.qcBtn{
  flex:1 1 0;                    /* СЂР°РІРЅС‹Рµ РґРѕР»Рё, СЃР¶РёРјР°С‚СЊСЃСЏ РјРѕР¶РЅРѕ */
  min-width:0;                   /* РїРѕР·РІРѕР»СЏРµРј СѓР¶РёРјР°С‚СЊСЃСЏ СЂРµР°Р»СЊРЅРѕ */
  white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;
  font-size: clamp(12px, 2.6vw, 14px);
  line-height: 1.15;
  padding: 10px 12px;
}

/* РЎРїРµС†СЌС„С„РµРєС‚ РЅР° "Р‘РёСЂР¶Р°" вЂ” Р»С‘РіРєРёР№ С€РёРјРµСЂ + РЅРµРѕРЅРѕРІС‹Р№ С…РѕРІРµСЂ */
.qcBtn.qcExchange{
  position:relative;
  border:1px solid rgba(160,180,255,.28);
  background: linear-gradient(180deg, rgba(20,28,52,.35), rgba(12,18,34,.3));
}
.qcBtn.qcExchange::after{
  content:"";
  position:absolute; inset:0;
  background: linear-gradient(120deg, transparent 0%, rgba(170,200,255,.10) 35%, transparent 70%);
  transform: translateX(-120%);
  transition: transform .6s ease;
  pointer-events:none;
}
.qcBtn.qcExchange:hover::after{ transform: translateX(0%); }
.qcBtn.qcExchange:hover{
  box-shadow: 0 0 12px rgba(120,160,255,.22), inset 0 0 0 1px rgba(255,255,255,.05);
  border-color: rgba(180,200,255,.45);
}

/* "Р’С‹РІРѕРґ" вЂ” Р·РѕР»РѕС‚Р°СЏ, РєРѕРіРґР° РґРѕСЃС‚СѓРїРЅРѕ; СЃРµСЂР°СЏ, РєРѕРіРґР° disabled */
.qcBtn.qcWithdraw[disabled]{
  opacity:.7;
  border:1px solid rgba(160,180,255,.22);
  background: linear-gradient(180deg, rgba(18,26,46,.38), rgba(12,18,34,.32));
  cursor:not-allowed;
}
.qcBtn.qcWithdraw:not([disabled]){
  color:#1d1400;
  background:
    linear-gradient(180deg, rgba(255,233,140,1) 0%, rgba(255,220,90,1) 60%, rgba(250,205,70,1) 100%);
  border:1px solid rgba(255,210,80,.9);
  box-shadow:
    0 6px 18px rgba(255,200,80,.25),
    inset 0 0 0 1px rgba(255,255,255,.35);
}
.qcBtn.qcWithdraw:not([disabled]):hover{
  filter: saturate(1.1) brightness(1.03);
}

/* РќР° РѕС‡РµРЅСЊ СѓР·РєРёС… СЌРєСЂР°РЅР°С… вЂ” Р¶РјС‘Рј РїР»РѕС‚РЅРµРµ */
@media (max-width: 360px){
  .qcBtn{ font-size: clamp(11px, 3.2vw, 13px); padding:8px 10px; }
}
.topicTitle{ font-size: clamp(16px, 2.2vw, 18px); line-height: 1.25; }
.threadTitleWrap{
  margin: 6px 10px 2px;
  padding-inline: 10px;
}
.threadTitleWrap--topic{
  text-align: left;
}
.threadTitleWrap--replies{
  text-align: center;
}
.threadTitleWrap--replies .threadTitleText{
  display: block;
  width: 100%;
  text-align: center;
}
.topicDesc { line-height: 1.35; }

/* --- TopicItem: Р°РІР°С‚Р°СЂ СЃР»РµРІР°, РЅРёРє СЃРїСЂР°РІР° Р’ РћР”РќРЈ РЎРўР РћРљРЈ --- */
.item .topicUserRow{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:nowrap;   /* Р·Р°РїСЂРµС‰Р°РµРј РїРµСЂРµРЅРѕСЃ РЅРёРєР° РІРЅРёР· */
  min-width:0;        /* СЂР°Р·СЂРµС€Р°РµРј СЂРµР°Р»СЊРЅРѕРµ СЃР¶Р°С‚РёРµ СЃС‚СЂРѕРєРё */
}
.item .topicUserRow .avaMini{
  flex:0 0 auto;      /* Р°РІР°С‚Р°СЂ С„РёРєСЃРёСЂРѕРІР°РЅРЅС‹Р№ */
}
 .item .topicUserRow .nick-badge{
   display:inline-flex;
   align-items:center;
   flex:0 1 auto;        /* в†ђ Р±РѕР»СЊС€Рµ РќР• СЂР°СЃС‚СЏРіРёРІР°РµРјСЃСЏ */
   min-width:0;
   width:auto;
   max-width:clamp(96px, 40vw, 240px);  /* Р°РєРєСѓСЂР°С‚РЅС‹Р№ РїСЂРµРґРµР» РґР»СЏ РѕР±СЂРµР·РєРё */
 }
 .item .topicUserRow .nick-badge .nick-text{
   display:block;
   white-space:nowrap;
   overflow:hidden;
   text-overflow:ellipsis;
   max-width:100%;
 }
 /* PostCard: Р°РІР°С‚Р°СЂ СЃР»РµРІР°, РЅРёРє СЃРїСЂР°РІР° вЂ” РѕРґРЅР° СЃС‚СЂРѕРєР°, Р±РµР· СЂР°СЃС‚СЏР¶РµРЅРёСЏ */
.item .postUserRow{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:nowrap;
  min-width:0;
}
.item .postUserRow .avaMini{ flex:0 0 auto; }
.item .postUserRow .nick-badge{
  display:inline-flex;
  align-items:center;
  flex:0 1 auto;      /* РЅРµ СЂР°СЃС‚СЏРіРёРІР°РµРјСЃСЏ РЅР° РІСЃСЋ С€РёСЂРёРЅСѓ */
  min-width:0;
  width:auto;
  max-width:clamp(96px, 40vw, 260px);  /* Р°РєРєСѓСЂР°С‚РЅС‹Р№ РїСЂРµРґРµР» РїРѕРґ ellipsis */
}
.item .postUserRow .nick-badge .nick-text{
  display:block;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:100%;
}
/* ---- INBOX (РєРѕРЅРІРµСЂС‚ СЃРїСЂР°РІР° РІ С€Р°РїРєРµ СЃРїРёСЃРєР°) ---- */
.head .flex.items-center.justify-between{ flex-wrap:nowrap; } /* РЅРµ РїРµСЂРµРЅРѕСЃРёРј СЂСЏРґ */

.iconBtn.inboxBtn{
  position:relative;
  display:inline-flex; align-items:center; justify-content:center;
  width:42px; height:42px;
  border:0; background:transparent; color:#cfe0ff;
  transition: transform .12s ease, filter .18s ease;
}
.iconBtn.inboxBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn.inboxBtn:active{ transform:translateY(1px) scale(.98); }

/* РєСЂР°СЃРЅС‹Р№ Р±РµР№РґР¶ РЅРµРїСЂРѕС‡РёС‚Р°РЅРЅРѕРіРѕ (Replies) */
.inboxBadgeReplies{
  position:absolute; right:-6px; top:-6px;
  min-width:18px; height:18px; padding:0 5px;
  display:inline-flex; align-items:center; justify-content:center;
  font:600 10px/1 ui-monospace,monospace;
  color:#fff; background:#ff4d4d;
  border:1px solid rgba(255,255,255,.45);
  border-radius:999px;
  box-shadow:0 0 10px rgba(255,60,60,.5);
  z-index:3;
}
/* Р·РµР»С‘РЅС‹Р№/РѕСЂР°РЅР¶РµРІС‹Р№ Р±РµР№РґР¶ РЅРµРїСЂРѕС‡РёС‚Р°РЅРЅРѕРіРѕ (DM) */
.inboxBadgeDM{
  position:absolute; left:-6px; top:-6px;
  min-width:18px; height:18px; padding:0 5px;
  display:inline-flex; align-items:center; justify-content:center;
  font:600 10px/1 ui-monospace,monospace;
  color:#0d1b12; background:#35d07f;
  border:1px solid rgba(255,255,255,.55);
  border-radius:999px;
  box-shadow:0 0 10px rgba(53,208,127,.5);
  z-index:2;
}

/* С‚РµР»Рѕ В«InboxВ» вЂ” РєР°СЂС‚РѕС‡РєРё СЂРѕРІРЅРѕ РєР°Рє РїРѕСЃС‚С‹ */
.inboxList{ display:grid; gap:10px; }
.inboxEmpty{ opacity:.75; padding:8px 2px; }

/* ---- INBOX button ---- */
.iconBtn.inboxBtn{
  position:relative;
  /* РґРµР»Р°РµРј РєСЂСѓРїРЅРѕР№ Рё Р±РµР· С„РѕРЅР° */
  width: 64px !important;
  height: 64px !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: #cfe0ff;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition: transform .12s ease, filter .18s ease;
}
.iconBtn.inboxBtn svg{
  width: 38px !important;
  height: 38px !important;
}
.iconBtn.inboxBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn.inboxBtn:active{ transform: translateY(1px) scale(.98); }

/* РєСЂР°СЃРЅС‹Р№ Р±РµР№РґР¶ (Replies) */
.inboxBadgeReplies{
  position:absolute; right:-6px; top:-6px;
  min-width:18px; height:18px; padding:0 5px;
  display:inline-flex; align-items:center; justify-content:center;
  font:600 10px/1 ui-monospace,monospace;
  color:#fff; background:#ff4d4d;
  border:1px solid rgba(255,255,255,.45);
  border-radius:999px;
  box-shadow:0 0 10px rgba(255,60,60,.5);
  z-index:3;
}
/* Р·РµР»С‘РЅС‹Р№/РѕСЂР°РЅР¶РµРІС‹Р№ Р±РµР№РґР¶ (DM) */
.inboxBadgeDM{
  position:absolute; left:-6px; top:-6px;
  min-width:18px; height:18px; padding:0 5px;
  display:inline-flex; align-items:center; justify-content:center;
  font:600 10px/1 ui-monospace,monospace;
  color:#0d1b12; background:#35d07f;
  border:1px solid rgba(255,255,255,.55);
  border-radius:999px;
  box-shadow:0 0 10px rgba(53,208,127,.5);
  z-index:2;
}

/* ---- INBOX tabs ---- */
.inboxHeader{
  position:sticky; top:0; z-index:8;
  display:flex; flex-direction:column; gap:6px;
  padding:8px 6px 6px;
  background:
    radial-gradient(70% 120% at 50% 0%, rgba(120,180,255,.18), rgba(10,16,28,.86) 60%),
    linear-gradient(180deg, rgba(10,16,28,.95), rgba(10,16,28,.55));
  backdrop-filter: blur(14px) saturate(140%);
}
.inboxTitleLine{
  font-size: clamp(16px, 2.6vw, 24px);
  font-weight:900; line-height:1.1;
  text-align:center; letter-spacing:1.2px;
  text-transform:none;
  display:flex; align-items:center; justify-content:center;
  background: linear-gradient(120deg, #f9dc8f 0%, #fff4c4 30%, #d9a34b 60%, #ffe8a8 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 2px 16px rgba(255, 210, 120, .45);
  animation: inboxGoldShift 6s linear infinite;
}
@keyframes inboxGoldShift{
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.inboxTabs{
  position:sticky; top:0; z-index:9;
  display:flex; align-items:center; justify-content:center; gap:4px;
  white-space:nowrap; flex-wrap:nowrap;
  padding:6px 0 4px;
}
/* РћС‚СЃС‚СѓРї РєРѕРЅС‚РµРЅС‚Р° Inbox РѕС‚ РєРѕРЅС‚СЂРѕР»РѕРІ (Р·Р°РіРѕР»РѕРІРѕРє/С‚Р°Р±С‹).
   РќР°СЃС‚СЂР°РёРІР°РµС‚СЃСЏ С‡РµСЂРµР· CSS-РїРµСЂРµРјРµРЅРЅСѓСЋ:
   --inbox-content-top-offset: 8px; (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ РєР°Рє Р±С‹Р»Рѕ mt-2)
*/
:root{
  --inbox-content-top-offset: 100px; /* СЃРєРѕР»СЊРєРѕ РЅСѓР¶РЅРѕ */
}
:root{ --inbox-dm-list-start-desktop: 980px; }
@media (max-width: 640px){
  :root{ --inbox-dm-list-start-mobile: 620px; }
}

.inboxBody{ padding:0 6px 6px; }
/* TMA: РѕС‚РґРµР»СЊРЅР°СЏ СЂСѓС‡РЅР°СЏ РґРѕРєСЂСѓС‚РєР° Р»РёРїРєРѕР№ РїР°РЅРµР»Рё */
html[data-tma="1"] .inboxHeader,
html[data-tma="1"] .inboxTabs{
  top: var(--tma-inbox-sticky-top, 0px);
}
.inboxTabBtn{
  position:relative;
  display:inline-flex; align-items:center; gap:6px;
  flex:1 1 0;
  min-width:0;
  justify-content:center;
  border:1px solid rgba(140,190,255,.35);
  background:linear-gradient(120deg, rgba(12,20,34,.7), rgba(60,120,255,.18));
  color:#eaf4ff; border-radius:999px;
  padding:6px 8px; font-weight:800;
  font-size:clamp(10px, 2.6vw, 12px);
  box-shadow:0 0 16px rgba(80,167,255,.14);
  transition:transform .12s ease, filter .12s ease, box-shadow .18s ease;
}
.inboxTabBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.inboxTabBtn:active{ transform:translateY(1px) scale(.98); }
.inboxTabBtn[data-active="1"]{
  background:linear-gradient(120deg, rgba(40,120,255,.35), rgba(120,200,255,.2));
  border-color:rgba(170,220,255,.75);
  box-shadow:0 0 22px rgba(80,167,255,.35);
}
.inboxTabLabel{ display:inline-flex; align-items:center; white-space:nowrap; min-width:0; }
.inboxTabBadge{
  min-width:18px; height:18px; padding:0 6px;
  display:inline-flex; align-items:center; justify-content:center;
  border-radius:999px; font-size:10px; font-weight:900;
  letter-spacing:.2px;
  border:1px solid rgba(255,255,255,.55);
  box-shadow:0 0 10px rgba(0,0,0,.25);
  flex:0 0 auto;
}
.inboxTabBadge[data-kind="replies"]{ background:#ff4d4d; color:#fff; box-shadow:0 0 12px rgba(255,80,80,.55); }
.inboxTabBadge[data-kind="messages"]{ background:#35d07f; color:#0d1b12; box-shadow:0 0 12px rgba(53,208,127,.6); }
.inboxTabBadge[data-kind="published"]{
  background:linear-gradient(120deg, #f9dc8f, #d9a34b);
  color:#2a1b00;
  box-shadow:0 0 12px rgba(220,170,70,.6);
}
.inboxTabsRail{
  height:1px; opacity:.28;
  background:linear-gradient(90deg, rgba(120,180,255,.05), rgba(120,180,255,.6), rgba(120,180,255,.05));
}
@media (max-width: 420px){
  .inboxTabBtn{ padding:5px 6px; font-size:10px; gap:4px; }
  .inboxTabBadge{ min-width:16px; height:16px; padding:0 5px; font-size:9px; }
}
.dmRow{
  display:flex; gap:10px; align-items:center; text-align:start;
  width:100%;
  padding:10px 12px;
  border-radius:14px;
  position:relative;
  overflow:hidden;
  border:1px solid rgba(120,200,255,.22);
  background:
    radial-gradient(120% 120% at 10% 0%, rgba(120,220,255,.18), rgba(10,16,30,.92) 48%),
    linear-gradient(140deg, rgba(8,14,28,.96), rgba(22,36,62,.8));
  box-shadow: 0 12px 26px rgba(0,0,0,.3), inset 0 0 22px rgba(120,200,255,.12);
  transition: transform .14s ease, box-shadow .18s ease, border-color .18s ease;
} 
.dmRow.dmRowUnread{
  border-color: rgba(0,255,140,.9);
  box-shadow:
    0 0 0 1px rgba(0,255,140,.65),
    0 0 18px rgba(0,255,140,.55),
    0 0 44px rgba(0,255,140,.28),
    0 12px 26px rgba(0,0,0,.3),
    inset 0 0 24px rgba(0,255,140,.14);
}
.dmRow.dmRowUnread::before{
  content:'';
  position:absolute;
  inset:-2px;
  pointer-events:none;
  background: radial-gradient(120% 120% at 10% 0%, rgba(0,255,140,.22), rgba(0,255,140,0) 60%);
  opacity:.95;
  mix-blend-mode: screen;
}  
.dmRow:hover{
  transform: translateY(-1px);
  border-color: rgba(160,210,255,.45);
  box-shadow: 0 16px 32px rgba(0,0,0,.35), inset 0 0 28px rgba(120,190,255,.16);
}
.dmRow::after{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(90deg, transparent, rgba(140,220,255,.24), transparent);
  transform: translateX(-120%);
  animation: dmRowScan 12s ease-in-out infinite;
  opacity:.55;
  pointer-events:none;
}
.dmRow:hover::after{ opacity:.8; }
.dmRowAvatar{
  width:44px; height:44px; border-radius:14px;
  padding:2px;
  background: linear-gradient(135deg, rgba(255,215,130,.45), rgba(120,200,255,.55));
  box-shadow:0 0 18px rgba(120,200,255,.45), inset 0 0 10px rgba(255,220,150,.35);
  cursor:pointer;
}
.dmRowAvatarImg{
  width:100%; height:100%; border-radius:12px; overflow:hidden;
}
.dmRowName{ font-weight:800; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#eaf4ff; text-shadow:0 0 12px rgba(120,200,255,.35); }
.dmRowTime{
  display:flex;
  justify-content:flex-start;
  margin-top:4px;
  white-space:nowrap;
  font-variant-numeric: tabular-nums;
}
.dmRowTimeBadge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:24px;
  padding:3px 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
  color:#e8f5ff;
  border:1px solid rgba(120,190,255,.35);
  background:linear-gradient(130deg, rgba(10,20,38,.88), rgba(18,40,72,.68));
  box-shadow: inset 0 0 12px rgba(100,180,255,.14), 0 0 14px rgba(80,150,255,.18);
}
.dmRowPreview{ font-size:13px; color:#cde6ff; }
.dmPreviewFrame{
  display:flex;
  align-items:center;
  gap:8px;
  padding:4px 8px;
  border-radius:10px;
  background:
    linear-gradient(160deg, rgba(10,18,32,.82), rgba(14,28,48,.65));
  border:1px solid rgba(120,180,255,.2);
  box-shadow: inset 0 0 12px rgba(80,140,255,.12);
  color:#cfe4ff;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.dmPreviewMedia{
  width:32px; height:32px;
  border-radius:8px;
  overflow:hidden;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex:0 0 auto;
  position:relative;
  background: radial-gradient(120% 120% at 10% 0%, rgba(120,200,255,.25), rgba(12,18,30,.9));
  border:1px solid rgba(120,180,255,.25);
}
.dmPreviewImg{ width:100%; height:100%; object-fit:cover; display:block; }
.dmPreviewIcon{
  width:18px;
  height:18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  color:#d7ebff;
}
.dmPreviewIcon > svg{
  width:100%;
  height:100%;
  display:block;
}
.dmPreviewPlay{
  position:absolute;
  right:2px;
  bottom:2px;
  width:12px;
  height:12px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:6px;
  background:rgba(0,0,0,.55);
  color:#fff;
}
.dmPreviewPlay > svg{
  width:8px;
  height:8px;
  display:block;
}
.dmPreviewText{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.dmUnreadDot{ width:12px; height:12px; border-radius:999px; background:#35d07f; box-shadow:0 0 12px rgba(53,208,127,.7); flex:0 0 auto; animation: dmPulse 2.6s ease-in-out infinite; }
.dmRowMain{
  flex:1 1 auto;
  min-width:0;
  display:flex;
  flex-direction:column;
}
.dmRowTop{ display:flex; align-items:center; gap:8px; }
.dmRowUser{ display:flex; align-items:center; gap:8px; min-width:0; flex:1 1 auto; flex-wrap:wrap; }
.dmRowNick{ font-size:.95rem; padding:.22rem .5rem; }
.dmRow .nick-badge .nick-text{ max-width:16ch; }
.dmRowRail{
  position:relative;
  height:1px;
  margin:6px 0;
  border-radius:999px;
  overflow:hidden;
  background:linear-gradient(90deg, rgba(120,180,255,.05), rgba(120,180,255,.48), rgba(120,180,255,.05));
}
.dmRowRail::after{
  content:'';
  position:absolute;
  top:0;
  left:-35%;
  width:35%;
  height:100%;
  background:linear-gradient(90deg, rgba(100,210,255,0), rgba(100,210,255,.95), rgba(100,210,255,0));
  filter: drop-shadow(0 0 7px rgba(100,210,255,.55));
  animation: dmRailPulse 2.3s linear infinite;
}
.dmRowRailTop::after{ animation-delay: .2s; }
.dmRowRailBottom::after{ animation-delay: .95s; }
.dmRow{ --vip-badge-w: 34px; --vip-badge-h: 36px; }
.dmThreadHeader{ --vip-badge-w: 38px; --vip-badge-h: 40px; }
.dmThreadHeader{
  display:flex; align-items:center; gap:10px;
  padding:8px 10px;
  margin:0 6px;
  border-radius:14px;
  background: linear-gradient(140deg, rgba(12,20,34,.75), rgba(18,30,48,.55));
  border:1px solid rgba(140,190,255,.2);
  box-shadow:0 10px 22px rgba(0,0,0,.22), inset 0 0 16px rgba(120,180,255,.1);
}
.dmThreadAvatar{
  width:46px; height:46px; border-radius:16px; padding:2px;
  background: linear-gradient(135deg, rgba(255,215,130,.45), rgba(120,180,255,.45));
  box-shadow:0 0 18px rgba(120,180,255,.4), inset 0 0 8px rgba(255,220,150,.35);
  cursor:pointer;
}
.dmThreadAvatarImg{ width:100%; height:100%; border-radius:14px; overflow:hidden; }
.dmThreadMeta{ min-width:0; display:flex; flex-direction:column; }
.dmThreadName{ font-weight:800; letter-spacing:.3px; color:#eaf4ff; text-shadow:0 0 12px rgba(120,190,255,.35); }
.dmThreadId{ font-size:12px; opacity:.7; color:#b6cce4; }
.dmThreadUser{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.dmThreadNick{ font-size:1.05rem; padding:.3rem .6rem; }
.dmThread{ display:flex; flex-direction:column; gap:8px; padding:0 6px; }
.dmBackBtn{ margin-bottom:6px; }
.dmMsgRow{ display:flex; }
.dmMsgRow.me{ justify-content:flex-end; }
.dmMsgBubble{
  width:min(92%, 860px);
  max-width:100%;
  padding:10px 12px;
  border-radius:14px;
  position:relative;
  overflow:hidden;
  color:#eaf4ff;
  background:
    radial-gradient(120% 140% at 12% 0%, rgba(120,200,255,.16), rgba(12,18,30,.88) 55%),
    linear-gradient(160deg, rgba(16,26,42,.92), rgba(10,18,30,.85));
  border:1px solid rgba(140,190,255,.22);
  box-shadow: 0 10px 24px rgba(0,0,0,.28), inset 0 0 18px rgba(120,180,255,.08);
}
.dmMsgBubble.me{
  background:
    radial-gradient(120% 140% at 88% 0%, rgba(120,200,255,.26), rgba(16,28,46,.86) 58%),
    linear-gradient(160deg, rgba(40,120,255,.3), rgba(20,40,70,.9));
  border-color:rgba(140,190,255,.45);
  box-shadow: 0 12px 26px rgba(0,0,0,.3), inset 0 0 20px rgba(120,180,255,.18);
}
.dmMsgHeader{
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:8px;
}
.dmMsgHeader.me{ justify-content:flex-end; }
.dmMsgAvatar{
  width:34px;
  height:34px;
  border-radius:12px;
  overflow:hidden;
  background:transparent;
  border:none;
  box-shadow:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.dmMsgAvatarImg{ width:100%; height:100%; border-radius:12px; overflow:hidden; background:transparent; border:0; }
.dmMsgNick{ font-size:.95rem; padding:.22rem .52rem; }
.dmFileCard{
  width:64px;
  height:64px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.18);
  background:
    radial-gradient(120% 120% at 10% 0%, rgba(120,200,255,.22), rgba(10,16,30,.92));
  display:inline-flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 8px 18px rgba(0,0,0,.28), inset 0 0 14px rgba(120,180,255,.12);
}
.dmFileIcon{ font-size:22px; line-height:1; }
.mediaBox[data-kind="file"]{ text-decoration:none; }
.dmTextFrame{
  position:relative;
  padding:8px 10px;
  border-radius:12px;
  background:
    linear-gradient(160deg, rgba(12,20,34,.88), rgba(8,14,24,.8));
  border:1px solid rgba(120,180,255,.22);
  box-shadow: inset 0 0 12px rgba(80,140,255,.12);
}
.dmTextFrame::before{
  content:'';
  position:absolute;
  inset:0;
  border-radius:inherit;
  background: radial-gradient(140% 140% at 0% 0%, rgba(120,200,255,.18), transparent 60%);
  opacity:.8;
  pointer-events:none;
}
.dmTextContent{ position:relative; z-index:1; }
.dmMsgFooter{ margin-top:6px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
.dmMsgMeta{ font-size:11px; opacity:.8; white-space:nowrap; display:flex; align-items:center; gap:6px; margin-left:auto; }
.dmStatus{ margin-left:8px; font-weight:700; letter-spacing:.02em; }
.dmStatus.seen{ color:#7fd7ff; text-shadow:0 0 8px rgba(120,200,255,.5); }
.dmMediaGrid{ display:grid; gap:8px; margin-top:8px; }
.dmMediaBox{ margin:0; }
/* ===== DM Voice Player (Quantum Neon) ===== */
.dmVoice{
  --qA: rgba(120,220,255,.92);
  --qB: rgba(190,110,255,.92);
  --qC: rgba(80,255,210,.70);

  display:flex;
  align-items:center;
  gap:12px;
  padding:10px 12px;
  border-radius:16px;
  border:1px solid rgba(140,190,255,.22);
  background:
    radial-gradient(120% 180% at 20% 0%, rgba(120,220,255,.14), transparent 55%),
    radial-gradient(140% 220% at 90% 10%, rgba(190,110,255,.12), transparent 60%),
    linear-gradient(160deg, rgba(10,18,32,.88), rgba(6,12,22,.82));
  box-shadow:
    0 10px 22px rgba(0,0,0,.28),
    inset 0 0 16px rgba(90,160,255,.10);
  backdrop-filter: blur(6px);
}

.dmVoicePlaying{
  border-color: rgba(150,210,255,.30);
  box-shadow:
    0 12px 26px rgba(0,0,0,.30),
    0 0 0 1px rgba(120,220,255,.14),
    inset 0 0 18px rgba(120,220,255,.10);
}

.dmVoiceBtn{
  width:36px;
  height:36px;
  border-radius:999px;
  border:1px solid rgba(140,220,255,.28);
  background:
    radial-gradient(120% 120% at 30% 25%, rgba(140,220,255,.40), rgba(70,120,255,.10)),
    linear-gradient(160deg, rgba(20,30,55,.55), rgba(10,14,26,.55));
  color:#ecf6ff;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:
    0 10px 20px rgba(0,0,0,.26),
    inset 0 0 14px rgba(140,220,255,.14);
  cursor:pointer;
  flex:0 0 auto;
  transition: transform .12s ease, box-shadow .18s ease, border-color .18s ease;
}
.dmVoiceBtn:hover{
  border-color: rgba(170,240,255,.36);
  box-shadow:
    0 12px 24px rgba(0,0,0,.28),
    0 0 18px rgba(120,220,255,.12),
    inset 0 0 16px rgba(140,220,255,.16);
}
.dmVoiceBtn:active{ transform: translateY(1px) scale(.99); }

.dmVoiceMid{
  flex:1 1 auto;
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:8px;
}

.dmVoiceWaveWrap{
  position:relative;
  width:100%;
}

/* вЂњРґРѕСЂРѕР¶РєР°вЂќ РїСЂРѕРіСЂРµСЃСЃР° РїРѕРґ РІРѕР»РЅРѕР№ (РЅРµРѕРЅ, РґРµС€РµРІРѕ РїРѕ CPU) */
.dmVoiceTrack{
  position:absolute;
  left:0; right:0;
  top:50%;
  transform: translateY(-50%);
  height:6px;
  border-radius:999px;
  background: rgba(0,0,0,.22);
  overflow:hidden;
  pointer-events:none;
  box-shadow: inset 0 0 10px rgba(0,0,0,.35);
}
.dmVoiceFill{
  height:100%;
  width:0%;
  background: linear-gradient(90deg, var(--qA), var(--qB), var(--qC));
  filter: drop-shadow(0 0 8px rgba(120,220,255,.26));
  box-shadow: 0 0 18px rgba(120,220,255,.10);
}
.dmVoiceSpark{
  position:absolute;
  top:50%;
  width:14px;
  height:14px;
  border-radius:999px;
  transform: translate(-50%,-50%);
  background: radial-gradient(circle, rgba(240,250,255,.95), rgba(140,220,255,.55), transparent 70%);
  filter: drop-shadow(0 0 10px rgba(140,220,255,.28));
  opacity:.9;
}

/* SVG РІРѕР»РЅР° */
.dmVoiceWave{
  position:relative;
  z-index:1;
  width:100%;
  height:28px;
  display:block;
  border-radius:12px;
  cursor:pointer;
  overflow:hidden;
  background: rgba(0,0,0,.10);
  border:1px solid rgba(140,190,255,.14);
  box-shadow: inset 0 0 14px rgba(0,0,0,.22);
  touch-action: none; /* вњ… РІР°Р¶РЅРѕ РґР»СЏ pointer drag РЅР° РјРѕР±РёР»Рµ */
}

/* Р‘Р°СЂ РІРѕР»РЅС‹: Р±Р°Р·РѕРІС‹Р№ */
.dmWaveBar{
  fill: rgba(150,200,255,.28);
  transition: fill .18s ease, filter .18s ease;
  transform-box: fill-box;
  transform-origin: center;
}

/* РђРєС‚РёРІРЅС‹Рµ Р±Р°СЂС‹ (РґРѕ РїСЂРѕРіСЂРµСЃСЃР°) */
.dmWaveBar.isActive{
  fill: rgba(140,220,255,.92);
  filter: drop-shadow(0 0 8px rgba(120,220,255,.18));
}

/* вЂњРїРѕРґ Р±РёС‚вЂќ вЂ” С‚РѕР»СЊРєРѕ РєРѕРіРґР° РёРіСЂР°РµС‚ (CSS-only, Р»С‘РіРєР°СЏ Р°РЅРёРјР°С†РёСЏ) */
.dmVoicePlaying .dmWaveBar{
  animation: dmWaveBounce 1.15s ease-in-out infinite;
  animation-delay: var(--d);
}

/* Р‘Р°СЂС‹, РєРѕС‚РѕСЂС‹Рµ СѓР¶Рµ вЂњРїСЂРѕР№РґРµРЅРЅС‹РµвЂќ, РїСЂС‹РіР°СЋС‚ С‡СѓС‚СЊ СЏСЂС‡Рµ */
.dmVoicePlaying .dmWaveBar.isActive{
  animation: dmWaveBounceHot 1.05s ease-in-out infinite;
  animation-delay: var(--d);
  filter: drop-shadow(0 0 10px rgba(140,220,255,.20));
}

@keyframes dmWaveBounce{
  0%,100% { transform: scaleY(0.88); opacity: .92; }
  50%     { transform: scaleY(calc(0.92 + (var(--a) * 0.22))); opacity: 1; }
}

@keyframes dmWaveBounceHot{
  0%,100% { transform: scaleY(0.92); }
  50%     { transform: scaleY(calc(1.00 + (var(--a) * 0.30))); }
}

/* РњРµС‚Р°РґР°РЅРЅС‹Рµ */
.dmVoiceMeta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  font-size:11px;
  white-space:nowrap;
  opacity:.92;
}
.dmVoiceTime{ opacity:.86; }

.dmVoiceRate{
  border:1px solid rgba(160,210,255,.22);
  background:
    linear-gradient(90deg, rgba(120,220,255,.18), rgba(190,110,255,.12));
  color:#eaf6ff;
  padding:4px 10px;
  border-radius:999px;
  font-size:11px;
  font-weight:900;
  letter-spacing:.02em;
  cursor:pointer;
  flex:0 0 auto;
  box-shadow: inset 0 0 12px rgba(120,220,255,.08);
  transition: transform .12s ease, border-color .18s ease, box-shadow .18s ease;
}
.dmVoiceRate:hover{
  border-color: rgba(190,240,255,.32);
  box-shadow:
    0 0 14px rgba(120,220,255,.10),
    inset 0 0 14px rgba(140,220,255,.10);
}
.dmVoiceRate:active{ transform: translateY(1px) scale(.99); }

.dmAttachLinks{ margin-top:8px; display:grid; gap:4px; }
.dmAttachLinks a{ color:#9fd1ff; word-break:break-all; }
.dmMsgActions{ display:flex; gap:8px; flex-wrap:wrap; }
.dmActionBtn{
  border:1px solid rgba(140,190,255,.28);
  background:linear-gradient(120deg, rgba(12,20,34,.7), rgba(60,120,255,.18));
  color:#eaf4ff;
  padding:4px 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:800;
  letter-spacing:.02em;
  box-shadow:0 0 14px rgba(80,167,255,.18);
  transition:transform .12s ease, filter .12s ease, box-shadow .18s ease;
  cursor:pointer;
}
.dmActionBtn:hover{ filter:brightness(1.08) saturate(1.08); box-shadow:0 0 18px rgba(80,167,255,.28); }
.dmActionBtn:active{ transform:translateY(1px) scale(.98); }
.dmActionBtn.danger{
  border-color:rgba(255,110,110,.5);
  background:linear-gradient(120deg, rgba(42,10,16,.92), rgba(120,40,55,.55));
  color:#ffd6d6;
  box-shadow:0 0 14px rgba(255,90,90,.25);
}
.dmActionBtn.danger:hover{ filter:brightness(1.08) saturate(1.1); box-shadow:0 0 18px rgba(255,90,90,.32); }
@keyframes dmRowScan{
  0%{ transform: translateX(-120%); }
  45%{ transform: translateX(120%); }
  100%{ transform: translateX(120%); }
}
@keyframes dmRailPulse{
  0%{ transform: translateX(0); opacity: .12; }
  10%{ opacity: .9; }
  48%{ transform: translateX(390%); opacity: .2; }
  100%{ transform: translateX(390%); opacity: .12; }
}
@keyframes dmPulse{
  0%, 100%{ transform:scale(1); box-shadow:0 0 12px rgba(53,208,127,.7); }
  50%{ transform:scale(1.18); box-shadow:0 0 18px rgba(53,208,127,.85); }
}
@media (prefers-reduced-motion: reduce){
  .dmRow, .dmActionBtn, .dmConfirmPop{ transition: none !important; }
  .dmConfirmPop{ animation: none !important; }
  .dmRow::after, .dmUnreadDot, .dmRowRail::after{ animation: none !important; }
}
/* ---- ATTACH (СЃРєСЂРµРїРєР°) вЂ” СЃС‚РёР»СЊ РєР°Рє Сѓ voiceBtn ---- */
.attachBtn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  /* РµРґРёРЅС‹Р№ СЂР°Р·РјРµСЂ; РјРѕР¶РЅРѕ РїРµСЂРµРѕРїСЂРµРґРµР»РёС‚СЊ С‡РµСЂРµР· inline style: '--attach-size':'56px' */
  --attach-size: 48px;
  width: var(--attach-size); height: var(--attach-size);
  border:0; background:transparent; color:#cfe0ff;
  cursor:pointer; transition: transform .12s ease, filter .18s ease;
}
.attachBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.attachBtn:active{ transform:translateY(1px) scale(.98); }

/* СЃРѕСЃС‚РѕСЏРЅРёРµ В«Р·Р°РјРѕРєВ» */
.attachBtn[data-locked="true"]{ opacity:.55; cursor:not-allowed; filter:saturate(.6); }

/* Р°РІС‚Рѕ-РјР°СЃС€С‚Р°Р± РёРєРѕРЅРєРё РїРѕРґ СЂР°Р·РјРµСЂ РєРЅРѕРїРєРё */
.attachBtn svg{ width:calc(var(--attach-size)*.46); height:calc(var(--attach-size)*.46); }

/* Р±РµР№РґР¶-Р·Р°РјРѕРє, РєР°Рє Сѓ РјРёРєСЂРѕС„РѕРЅР° */
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

/* Q COIN: Р·РѕР»РѕС‚РѕР№ РјРёРіР°СЋС‰РёР№ Р±РµР№РґР¶ Г—2 СЃРїСЂР°РІР° РѕС‚ Р»РµР№Р±Р»Р° */
.qcoinLabel{
  display:inline-flex; align-items:center; gap:8px;
}
.qcoinX2{
  display:inline-flex; align-items:center; justify-content:center;
  min-width: 48px; height: 28px; padding: 0 6px;
  border-radius: 999px;
  font: 700 16px/1.1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
  letter-spacing: .5px;
  color:#211;             /* С‚С‘РјРЅС‹Р№ С‚РµРєСЃС‚ РЅРµ РЅСѓР¶РµРЅ вЂ” РґРµР»Р°РµРј В«СЃРІРµС‡РµРЅРёРµВ» С‚РµРєСЃС‚Р° */
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
  /* Р‘Р°Р·РѕРІС‹Р№ РІРёРґ .qcoinX2 СѓР¶Рµ РµСЃС‚СЊ */

/* РђРєС‚РёРІРЅС‹Р№ VIP вЂ” Р·РѕР»РѕС‚РѕР№ СЃ РїРµСЂРµР»РёРІРѕРј (РїРѕРІС‚РѕСЂСЏРµРј СЌС„С„РµРєС‚С‹ Р·Р°РіРѕР»РѕРІРєР°) */
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

/* РќРµ VIP вЂ” Р·Р°РјРµС‚РЅРѕ РјРёРіР°РµС‚ РєСЂР°СЃРЅС‹Рј Рё РєР»РёРєР°Р±РµР»СЊРЅРѕ */
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
  flex-direction: column;       /* С‚РµРїРµСЂСЊ РєРѕР»РѕРЅРєРѕР№ */
  align-items: flex-end;        /* РІС‹СЂР°РІРЅРёРІР°РЅРёРµ РІРїСЂР°РІРѕ, РєР°Рє Рё СЂР°РЅСЊС€Рµ */
  gap: 18px;                     /* РІРµСЂС‚РёРєР°Р»СЊРЅС‹Р№ Р·Р°Р·РѕСЂ РјРµР¶РґСѓ СЃС‚СЂРѕРєР°РјРё */
}
.qcoinTop{
  display: inline-flex;
  align-items: center;
  gap: 20px;                     /* СЂР°СЃСЃС‚РѕСЏРЅРёРµ РјРµР¶РґСѓ Q COIN Рё Г—2 */
}
    
/* Р‘Р°Р·РѕРІР°СЏ РёРєРѕРЅ-РєРЅРѕРїРєР° Р±РµР· С„РѕРЅР° */
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

/* SVG Р°РІС‚РѕРїРѕРґРіРѕРЅ */
.iconBtn svg{ display:block; width:30px; height:30px; }
/* РІСЃС‚СЂРѕРµРЅРЅС‹Р№ РєРѕРјРїРѕР·РµСЂ */
.forumComposer { position: relative; }
  /* phase accents (РєРёР±РµСЂ-РїРѕРґСЃРІРµС‚РєР° РїРѕ СЌС‚Р°РїР°Рј) */
  .composerMediaBar[data-phase="moderating"]{ ... }
  .composerMediaBar[data-phase="uploading"]{ ... }
  .composerMediaBar[data-phase="sending"]{ ... }

  /* Р»С‘РіРєРёР№ "СЃРєР°РЅР»Р°Р№РЅ" РїРѕРІРµСЂС… СЂРµР»СЊСЃС‹ */
  .cmbTrack::after{ ... animation: cmbScan ... }

  /* =========================================================
     Composer media progress bar (РЅР°Рґ РєРѕРЅС‚СЂРѕР»Р°РјРё)
     - РІРёРґРЅР° РѕС‚ РјРѕРјРµРЅС‚Р° РІС‹Р±РѕСЂР°/Р·Р°РїРёСЃРё РґРѕ РѕС‚РїСЂР°РІРєРё РёР»Рё СЃР±СЂРѕСЃР° РјРµРґРёР°
     - СЃР»РµРІР° РјРёРіР°РµС‚ "Loading" (EN)
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
  /* РІРјРµСЃС‚Рѕ РјРёРіР°СЋС‰РµРіРѕ С‚РµРєСЃС‚Р° вЂ” В«С‚РѕС‡РµС‡РЅРѕРµ РєРѕР»РµС‡РєРѕВ» Р·Р°РіСЂСѓР·РєРё */
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
  /* РєРѕРјРїР°РєС‚РЅРµРµ РЅР° РјРѕР±РёР»РєРµ */
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
  padding: 12px 64px;      /* РјРµСЃС‚Рѕ РїРѕРґ СЂРµР»СЊСЃС‹ */
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



/* РєРЅРѕРїРєРё-РёРєРѕРЅРєРё */
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

/* СЃР°РјРѕР»С‘С‚РёРє */
.planeBtn .plane{ fill:#2b8cff; width:22px; height:22px; }
.planeBtn.disabled .plane{ fill:none; stroke:#6f88b3; stroke-width:1.8; opacity:.7; }

/* РјРёРєСЂРѕС„РѕРЅ РїСЂРё Р·Р°РїРёСЃРё */
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

 /* Quest vibro button (РІ РїРѕРїРѕРІРµСЂРµ QCoin) */
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
/* === QUEST: full-width cards, like TopicItem/PostCard === */
.questList { display: grid; gap: .5rem; }
.questItem {                       /* Р±Р°Р·РѕРІС‹Р№ РєРѕРЅС‚РµР№РЅРµСЂ РєРІРµСЃС‚Р° */
  width: 100%;                     /* РІРѕ РІСЃСЋ С€РёСЂРёРЅСѓ РєРѕР»РѕРЅРєРё */
}
.questItem.item {                  /* РЅР°СЃР»РµРґСѓРµРј РІРёР·СѓР°Р» РѕС‚ .item */
  padding: 10px 12px;
  min-height: auto;                /* РїРѕ РєРѕРЅС‚РµРЅС‚Сѓ */
}
/* РїСЂРµРІСЊСЋ Рё Р·Р°РіРѕР»РѕРІРєРё */
.questHead{ display:flex; align-items:center; gap:.6rem; }
.questThumb{
  width: 98px; height: 98px; border-radius: .6rem;
  object-fit: cover; flex: 0 0 38px;
}
.questTitle{ font-weight:700; line-height:1.15; }
.questMeta{ font-size:.82rem; opacity:.8; }

/* Р·Р°РґР°С‡Рё РІРЅСѓС‚СЂРё РєРІРµСЃС‚Р° вЂ” С‚Рµ Р¶Рµ РїРѕР»РЅРѕС€РёСЂРёРЅРЅС‹Рµ РєР°СЂС‚РѕС‡РєРё */
.questTaskList{ display:grid; gap:.5rem; }
.questTask.item{ padding:10px 12px; }
.questTask .right{ margin-left:auto; display:flex; align-items:center; gap:.5rem; }

/* СЃРѕСЃС‚РѕСЏРЅРёСЏ РєРЅРѕРїРѕРє РІС‹РїРѕР»РЅРµРЅРёСЏ */
.btnQuest.do     { background:#1e66ff; }
.btnQuest.done   { background:#16a34a; }
.btnQuest.locked { background:#7a7a7a; cursor:not-allowed; opacity:.7; }

/* РјРёРЅРё-СЃС‡С‘С‚С‡РёРє */
.miniCounter{
  position:absolute; left:10px; inset-inline-start:10px; bottom:6px;
  font-size:12px; opacity:.75; user-select:none;
}

/* RTL fallback for old browsers */
[dir="rtl"] .miniCounter{ left:auto; right:10px; }
.miniCounter .sep{ opacity:.6; padding:0 2px; }
.miniCounter .max{ opacity:.75; }
.miniCounter .over{ color:#ff7f7f; opacity:1; }

/* СЃС‚Р°СЂС‹Рµ СЌР»РµРјРµРЅС‚С‹ РєРѕРјРїРѕР·РµСЂР° РїСЂСЏС‡РµРј (РµСЃР»Рё РѕСЃС‚Р°Р»РёСЃСЊ РІ DOM) */
.tools{ display:none !important; }
/* Р‘Р°Р·РѕРІР°СЏ РёРєРѕРЅ-РєРЅРѕРїРєР° */
.iconBtn{
  -webkit-tap-highlight-color: transparent;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255,255,255,.18);
  background: transparent;
  color: #d9e6ff;
  border-radius: 12px;
  cursor: pointer;
  transition: transform .12s ease, filter .15s ease, border-color .15s ease, background-color .15s ease;
  outline: none;
}
.iconBtn[disabled],
.iconBtn[aria-disabled="true"]{
  opacity: .85;
  cursor: not-allowed;
  filter: saturate(.7);
}

/* Р‘РѕР»СЊС€РѕР№ РєРѕРЅС‚СѓСЂРЅС‹Р№ РїР»СЋСЃ */
.bigPlus{
  width: 48px;
  height: 48px;
  border-radius: 14px;
  backdrop-filter: blur(6px);
  background: rgba(255,255,255,.03);
}
.bigPlus:hover{ 
  filter: brightness(1.08) saturate(1.06);
  border-color: rgba(255,255,255,.32);
  background: rgba(255,255,255,.06);
}
.bigPlus:active{ transform: translateY(1px) scale(.98); }
.iconBtn:focus-visible{ box-shadow: 0 0 0 3px rgba(100,150,255,.35); }
.iconBtn svg{ width: 28px; height: 28px; display: block; }

@media (prefers-color-scheme: dark){
  .iconBtn{ border-color: rgba(255,255,255,.16); }
}
/* РџРѕР»РѕСЃР° РЅР°Рґ СЃРїРёСЃРєРѕРј С‚РµРј СЃ РєРЅРѕРїРєРѕР№-РїР»СЋСЃРѕРј */
.createTopicRow{
  /* РѕС‚СЃС‚СѓРї СЃРІРµСЂС…Сѓ РѕС‚ С€Р°РїРєРё Р±Р»РѕРєР° С‚РµРј */
  margin-block-start: 8px;        /* = margin-top, Р»РѕРіРёС‡РЅРѕ РґР»СЏ RTL */
  /* РІРЅСѓС‚СЂРµРЅРЅРёР№ РїР°РґРґРёРЅРі, С‡С‚РѕР±С‹ РїР»СЋСЃ РЅРµ РїСЂРёР»РёРїР°Р» Рє Р»РµРІРѕРјСѓ Р±РѕСЂРґСЋСЂСѓ РєР°СЂС‚РѕС‡РєРё */
  padding-inline-start: 10px;     /* = padding-left РІ LTR, padding-right РІ RTL */
  padding-inline-end: 10px;
  padding-block-start: 6px;
  padding-block-end: 0;
}

/* СЃР°Рј РїР»СЋСЃ вЂ” РЅРµР±РѕР»СЊС€РѕР№ Р·Р°Р·РѕСЂ РѕС‚ РІРµСЂС…РЅРµР№ РєСЂРѕРјРєРё Рё Р»РµРІРѕРіРѕ Р±РѕСЂС‚Р° */
.createTopicRow .bigPlus{
  margin-block-start: 2px;        /* в†“ РѕС‚СЃС‚СѓРї РѕС‚ РІРµСЂС…РЅРµР№ РєСЂРѕРјРєРё */
  margin-inline-start: 6px;       /* в†ђ РѕС‚СЃС‚СѓРї РѕС‚ Р»РµРІРѕРіРѕ (РёР»Рё РїСЂР°РІРѕРіРѕ РІ RTL) */
}

/* РµСЃР»Рё С…РѕС‡РµС‚СЃСЏ С‡СѓС‚СЊ Р±РѕР»СЊС€Рµ РІРѕР·РґСѓС…Р° РЅР°Рґ РїРµСЂРІРѕР№ РєР°СЂС‚РѕС‡РєРѕР№ С‚РµРјС‹ */
.createTopicRow + .item,
.createTopicRow + div .item{
  margin-block-start: 14px;        /* РїРµСЂРІР°СЏ РєР°СЂС‚РѕС‡РєР° С‚РµРј РѕС‚СЉРµРґРµС‚ РІРЅРёР· */
}

/* РЅР° РѕС‡РµРЅСЊ СѓР·РєРёС… СЌРєСЂР°РЅР°С… РјРѕР¶РЅРѕ СЃР»РµРіРєР° СѓРІРµР»РёС‡РёС‚СЊ РІРЅСѓС‚СЂРµРЅРЅРёРµ РїРѕР»СЏ */
@media (max-width: 420px){
  .createTopicRow{
    padding-inline-start: 12px;
    padding-inline-end: 12px;
    margin-block-start: 10px;
  }
}
/* =========================================================
   Create Topic вЂ” РІСЃРїР»С‹РІР°СЋС‰Р°СЏ С„РѕСЂРјР° РїРѕ С†РµРЅС‚СЂСѓ СЌРєСЂР°РЅР° (Р±РµР· РѕРІРµСЂР»РµСЏ)
   - РќР• Р·Р°РЅРёРјР°РµС‚ РјРµСЃС‚Рѕ РїРѕРґ РєРѕРЅС‚СЂРѕР»Р»Р°РјРё
   - РїРѕРІРµСЂС… РІСЃРµРіРѕ (РІ С‚.С‡. С€Р°РїРєРё), С‚.Рє. СЂРµРЅРґРµСЂРёС‚СЃСЏ РїРѕСЂС‚Р°Р»РѕРј РІ body
========================================================= */
.createTopicModal{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2147483000; /* РјР°РєСЃРёРјР°Р»СЊРЅРѕ РІС‹С€Рµ С€Р°РїРѕРє/Р»РёРїРєРёС… РїР°РЅРµР»РµР№ */
  width: min(92vw, 720px);
  pointer-events: auto;
}
.createTopicModalInner{
  width: 100%;
  max-height: min(78vh, 720px);
  overflow: auto;
  border-radius: 14px;
  box-shadow: 0 18px 55px rgba(0,0,0,.35);
  /* вњ… С‡С‚РѕР±С‹ РЅРµ Р±С‹Р»Р° РїСЂРѕР·СЂР°С‡РЅРѕР№ РєР°Рє .item */
  background: rgba(10,14,22,.96);
  border: 1px solid rgba(255,255,255,.12);
 /* вњ… С‡С‚РѕР±С‹ РІРёР·СѓР°Р»СЊРЅРѕ Р±С‹Р»Рѕ РєР°Рє Сѓ .item (РµСЃР»Рё СЂР°РЅСЊС€Рµ РѕРЅР° РґР°РІР°Р»Р° РѕС‚СЃС‚СѓРїС‹) */
  padding: 12px;
}

/* Р•РґРёРЅР°СЏ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅР°СЏ СЂРµР»СЊСЃР° вЂ” РІРёР·СѓР°Р»СЊРЅРѕ РєР°Рє СЃР°Рј РєРѕРјРїРѕР·РµСЂ */
.topRail{
  width:100%;
  margin-bottom:8px;
}
.topRail .railInner{
  display:grid;
  grid-template-columns: repeat(6, 1fr); /* 6 СЂР°РІРЅС‹С… Р·РѕРЅ */
  align-items:center;
  gap: clamp(8px, 2vw, 16px);
  padding: 8px 10px;

  /* РїРѕРґРіРѕРЅ РїРѕРґ СЃС‚РёР»СЊ РєРѕРјРїРѕР·РµСЂР° */
  border:1px solid rgba(255, 255, 255, 0);
  border-radius:14px;
  background: rgba(10, 14, 22, 0);
  box-shadow: 0 0 0 1px rgba(255,255,255,.02) inset;
  backdrop-filter: blur(6px);
}

.topRail .railItem{
  display:flex;
  justify-content:center;
  align-items:center;
  min-width:0;
}

.topRail .iconBtn{
  width:36px; height:36px;
  display:inline-flex; align-items:center; justify-content:center;
  padding:0; /* РЅРµ РјРµРЅСЏРµРј С‚РІРѕРё РєР»Р°СЃСЃС‹, С‚РѕР»СЊРєРѕ РіР°Р±Р°СЂРёС‚С‹ */
}

.topRail .miniCounter{
  position: static;
  inset: auto;
  display:inline-flex; align-items:center; gap:4px;
  font-size:12px; opacity:.8;
}


/* Р§С‚РѕР± РјРµР¶РґСѓ СЂРµР»СЊСЃРѕР№ Рё РїРѕР»РµРј РІРІРѕРґР° Р±С‹Р»Рѕ СЂРѕРІРЅРѕ РєР°Рє РїРѕ Р±РѕРєР°Рј СЂР°РЅСЊС€Рµ */
.taWrap { gap: 8px; display:flex; flex-direction:column; }

/* ===========================================
   Q-shine: РјСЏРіРєРёР№ Р·РѕР»РѕС‚РѕР№ РїРµСЂРµР»РёРІ РґР»СЏ РєР°СЂС‚РѕС‡РµРє
   =========================================== */
 /* Р—РѕР»РѕС‚РѕР№ VIP-РїРµСЂРµР»РёРІ РґР»СЏ СЃСѓРјРјС‹ РЅР°РіСЂР°РґС‹ вЂ” РєР°Рє Сѓ .qcoinX2.vip */
.goldReward{
  display:inline-block;
  font-weight:800;
  font-size:1.15rem;
  letter-spacing:.02em;
  /* С‚РѕС‚ Р¶Рµ РіСЂР°РґРёРµРЅС‚ Рё СЃРєРѕСЂРѕСЃС‚СЊ В«shineВ», С‡С‚Рѕ Сѓ qcoinX2.vip */
  background:
    linear-gradient(135deg,
      #7a5c00 0%, #ffd700 18%, #fff4b3 32%, #ffd700 46%,
      #ffea80 60%, #b38400 74%, #ffd700 88%, #7a5c00 100%);
  background-size:200% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent; /* СЃР°Рј С‚РµРєСЃС‚ В«Р·РѕР»РѕС‚РёС‚СЃСЏВ» РіСЂР°РґРёРµРЅС‚РѕРј */
  /* СЃРІРµС‡РµРЅРёРµ РєР°Рє Сѓ Р±РµР№РґР¶Р° X2 */
  text-shadow:
     0 0 8px  rgba(255,220,120,.65),
     0 0 18px rgba(255,215,0,.35);
  filter: drop-shadow(0 0 8px rgba(255, 211, 90, 0));
  animation: qcoinShine 6s linear infinite, qcoinGlow 2.8s ease-in-out infinite;
  white-space:nowrap;
}
.goldReward.big{
  font-size:1.35rem;
}
/* РљР°РґСЂС‹ Р°РЅРёРјР°С†РёР№ вЂ” РІ С‚РѕС‡РЅРѕСЃС‚Рё РїРѕРІС‚РѕСЂСЏРµРј РёРґРµСЋ Р±РµР№РґР¶Р° X2 */
@keyframes qcoinShine {
  0%   { background-position:   0% 50% }
  100% { background-position: 200% 50% }
}
@keyframes qcoinGlow {
  0%,100% { text-shadow: 0 0 8px rgba(255,220,120,.55), 0 0 16px rgba(255,215,0,.25) }
  50%     { text-shadow: 0 0 12px rgba(255,220,120,.85), 0 0 24px rgba(255,215,0,.45) }
}

.qshine{
  position: relative;
  isolation: isolate;          /* РїСЃРµРІРґРѕ-СЌР»РµРјРµРЅС‚С‹ РЅРµ РІС‹Р»РµР·Р°СЋС‚ РЅР°СЂСѓР¶Сѓ */
  overflow: hidden;            /* СЃСЂРµР·Р°РµРј Р±Р»РёРє РїРѕ СЂР°РґРёСѓСЃСѓ */
  /* Р»С‘РіРєРѕРµ С‚С‘РїР»РѕРµ СЃРІРµС‡РµРЅРёРµ СЂР°РјРєРё */
  box-shadow:
    0 0 0 1px rgba(255,215,130,.16) inset,
    0 0 0 0 rgba(255,215,130,0),
    0 10px 24px -18px rgba(255,200,120,.25);
}

/* С‚РѕРЅРєР°СЏ В«Р·РѕР»РѕС‚Р°СЏВ» РєСЂРѕРјРєР°, РїРµСЂРµР»РёРІР°СЋС‰Р°СЏСЃСЏ РїРѕ РєСЂСѓРіСѓ (РѕС‡РµРЅСЊ РґРµР»РёРєР°С‚РЅРѕ) */
.qshine::before{
  content:"";
  position:absolute; inset:-1px; border-radius:inherit; pointer-events:none;
  background:
    conic-gradient(from 0deg,
      rgba(255,199,120,.22),
      rgba(255,230,160,.08) 20%,
      rgba(255,255,255,0) 33%,
      rgba(255,230,160,.10) 60%,
      rgba(255,199,120,.22) 100%);
  -webkit-mask: 
    linear-gradient(#000 0 0) content-box, 
    linear-gradient(#000 0 0); /* РІС‹С‡РёС‚Р°РµРј РІРЅСѓС‚СЂРµРЅРЅРѕСЃС‚СЊ вЂ” РѕСЃС‚Р°С‘С‚СЃСЏ В«СЂР°РјРєР°В» */
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  padding:1px;                 /* С‚РѕР»С‰РёРЅР° В«СЂР°РјРєРёВ» */
  opacity:.6;
  animation: qshine-rotate 9s linear infinite;
}
 /* РґРІРёР¶СѓС‰РёР№СЃСЏ В«СЃРѕР»РЅРµС‡РЅС‹Р№ Р·Р°Р№С‡РёРєВ» */
 .qshine::after{
   content:"";
   position:absolute; inset:-30%; pointer-events:none; border-radius:inherit;
   background:
     linear-gradient(115deg,
       rgba(255,255,255,0) 0%,
       rgba(255, 240, 200, 0.01) 35%,
       rgba(255, 220, 140, 0.03) 50%,
       rgba(255, 240, 200, 0.04) 65%,
       rgba(255,255,255,0) 100%);
   transform: translateX(-60%) rotate(8deg);
   mix-blend-mode: screen;
   filter: blur(.4px);
   animation: qshine-sweep 3.8s ease-in-out infinite;
   opacity:.66;
 }
/* РІР°СЂРёР°РЅС‚: Р±Р»РёРє С‚РѕР»СЊРєРѕ РЅР° hover/focus вЂ” РґРѕР±Р°РІСЊ РєР»Р°СЃСЃ .qshine-hover РІРјРµСЃС‚Рѕ .qshine */
.qshine-hover::after{ opacity:0; transform: translateX(-70%) rotate(8deg); }
.qshine-hover:hover::after,
.qshine-hover:focus-within::after{
  opacity:.8; animation: qshine-sweep 1.8s ease-out forwards;
}

/* Р°РЅРёРјР°С†РёРё */
@keyframes qshine-rotate{
  from{ transform: rotate(0deg);   }
  to  { transform: rotate(360deg); }
}
@keyframes qshine-sweep{
  0%   { transform: translateX(-70%) rotate(8deg); }
  48%  { transform: translateX(70%)  rotate(8deg); }
  100% { transform: translateX(80%)  rotate(8deg); }
}

/* СѓРІР°Р¶РµРЅРёРµ Рє reduce-motion */
@media (prefers-reduced-motion: reduce){
  .qshine::before{ animation: none; }
  .qshine::after { animation: none; opacity:.12; }
}

/* РµСЃР»Рё СЌС„С„РµРєС‚ С…РѕС‡РµС‚СЃСЏ СЃРґРµР»Р°С‚СЊ С‡СѓС‚СЊ С‚РёС€Рµ/СЏСЂС‡Рµ вЂ” РІРѕС‚ СЂСѓС‡РєРё */
.qshine[data-intensity="soft"]::after{ opacity:.4 }
.qshine[data-intensity="hard"]{ box-shadow:0 0 0 1px rgba(255,215,130,.22) inset, 0 12px 28px -14px rgba(255,200,120,.35); }
.qshine[data-intensity="hard"]::after{ opacity:.85 }
 .tag.ok{ background:#16a34a; color:#fff; border-color:#15803d }
.tag.info{ background:#6366f1; color:#fff; border-color:#4f46e5 }
.tag.warn { background:#ef4444; color:#fff; border:1px solid #dc2626 } /* РєР°Рє Р±С‹Р»Рѕ */

/* СѓРІРµР»РёС‡РµРЅРЅС‹Р№ РєСЂРµСЃС‚РёРє РІ РїСЂРµРІСЊСЋ VIP/MOZI */
.emojiRemoveBtn {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 30px;
  height: 30px;
  line-height: 30px;
  font-size: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.emojiRemoveBtn:hover {
  transform: scale(1.2);
}

/* СЂР°Р·РјРµСЂ РїСЂРµРІСЊСЋ VIP/MOZI РІ composer */
.emojiPreviewBig {
  width: 80px;
  height: 80px;
  display: inline-block;
  vertical-align: middle;
}

/* СЂР°Р·РјРµСЂ VIP/MOZI РІ РїРѕСЃС‚Р°С… */
.emojiPostBig {
  width: 64px;
  height: 64px;
  display: inline-block;
  vertical-align: middle;
}
/* РѕР±С‘СЂС‚РєР° РїРѕРґ РєСЂСѓРїРЅС‹Рµ СЌРјРѕРґР·Рё РІ РєР°СЂС‚РѕС‡РєРµ */
.emojiPostWrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0;
}

/* СЂР°Р·РјРµСЂ VIP/MOZI СЌРјРѕРґР·Рё РІ РєР°СЂС‚РѕС‡РєР°С… */
.emojiPostBig {
  width: 250px;
  height: 250px;
  display: inline-block;
  vertical-align: middle;
  transition: transform .15s ease;
}
.emojiPostBig:hover {
  transform: scale(1.08);
}

/* РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РґР»СЏ MOZI РјРѕР¶РЅРѕ Р·Р°РґР°С‚СЊ СЃРІРѕР№ СЂР°Р·РјРµСЂ */
.moziEmojiBig.emojiPostBig {
  width: 84px;
  height: 84px;
}
/* РђР±СЃРѕР»СЋС‚РЅРѕ В«С‡РёСЃС‚Р°СЏВ» РєР°СЂС‚РёРЅРєР°: РЅРё С„РѕРЅР°, РЅРё СЂР°РјРѕРє, РЅРё РїРѕРґСЃРІРµС‚РєРё С„РѕРєСѓСЃР° */
.questIconPure {
  width: var(--quest-w, 64px);
  height: var(--quest-h, auto);
  display: inline-block;
  background: transparent !important;
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0;
  margin: 0;
  cursor: var(--quest-cursor, pointer);
  image-rendering: auto;
  transform: translateY(var(--quest-y, 0));
/* СѓР±РёСЂР°РµРј РјРѕР±РёР»СЊРЅС‹Р№ tap-highlight, РІС‹РґРµР»РµРЅРёРµ Рё РєРѕР»СЊС†Р° С„РѕРєСѓСЃР° */
  -webkit-tap-highlight-color: transparent;
  -webkit-focus-ring-color: rgba(0,0,0,0);
  -webkit-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* Р’С‹РєР»СЋС‡РµРЅРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ */
.questIconPure[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}

/* РіР°СЃРёРј РІРёР·СѓР°Р»СЊРЅС‹Р№ В«РєР»РёРєВ»/focus */
.questIconPure:active,
.questIconPure:focus,
.questIconPure:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* РЅР° РІСЃСЏРєРёР№ СЃР»СѓС‡Р°Р№ вЂ” СѓР±РёСЂР°РµРј РїРѕРґСЃРІРµС‚РєСѓ РІС‹РґРµР»РµРЅРёСЏ РїРёРєС‡Рё РїСЂРё С‚Р°РїРµ/РґР°Р±Р»-С‚Р°РїРµ */
.questIconPure::selection {
  background: transparent;
} 
/* === Forum Topic Title Controls === */
:root{
  --forum-topic-title-font: var(--font-forum-title), system-ui, -apple-system, "Segoe UI", sans-serif;
  --forum-topic-title-size: 25px;
  --forum-topic-title-color: #fec301ff;
}

/* Р•РґРёРЅС‹Р№ СЃС‚РёР»СЊ Р·Р°РіРѕР»РѕРІРєРѕРІ С‚РµРј РІ С„РѕСЂСѓРјРµ */
.forum_root [id^="topic_"] .title,
.forum_root .topicCard .title,
.forum_root .topicTitle,
.forum_root [id^="topic_"] h1,
.forum_root [id^="topic_"] h2,
.forum_root [id^="topic_"] h3,
.forum_root .topicCard h1,
.forum_root .topicCard h2,
.forum_root .topicCard h3 {
  font-family: var(--forum-topic-title-font) !important;
  font-weight: 800;
  font-size: var(--forum-topic-title-size) !important;
  color: var(--forum-topic-title-color) !important;

  letter-spacing: .06em;
  text-transform: none;

  /* Р»С‘РіРєРёР№ В«РєСЂРёРїС‚Рѕ-РЅРµРѕРЅВ» СЃРїРµС†СЌС„С„РµРєС‚ */
  text-shadow:
    0 0 6px rgba(0, 200, 255, 0.55),
    0 0 14px rgba(0, 0, 0, 0.85);
}
/* РѕР±С‰РёР№ Р»РёРїРєРёР№ РґРѕРє РІРЅРёР·Сѓ РѕРєРЅР° вЂ” РґРµСЂР¶РёС‚ РєРѕРјРїРѕР·РµСЂ Рё FAB РЅР° РјРµСЃС‚Рµ */
.composeDock{
  position: sticky;
  bottom: 0;
  z-index: 40;          /* РїРѕРІРµСЂС… РєРѕРЅС‚РµРЅС‚Р° СЃРѕ СЃРєСЂРѕР»Р»РѕРј */
  pointer-events: none; /* СЃР°Рј РґРѕРє РєР»РёРєРё РЅРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµС‚ */
}
/* РµРіРѕ РґРµС‚Рё РєР»РёРєР°Р±РµР»СЊРЅС‹ */
.composeDock > *{ pointer-events: auto; }

/* РїСЂСЏС‡РµРј РєРѕРјРїРѕР·РµСЂ, РєРѕРіРґР° РѕРЅ РІС‹РєР»СЋС‡РµРЅ вЂ” РµСЃР»Рё Сѓ С‚РµР±СЏ СЌС‚Рѕ СѓР¶Рµ РµСЃС‚СЊ, РѕСЃС‚Р°РІСЊ СЃРІРѕС‘ */
.composer:not([data-active="true"]){
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
  transition: transform .18s ease, opacity .12s ease;
}

/* FAB РІРЅСѓС‚СЂРё РґРѕРєР°: РїРѕР·РёС†РёРѕРЅРёСЂСѓРµРј Рє РїСЂР°РІРѕРјСѓ РЅРёР¶РЅРµРјСѓ СѓРіР»Сѓ РґРѕРєР° */
.fabCompose{
  --fab-size: 50px;
  --fab-right: 16px;   /* РјРѕР¶РЅРѕ РјРµРЅСЏС‚СЊ РїРѕР·РёС†РёСЋ */
  --fab-bottom: 36px;  /* РјРѕР¶РЅРѕ РјРµРЅСЏС‚СЊ РїРѕР·РёС†РёСЋ */

  position: absolute;
  right: max(var(--fab-right), env(safe-area-inset-right));
  bottom: max(var(--fab-bottom), env(safe-area-inset-bottom));
  width: var(--fab-size);
  height: var(--fab-size);
  border: 0;
  border-radius: 50%;
  background: #00aeff8c;
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 28px rgba(252, 191, 7, 0.47), 0 0 24px rgba(248, 249, 252, 1);
  cursor: pointer;
  z-index: 4000;
  transition: transform .12s ease, filter .14s ease, box-shadow .18s ease;
}
.fabCompose svg{ width: 28px; height: 28px; display:block; fill: currentColor; }

/* РїСЂСЏС‡РµРј FAB, РєРѕРіРґР° РєРѕРјРїРѕР·РµСЂ Р°РєС‚РёРІРµРЅ */
.composer[data-active="true"] ~ .fabCompose{
  opacity: 0; transform: translateY(4px) scale(.98); pointer-events: none;
}

:root{
  --head-open-threshold-desktop: 350px;
  --head-close-threshold-desktop: 1100px;

  --head-open-threshold-mobile: 300px;
  --head-close-threshold-mobile: 900px;
}

@media (max-width: 640px){
  :root{
    --head-open-threshold-mobile: 300px;
    --head-close-threshold-mobile: 900px;
  }
}

/* ===== unified pulse rails ===== */
.forumDividerRail{
  --rail-base-start: rgba(255,255,255,.08);
  --rail-base-mid: rgba(255,255,255,.48);
  --rail-base-end: rgba(255,255,255,.08);
  --rail-beam: rgba(255,255,255,.9);
  --rail-shadow: rgba(255,255,255,.45);
  position: relative;
  height: 1px;
  margin: 7px 4px;
  border-radius: 999px;
  overflow: hidden;
  opacity: .85;
  background: linear-gradient(90deg, var(--rail-base-start), var(--rail-base-mid), var(--rail-base-end));
}
.forumDividerRail::after{
  content:'';
  position:absolute;
  top:0;
  left:-36%;
  width:36%;
  height:100%;
  background: linear-gradient(90deg, rgba(255,255,255,0), var(--rail-beam), rgba(255,255,255,0));
  filter: drop-shadow(0 0 8px var(--rail-shadow));
  animation: forumDividerPulse 2.3s linear infinite;
}
.forumDividerRail--gold{
  --rail-base-start: rgba(255,205,100,.06);
  --rail-base-mid: rgba(255,214,120,.58);
  --rail-base-end: rgba(255,205,100,.06);
  --rail-beam: rgba(255,236,166,.95);
  --rail-shadow: rgba(255,205,100,.65);
}
.forumDividerRail--cyan{
  --rail-base-start: rgba(120,180,255,.06);
  --rail-base-mid: rgba(120,180,255,.56);
  --rail-base-end: rgba(120,180,255,.06);
  --rail-beam: rgba(130,220,255,.94);
  --rail-shadow: rgba(130,220,255,.58);
}
.forumActionDivider,
.inboxTabsRail,
.aboutRailLine,
.userInfoRail{
  position: relative;
  overflow: hidden;
}
.forumActionDivider{
  margin: 7px 4px;
}
.forumActionDivider,
.inboxTabsRail,
.aboutRailLine,
.userInfoRail{
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,205,100,.06), rgba(255,214,120,.58), rgba(255,205,100,.06));
}
.forumActionDivider::after,
.inboxTabsRail::after,
.aboutRailLine::after,
.userInfoRail::after{
  content:'';
  position:absolute;
  top:0;
  left:-34%;
  width:34%;
  height:100%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,236,166,.95), rgba(255,255,255,0));
  filter: drop-shadow(0 0 8px rgba(255,205,100,.62));
  animation: forumDividerPulse 2.4s linear infinite;
}
.inboxTabsRail::after{ animation-delay: .2s; }
.aboutRailLine::after{ animation-delay: .45s; }
.userInfoRail::after{ animation-delay: .75s; }

/* keep about rail pencil exactly visible like original */
.aboutRailLine{
  height: 2px;
  overflow: visible;
  isolation: isolate;
  clip-path: inset(-12px 0 -12px 0);
}
.aboutRailPencil{
  z-index: 2;
  right: 1px;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.62));
}
.aboutRailPencil svg{
  display: block;
}
.aboutRailPencil path{
  stroke: #fff;
}

/* PostCard media should touch side edges of post body frame */
.postBodyFrame .postImages,
.postBodyFrame .postVideo,
.postBodyFrame .postAudio{
  margin-inline: -10px; /* 14px container padding -> 4px side inset */
}
.userBranchHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:10px 12px;
  margin:4px 0 8px;
  border-radius:12px;
  border:1px solid rgba(120,180,255,.28);
  background:linear-gradient(120deg, rgba(12,20,34,.72), rgba(24,44,76,.58));
  box-shadow:0 8px 20px rgba(0,0,0,.22), inset 0 0 0 1px rgba(255,255,255,.03);
}
.userBranchTitle{
  font-size:13px;
  font-weight:700;
  color:rgba(228,242,255,.94);
}
.userBranchTitleNick{
  color:#fff;
  text-shadow:0 0 10px rgba(120,180,255,.2);
}
.userBranchClose{
  width:28px;
  height:28px;
  min-width:28px;
  border-radius:999px;
  border:1px solid rgba(160,195,255,.35);
  background:linear-gradient(140deg, rgba(12,20,36,.85), rgba(22,40,70,.72));
  color:#eaf4ff;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 0 12px rgba(110,170,255,.16);
}
.userBranchClose:hover{ filter:brightness(1.08); }
.userBranchClose:active{ transform:translateY(1px); }
.dmRowRail{
  background: linear-gradient(90deg, rgba(120,180,255,.05), rgba(120,180,255,.48), rgba(120,180,255,.05));
}
.dmRowRail::after{
  background: linear-gradient(90deg, rgba(100,210,255,0), rgba(100,210,255,.95), rgba(100,210,255,0));
  filter: drop-shadow(0 0 7px rgba(100,210,255,.55));
  animation: forumDividerPulse 2.3s linear infinite;
}
@keyframes forumDividerPulse{
  0%{ transform: translateX(0); opacity: .12; }
  10%{ opacity: .92; }
  48%{ transform: translateX(390%); opacity: .2; }
  100%{ transform: translateX(390%); opacity: .12; }
}

/* ===== animated search/sort/vip controls ===== */
.searchResultIcon{
  width: 22px;
  height: 22px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.searchResultIcon svg{
  width: 100%;
  height: 100%;
  display: block;
}
.forumControlBtn{
  border-color: rgba(140,190,255,.32);
  box-shadow: 0 0 16px rgba(80,167,255,.18), inset 0 0 12px rgba(120,180,255,.08);
}
.forumControlBtn--active{
  border-color: rgba(170,220,255,.75);
  box-shadow: 0 0 20px rgba(80,167,255,.35), inset 0 0 16px rgba(120,200,255,.18);
}
.forumControlBtn .forumCtlFx{
  color: #dff2ff;
}
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

@media (prefers-reduced-motion: reduce){
  .forumVipControlBtn::before,
  .forumVipControlBtn::after,
  .forumVipControlBtn .forumVipControlText{
    animation: none !important;
  }
  .forumDividerRail::after,
  .forumActionDivider::after,
  .inboxTabsRail::after,
  .aboutRailLine::after,
  .userInfoRail::after,
  .dmRowRail::after{
    animation: none !important;
  }
}


`

const Styles = () => (
  <style jsx global>{FORUM_STYLES}</style>
)

export default Styles


