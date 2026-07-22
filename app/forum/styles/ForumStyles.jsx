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
      contain: paint;
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
    @media (pointer: coarse), (max-width: 680px), (prefers-reduced-motion: reduce){
      .postBodyFrame{
        backdrop-filter: none;
        box-shadow:
          0 6px 14px rgba(0,0,0,.22),
          inset 0 0 0 1px rgba(255,255,255,.04);
      }
      .postBodyFrame::before,
      .postBodyFrame::after{
        opacity: .45;
      }
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
  --mb-video-min-h-mobile: 650px;
  --mb-video-min-h-tablet: 550px;
  --mb-video-min-h-desktop: 550px;      
      --mb-image-h-mobile: 650px;
      --mb-image-h-tablet: 550px;
      --mb-image-h-desktop: 550px;
      --mb-iframe-h-mobile: 650px;
      --mb-iframe-h-tablet: 550px;
      --mb-iframe-h-desktop: 550px;
  /* YouTube iframe: РјРёРЅРёРјР°Р»СЊРЅР°СЏ РІС‹СЃРѕС‚Р° (РјРѕР±/РїР»Р°РЅС€/РґРµСЃРєС‚РѕРї)
     - max-height СѓР¶Рµ СѓРїСЂР°РІР»СЏРµС‚СЃСЏ С‡РµСЂРµР· --mb-iframe-h-*
     - СЌС‚Рѕ РёРјРµРЅРЅРѕ РЅРёР¶РЅСЏСЏ РіСЂР°РЅРёС†Р°, С‡С‚РѕР±С‹ РєР°СЂС‚РѕС‡РєР° YouTube РЅРµ Р±С‹Р»Р° В«СЃР»РёС€РєРѕРј РЅРёР·РєРѕР№В»
  */
  --mb-yt-iframe-min-h-mobile: 650px;
  --mb-yt-iframe-min-h-tablet: 550px;
  --mb-yt-iframe-min-h-desktop: 550px;      
      --mb-audio-h-mobile: 630px;
      --mb-audio-h-tablet: 650px;
      --mb-audio-h-desktop: 700px;
      --mb-qcast-h-mobile: 400px;
      --mb-qcast-h-tablet: 650px;
      --mb-qcast-h-desktop: 650px;      
      --mb-ad-h-mobile: 520px;
      --mb-ad-h-tablet: 620px;
      --mb-ad-h-desktop: 650px;

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


/* Windowing stability: the browser owns feed scroll anchoring.
   Heavy media shells opt out so iframe/video resizes do not become anchors. */
.forum_root .loadMoreFooter,
.forum_root .mediaBox,
.forum_root .ql7VideoSurface,
.forum_root .ql7ExternalVideoSurface,
.forum_root iframe[data-forum-media],
.forum_root video[data-forum-video="post"]{
  overflow-anchor: none;
}

    .mediaBox{
      position:relative;
      width:100%;
      /* Р РµР·РёРЅРѕРІР°СЏ РєР°СЂС‚РѕС‡РєР°: СЂР°СЃС‚С‘С‚ РїРѕ РєРѕРЅС‚РµРЅС‚Сѓ, РЅРѕ РЅРµ РІС‹С€Рµ max-height (РїРµСЂРµРјРµРЅРЅРѕР№) */
      max-height:var(--mb-h, 240px);
      height:auto;
      overflow:hidden;
      border-radius:12px;
      background:#000;
      border:1px solid rgba(140,170,255,.25);
      contain: layout paint;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .mediaBox[data-kind="video"]{ --mb-h: var(--mb-video-h); height: var(--mb-video-h); max-height: var(--mb-video-h); background:#000; }
    .mediaBox[data-kind="image"]{ --mb-h: var(--mb-image-h); }
.mediaBox[data-kind="iframe"]{
  --mb-h: var(--mb-iframe-h);
  min-height: var(--mb-iframe-h);
  height: var(--mb-iframe-h);
  max-height: var(--mb-iframe-h);
  background:#000;
  position:relative;
  overflow:hidden; 
}

    .mediaBox[data-kind="audio"]{ --mb-h: var(--mb-audio-h); background:#000; }
    /* QCast: РѕС‚РґРµР»СЊРЅР°СЏ РјР°РєСЃРёРјР°Р»СЊРЅР°СЏ РІС‹СЃРѕС‚Р° */
    .mediaBox[data-kind="qcast"]{ --mb-h: var(--mb-qcast-h); background:#000; }
    .mediaBox[data-kind="ad"]{ --mb-h: var(--mb-ad-h); background:#000; }
    .forumAdSlotPlaceholder{
      position: relative;
      width: 100%;
      min-height: var(--mb-ad-h);
      height: var(--mb-ad-h);
      max-height: var(--mb-ad-h);
      border-radius: 12px;
      border: 1px solid rgba(120,170,255,.22);
      background:
        radial-gradient(120% 70% at 50% 0%, rgba(120,180,255,.12), rgba(6,10,18,.92)),
        linear-gradient(180deg, rgba(12,20,36,.82), rgba(8,14,26,.92));
      overflow: hidden;
      pointer-events: none;
      opacity: .42;
    }
    .forumAdSlotPlaceholder::after{
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(255,255,255,0), rgba(135,195,255,.18), rgba(255,255,255,0));
      transform: translateX(-120%);
      animation: forumAdPlaceholderPulse 2.8s linear infinite;
    }
    @keyframes forumAdPlaceholderPulse{
      0%{ transform: translateX(-120%); opacity: .3; }
      35%{ opacity: .6; }
      100%{ transform: translateX(120%); opacity: .18; }
    }

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

    /* QL7 custom video controls (post video only) */
    .ql7VideoSurface{
      position:relative;
      width:100%;
      height:100%;
      display:block;
      overflow:hidden;
      background:#000;
      isolation:isolate;
      touch-action:manipulation;
      -webkit-tap-highlight-color:transparent;
    }
    .ql7VideoSurface > video{
      width:100%;
      height:100%;
      display:block;
      object-fit:contain;
      background:#000;
      opacity:1;
      transform:none;
      -webkit-transform:none;
      backface-visibility:visible;
      -webkit-backface-visibility:visible;
      will-change:auto;
      filter:none;
      -webkit-appearance:none !important;
      appearance:none !important;
    }
    .videoCard video[data-front-camera-mirror="1"],
    .attachPreviewRow video[data-front-camera-mirror="1"]{
      transform:scaleX(-1);
      -webkit-transform:scaleX(-1);
      transform-origin:center center;
    }
    /* QL7_FRONT_CAMERA_NATIVE_CONTROLS_FIX_V1:
       the recorded front-camera pixels stay mirrored, native controls do not. */
    .attachPreviewRow video[data-front-camera-mirror="1"]::-webkit-media-controls,
    .attachPreviewRow video[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
    .attachPreviewRow video[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure,
    .voPreviewVideo[data-front-camera-mirror="1"]::-webkit-media-controls,
    .voPreviewVideo[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
    .voPreviewVideo[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure,
    .dmMediaBox[data-kind="video"] video[data-front-camera-mirror="1"]::-webkit-media-controls,
    .dmMediaBox[data-kind="video"] video[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
    .dmMediaBox[data-kind="video"] video[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure,
    .dmMediaBox[data-kind="video"] > video[data-front-camera-mirror="1"]::-webkit-media-controls,
    .dmMediaBox[data-kind="video"] > video[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
    .dmMediaBox[data-kind="video"] > video[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure{
      transform:scaleX(-1);
      -webkit-transform:scaleX(-1);
      transform-origin:center center;
    }
    @supports (-webkit-touch-callout:none){
      .attachPreviewRow video[data-front-camera-mirror="1"]::-webkit-media-controls,
      .attachPreviewRow video[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
      .attachPreviewRow video[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure,
      .voPreviewVideo[data-front-camera-mirror="1"]::-webkit-media-controls,
      .voPreviewVideo[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
      .voPreviewVideo[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure,
      .dmMediaBox[data-kind="video"] video[data-front-camera-mirror="1"]::-webkit-media-controls,
      .dmMediaBox[data-kind="video"] video[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
      .dmMediaBox[data-kind="video"] video[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure,
      .dmMediaBox[data-kind="video"] > video[data-front-camera-mirror="1"]::-webkit-media-controls,
      .dmMediaBox[data-kind="video"] > video[data-front-camera-mirror="1"]::-webkit-media-controls-panel,
      .dmMediaBox[data-kind="video"] > video[data-front-camera-mirror="1"]::-webkit-media-controls-enclosure{
        transform:none !important;
        -webkit-transform:none !important;
      }
    }
.mediaBox[data-kind="iframe"] > .ql7ExternalVideoSurface{
  width:100%;
  height:100%;
  min-height:100%;
  max-height:100%;
}

.ql7ExternalVideoSurface > iframe,
.ql7ExternalFrame{
  width:100%;
  height:100%;
  min-height:100%;
  max-height:100%;
  display:block;
  border:0;
  background:#000;
  pointer-events:none !important;
  user-select:none;
  -webkit-user-select:none;
}

.ql7ExternalProviderShield{
  position:absolute;
  inset:0;
  z-index:2;
  pointer-events:none;
  opacity:1;
  background:transparent !important;
  transition:none;
}

.ql7ExternalProviderShield.isVisible{
  opacity:1;
  background:transparent !important;
}
.ql7ExternalVideoSurface[data-forum-external-kind="youtube"] > iframe{
  aspect-ratio:16/9;
}

.ql7ExternalVideoSurface[data-forum-external-kind="tiktok"] > iframe{
  aspect-ratio:9/16;
}      
    .ql7VideoSurface > video::-webkit-media-controls{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-enclosure{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-panel{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-play-button{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-start-playback-button{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-timeline{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-current-time-display{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-time-remaining-display{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-volume-slider{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-mute-button{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-toggle-closed-captions-button{ display:none !important; }
    .ql7VideoSurface > video::-webkit-media-controls-fullscreen-button{ display:none !important; }
    .ql7VideoSurface > video::-moz-media-controls{ display:none !important; } 
    .ql7VideoSurface > video::-webkit-media-controls-overlay-play-button{ display:none !important; }
    .ql7VideoHud{
      position:absolute;
      inset:0;
      pointer-events:none;
      opacity:0;
      transition:opacity .18s ease;
      z-index:3;
    }
    .ql7VideoHud.isVisible{
      opacity:1;
    }
    .ql7VideoCenter{
      pointer-events:auto;
      appearance:none;
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%) scale(.9);
      width:132px;
      height:132px;
      border-radius:24px;
      border:0;
      background:transparent;
      color:#8ae9ff;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:none;
      opacity:0;
      transition:transform .2s ease, opacity .18s ease, filter .2s ease;
      cursor:pointer;
      overflow:hidden;
    }
    .ql7VideoCenter.isVisible{
      opacity:1;
      transform:translate(-50%,-50%) scale(1);
      filter:drop-shadow(0 0 16px rgba(124,231,255,.6)) drop-shadow(0 0 34px rgba(121,122,255,.38));
    }
    .ql7VideoCenter:hover{
      filter:drop-shadow(0 0 20px rgba(124,231,255,.75)) drop-shadow(0 0 46px rgba(255,136,224,.32));
    }
    .ql7VideoCenter:active{
      transform:translate(-50%,-50%) scale(.95);
      filter:drop-shadow(0 0 14px rgba(124,231,255,.58)) drop-shadow(0 0 30px rgba(255,136,224,.26));
    }
    .ql7VideoCenter > svg{
      width:106px;
      height:106px;
      z-index:3;
      filter:drop-shadow(0 0 10px rgba(134,236,255,.7));
    }
    .ql7VideoCenter .ql7Glyph{
      color:inherit;
    }
 
    .ql7VideoRail{
      pointer-events:auto;
      position:absolute;
      right:10px;
      bottom:14px;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:8px;
      opacity:0;
      transform:translateY(8px);
      transition:opacity .18s ease, transform .2s ease;
      z-index:4;
    }
    .ql7VideoRail.isVisible{
      opacity:1;
      transform:translateY(0);
    }
    .ql7VideoRailBtn{
      appearance:none;
      width:64px;
      height:64px;
      border-radius:14px;
      border:0;
      background:transparent;
      color:#a7ecff;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      transition:transform .16s ease, filter .2s ease;
      position:relative;
      overflow:visible;
    }
    .ql7VideoRailBtn::before{
      content:"";
      position:absolute;
      inset:8px;
      border:1px solid currentColor;
      border-radius:12px;
      clip-path:polygon(18% 0, 82% 0, 100% 26%, 100% 74%, 82% 100%, 18% 100%, 0 74%, 0 26%);
      opacity:.75;
      pointer-events:none;
      animation:ql7CenterGlint 2.4s ease-in-out infinite;
    }
    .ql7VideoRailBtn > svg{
      position:relative;
      z-index:2;
      width:38px;
      height:38px;
      color:currentColor;
      filter:drop-shadow(0 0 8px rgba(152,236,255,.6));
    }
    .ql7VideoRailBtn:hover{
      transform:translateY(-1px) scale(1.03);
      filter:brightness(1.16) drop-shadow(0 0 10px currentColor);
    }
    .ql7VideoRailBtn:active{
      transform:scale(.95);
    }
    .ql7VideoRailBtn--good{
      color:#7be8ff;
      transform:rotate(45deg);
    }
    .ql7VideoRailBtn--good::before{
      border-radius:13px;
    }
    .ql7VideoRailBtn--good > svg{
      transform:rotate(-45deg);
    }
    .ql7VideoRailBtn--bad{
      color:#f295ff;
    }
    .ql7VideoRailBtn--bad::before{
      clip-path:polygon(25% 2%, 75% 2%, 98% 50%, 75% 98%, 25% 98%, 2% 50%);
      border-radius:2px;
    }
    .ql7VideoRailBtn--sound{
      width:70px;
      height:70px;
      color:#ffe3a8;
    }
    .ql7VideoRailBtn--sound::before{
      inset:10px;
      border-radius:999px;
      clip-path:none;
    }
    .ql7VideoRailBtn--sound > svg{
      width:40px;
      height:40px;
      filter:drop-shadow(0 0 10px rgba(255,223,152,.65));
    }
    .ql7VideoRailBtn--good:hover{
      transform:rotate(45deg) translateY(-1px) scale(1.03);
    }
    .ql7VideoRailBtn--good:active{
      transform:rotate(45deg) scale(.95);
    }

    .ql7VideoFxLayer{
      position:fixed;
      inset:0;
      pointer-events:none;
      z-index:2140;
      overflow:hidden;
    }
    .ql7VideoFx{
      position:absolute;
      transform:translate(-50%, -50%);
      font-size:var(--size, 42px);
      line-height:1;
      user-select:none;
      will-change:transform, opacity;
      animation:ql7VideoFxFloat var(--dur, 1400ms) cubic-bezier(.18,.86,.2,1) var(--delay, 0ms) forwards;
      text-shadow:0 0 24px rgba(255,255,255,.75), 0 0 42px rgba(122,214,255,.45);
      filter:drop-shadow(0 0 14px rgba(92,201,255,.42));
    }
    @keyframes ql7VideoFxFloat{
      0%{
        transform:translate(-50%, -50%) scale(.62) rotate(0deg);
        opacity:.02;
      }
      12%{
        opacity:1;
      }
      100%{
        transform:
          translate(calc(-50% + var(--dx, 0px) + (var(--drift, 0) * 60px)),
                    calc(-50% + var(--dy, -220px)))
          scale(1.48)
          rotate(calc(var(--drift, 0) * 360deg));
        opacity:0;
      }
    }
    @keyframes ql7OutlineSpin{
      from{ transform:rotate(0deg); }
      to{ transform:rotate(360deg); }
    }
    @keyframes ql7CenterGlint{
      0%,100%{ opacity:.34; }
      50%{ opacity:.9; }
    }
    @media (max-width:680px){
      .ql7VideoCenter{
        width:110px;
        height:110px;
      }
      .ql7VideoCenter > svg{
        width:92px;
        height:92px;
      }
      .ql7VideoRail{
        right:8px;
        bottom:12px;
      }
      .ql7VideoRailBtn{
        width:58px;
        height:58px;
      }
      .ql7VideoRailBtn--sound{
        width:64px;
        height:64px;
      }
      .ql7VideoFx{
        font-size:var(--size, 38px);
      }
    }

    /* iframe: РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ 16:9, РґР»СЏ TikTok вЂ” 9:16 */
.mediaBox > iframe{
      width:100%;
      height:100%;
      min-height:100%;
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

/* ===== QL7 account deletion contour: premium cyber-danger UI ===== */
.profileFooterBar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:8px;
}
.profileFooterActions{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:8px;
  min-width:0;
}
.profileDeleteLauncher{
  position:relative;
  min-width:0;
  height:40px;
  padding:0 12px 0 8px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  border-radius:14px;
  border:1px solid rgba(255,74,102,.42);
  color:#ffe6eb;
  background:
    radial-gradient(130% 150% at 20% 0%, rgba(255,92,118,.28), rgba(60,0,10,.1) 55%),
    linear-gradient(135deg, rgba(40,5,12,.94), rgba(110,0,24,.62));
  box-shadow:
    0 0 22px rgba(255,49,88,.2),
    inset 0 0 0 1px rgba(255,255,255,.06),
    inset 0 -12px 22px rgba(0,0,0,.28);
  overflow:hidden;
  cursor:pointer;
  transition:transform .14s ease, filter .14s ease, border-color .18s ease, box-shadow .18s ease;
}
.profileDeleteLauncher::before{
  content:"";
  position:absolute;
  inset:-2px;
  border-radius:16px;
  pointer-events:none;
  background:conic-gradient(from 180deg, rgba(255,49,88,0), rgba(255,49,88,.82), rgba(255,190,92,.18), rgba(255,49,88,0));
  opacity:.42;
  filter:blur(.15px);
  padding:2px;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite:exclude;
  -webkit-mask-composite:xor;
}
.profileDeleteLauncher::after{
  content:"";
  position:absolute;
  top:-42%;
  bottom:-42%;
  left:-38%;
  width:30%;
  transform:rotate(18deg);
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
  opacity:.55;
  transition:transform .48s ease;
}
.profileDeleteLauncher:hover{
  transform:translateY(-1px);
  filter:brightness(1.1) saturate(1.16);
  border-color:rgba(255,104,128,.74);
  box-shadow:
    0 0 30px rgba(255,49,88,.32),
    0 12px 26px rgba(0,0,0,.35),
    inset 0 0 0 1px rgba(255,255,255,.08);
}
.profileDeleteLauncher:hover::after{ transform:translateX(520%) rotate(18deg); }
.profileDeleteLauncher:active{ transform:translateY(0) scale(.985); }
.profileDeleteLauncher:disabled{ opacity:.55; cursor:not-allowed; transform:none; filter:none; }
.profileDeleteLauncher span{
  font-size:12px;
  font-weight:900;
  letter-spacing:.04em;
  text-transform:uppercase;
  text-shadow:0 0 12px rgba(255,49,88,.42);
  white-space:nowrap;
}
.profileDeleteTrashSvg{
  width:28px;
  height:28px;
  flex:0 0 auto;
}
.profileDeleteShade{
  position:absolute;
  inset:0;
  z-index:20;
  display:grid;
  place-items:center;
  padding:14px;
  border-radius:inherit;
  background:
    radial-gradient(120% 120% at 50% 0%, rgba(255,49,88,.18), rgba(2,5,11,.68) 58%),
    rgba(0,0,0,.36);
  backdrop-filter:blur(10px) saturate(132%);
}
.profileDeleteConfirm{
  width:min(420px, 100%);
  border-radius:18px;
  padding:16px;
  border:1px solid rgba(255,80,110,.38);
  background:
    radial-gradient(120% 130% at 18% 0%, rgba(255,80,110,.18), transparent 54%),
    radial-gradient(110% 120% at 88% 8%, rgba(255,190,92,.11), transparent 54%),
    linear-gradient(145deg, rgba(10,14,22,.98), rgba(32,5,14,.98));
  box-shadow:
    0 22px 62px rgba(0,0,0,.66),
    0 0 42px rgba(255,49,88,.24),
    inset 0 0 0 1px rgba(255,255,255,.055);
  color:#fff3f5;
  position:relative;
  overflow:hidden;
}
.profileDeleteConfirm::before{
  content:"";
  position:absolute;
  inset:1px;
  border-radius:17px;
  pointer-events:none;
  background:linear-gradient(120deg, rgba(255,255,255,.07), transparent 32%, rgba(255,49,88,.1));
}
.profileDeleteConfirm > *{ position:relative; z-index:1; }
.profileDeleteConfirmTitleRow{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  text-align:center;
}
.profileDeleteConfirmTitle{
  font-size:16px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#ffe7ec;
  text-shadow:0 0 18px rgba(255,74,102,.45);
}
.profileDeleteWarnSvg{
  width:28px;
  height:28px;
  color:#ff4d6d;
  filter:drop-shadow(0 0 12px rgba(255,49,88,.45));
  flex:0 0 auto;
}
.profileDeleteRail{
  height:1px;
  margin:13px 2px 12px;
  border-radius:999px;
  background:linear-gradient(90deg, transparent, rgba(255,80,110,.78), rgba(255,205,122,.5), rgba(255,80,110,.78), transparent);
  box-shadow:0 0 18px rgba(255,49,88,.35);
}
.profileDeleteWarningText{
  margin:0;
  color:rgba(255,238,242,.88);
  font-size:13px;
  line-height:1.55;
  text-align:center;
  text-wrap:balance;
}
.profileDeleteError{
  margin-top:10px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid rgba(255,80,110,.36);
  background:rgba(80,0,18,.36);
  color:#ffd6dd;
  font-size:12px;
  text-align:center;
}
.profileDeleteConfirmActions{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:14px;
  margin-top:16px;
}
.profileDeleteApprove,
.profileDeleteReject{
  width:48px;
  height:42px;
  border-radius:15px;
  display:grid;
  place-items:center;
  border:1px solid rgba(255,255,255,.14);
  background:rgba(10,16,28,.72);
  color:#eaf4ff;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.05), 0 10px 20px rgba(0,0,0,.32);
  transition:transform .12s ease, filter .14s ease, border-color .18s ease, box-shadow .18s ease;
}
.profileDeleteApprove{
  color:#fff2f4;
  border-color:rgba(255,74,102,.58);
  background:linear-gradient(135deg, rgba(255,49,88,.34), rgba(100,0,24,.86));
  box-shadow:0 0 26px rgba(255,49,88,.28), inset 0 0 0 1px rgba(255,255,255,.08);
}
.profileDeleteReject{
  color:#eaf4ff;
  border-color:rgba(140,190,255,.28);
  background:linear-gradient(135deg, rgba(12,20,34,.92), rgba(36,52,76,.58));
}
.profileDeleteApprove svg,
.profileDeleteReject svg{ width:25px; height:25px; }
.profileDeleteApprove:hover,
.profileDeleteReject:hover{ transform:translateY(-1px); filter:brightness(1.12) saturate(1.08); }
.profileDeleteApprove:active,
.profileDeleteReject:active{ transform:translateY(0) scale(.98); }
.profileDeleteApprove:disabled,
.profileDeleteReject:disabled{ opacity:.65; cursor:not-allowed; transform:none; }
.profileDeleteSpin{ animation:profileDeleteSpin .85s linear infinite; }
@keyframes profileDeleteSpin{ to{ transform:rotate(360deg); } }
@media (max-width: 480px){
  .profileFooterBar{ align-items:stretch; }
  .profileDeleteLauncher{ width:44px; padding:0; flex:0 0 44px; }
  .profileDeleteLauncher span{ display:none; }
  .profileFooterActions{ margin-left:auto; }
  .profileDeleteConfirm{ padding:14px; }
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
    /* Keep Chromium's native video plane attached while cards pass under a stationary pointer. */
    .item[data-forum-native-video-card="1"],
    .item[data-forum-native-video-card="1"]:hover{
      transform:none;
      contain:layout;
      will-change:auto;
    }
    .mediaBox[data-kind="video"],
    .mediaBox[data-kind="video"] .ql7VideoSurface{
      contain:layout;
      isolation:auto;
    }
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

/* РЎРѓР С”РЎР‚Р С•Р В»Р В»Р С‘Р С Р ВР СљР вЂўР СњР СњР С› РЎвЂљР ВµР В»Р С• РЎРѓР ВµР С”РЎвЂ Р С‘Р С‘ */
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

    .emojiPanel{ margin-top:10px; background:rgba(10,14,20,.98); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:8px 10px 10px; max-height:300px; overflow:auto }
    .emojiPanelContent{ position:relative; min-width:0; }
    .emojiPanelMode, .emojiCategoryBlock, .emojiGrid{ contain:layout paint; }
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
  position:sticky;
  top:4px;
  z-index:8;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:0;
  width:max-content;
  max-width:calc(100% - 14px);
  margin:0 auto 12px;
  padding:4px;
  border-radius:999px;
  border:1px solid rgba(120,220,255,.34);
  background:
    linear-gradient(135deg, rgba(16,34,48,.74), rgba(7,13,22,.62)),
    radial-gradient(circle at 22% 0%, rgba(90,230,255,.2), transparent 48%);
  box-shadow:0 10px 28px rgba(0,0,0,.36), inset 0 0 16px rgba(120,220,255,.1);
  backdrop-filter:blur(14px) saturate(1.18);
  -webkit-backdrop-filter:blur(14px) saturate(1.18);
  overflow:hidden;
}
.emojiTabs::before{
  content:'';
  position:absolute;
  top:7px;
  bottom:7px;
  left:50%;
  width:1px;
  transform:translateX(-.5px);
  background:linear-gradient(180deg, transparent, rgba(120,240,255,.74), rgba(255,214,96,.5), transparent);
  box-shadow:0 0 10px rgba(120,240,255,.46);
  pointer-events:none;
}

.emojiTabBtn{
  --btn-h: 28px;
  min-width:96px;
  height: var(--btn-h);
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: #eaf4ff;
  font-size: .88rem;
  font-weight:900;
  line-height: calc(var(--btn-h) - 2px);
  cursor: pointer;
  user-select: none;
  transition: background .12s ease, border-color .12s ease, transform .06s ease, box-shadow .12s ease, color .12s ease;
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
  color:#ffffff;
  background:
    linear-gradient(135deg, rgba(60,225,255,.3), rgba(255,214,96,.16)),
    linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.02));
  border-color: rgba(120,235,255,.46);
  box-shadow: 0 0 0 1px rgba(80,220,255,.26) inset, 0 0 18px rgba(80,220,255,.2);
}


/* РјРѕР±РёР»СЊРЅС‹Р№ РєРѕРјРїР°РєС‚ */
@media (max-width: 420px){
  .emojiTabs{
    max-width:100%;
    padding:3px;
  }
  .emojiTabBtn{
    --btn-h: 26px;
    min-width:82px;
    padding: 0 10px;
    font-size: .84rem;
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
  flex-wrap: nowrap;            /* РІвЂ С’ Р С™Р СњР С›Р СџР С™Р В Р СњР вЂў Р СџР вЂўР В Р вЂўР СњР С›Р РЋР Р‡Р СћР РЋР Р‡ */
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
.searchResultTitle--post{
  justify-content:space-between;
  gap:10px;
}
.searchResultAuthor{
  min-width:0;
  display:inline-flex;
  align-items:center;
  gap:8px;
  flex:1 1 auto;
}
.searchResultAuthorAva{
  width:20px;
  height:20px;
  border-radius:999px;
  border:1px solid rgba(130,200,255,.5);
  box-shadow:0 0 10px rgba(96,170,255,.22);
  overflow:hidden;
  flex:0 0 auto;
}
.searchResultAuthorAva > .avaWrap{
  width:100%;
  height:100%;
  display:block;
}
.searchResultAuthorNick{
  font-size:.82rem;
  font-weight:800;
  color:#dff2ff;
  text-shadow:0 0 10px rgba(80,170,255,.2);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.searchResultDate{
  font-size:.72rem;
  color:rgba(220,236,255,.62);
  flex:0 0 auto;
}
.searchResultTopic{
  font-size:.78rem;
  font-weight:700;
  color:rgba(220,238,255,.72);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  max-width:100%;
}
.sortDrop{
  position:absolute;
  top:68px;
  right:100px;
  width:132px;
  display:flex;
  flex-direction:column;
  align-items:stretch;
  gap:0;
  border:1px solid rgba(120,180,255,.20);
  background:
    radial-gradient(120% 130% at 50% 0%, rgba(80,167,255,.13), rgba(10,14,20,.98) 48%),
    rgba(10,14,20,.98);
  border-radius:16px;
  padding:7px 8px;
  z-index:3000;
  box-shadow:
    0 16px 34px rgba(0,0,0,.48),
    0 0 24px rgba(80,167,255,.14),
    inset 0 0 0 1px rgba(255,255,255,.04);
  backdrop-filter:blur(12px) saturate(145%);
}
.sortDropItem{
  position:relative;
  width:100%;
  min-height:38px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px 10px;
  border:1px solid transparent;
  border-radius:12px;
  background:transparent;
  color:rgba(234,244,255,.90);
  font-size:.82rem;
  font-weight:850;
  line-height:1.1;
  text-align:center;
  cursor:pointer;
  overflow:hidden;
  isolation:isolate;
  transition:background .16s ease, border-color .16s ease, box-shadow .16s ease, color .16s ease, transform .12s ease;
}
.sortDropItem + .sortDropItem::before{
  content:"";
  position:absolute;
  top:-1px;
  left:12px;
  right:12px;
  height:1px;
  background:linear-gradient(90deg, rgba(80,167,255,0), rgba(120,205,255,.62), rgba(255,215,90,.42), rgba(120,205,255,.62), rgba(80,167,255,0));
  box-shadow:0 0 10px rgba(120,205,255,.34);
  opacity:.82;
}
.sortDropItemRail{
  position:absolute;
  inset:6px 6px;
  border-left:1px solid rgba(120,205,255,.28);
  border-right:1px solid rgba(255,215,90,.20);
  border-radius:10px;
  opacity:.32;
  pointer-events:none;
  z-index:-1;
}
.sortDropItemText{ position:relative; z-index:1; }
.sortDropItem:hover,
.sortDropItem:focus-visible{
  color:#fff4bf;
  background:linear-gradient(180deg, rgba(80,167,255,.12), rgba(255,215,90,.07));
  border-color:rgba(140,210,255,.35);
  box-shadow:inset 0 0 14px rgba(120,205,255,.08), 0 0 16px rgba(80,167,255,.12);
}
.sortDropItem:active{ transform:scale(.985); }
.sortDropItem--active{
  color:#ffe66d;
  background:
    radial-gradient(100% 180% at 50% 0%, rgba(255,230,109,.22), rgba(255,230,109,0) 58%),
    linear-gradient(180deg, rgba(255,215,90,.15), rgba(80,167,255,.10));
  border-color:rgba(255,215,90,.58);
  box-shadow:
    0 0 18px rgba(255,215,90,.20),
    inset 0 0 16px rgba(255,215,90,.11),
    inset 0 0 0 1px rgba(255,255,255,.06);
  text-shadow:0 0 10px rgba(255,215,90,.48);
}
.sortDropItem--active .sortDropItemRail{
  opacity:1;
  border-left-color:rgba(255,235,145,.72);
  border-right-color:rgba(255,235,145,.72);
  box-shadow:
    inset 8px 0 14px -12px rgba(255,235,145,.88),
    inset -8px 0 14px -12px rgba(255,235,145,.88);
}

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

.subsCounterShell{
  display:inline-flex;
  flex-direction:column;
  align-items:stretch;
  width:136px;
  max-width:100%;
  gap:2px;
}
.quantumFamilyBadgeTitleSvg{
  display:block;
  width:100%;
  height:auto;
  overflow:visible;
}
.quantumFamilyBadgeTitleSvg text{
  font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size:26px;
  font-weight:900;
  letter-spacing:0;
}
.quantumFamilyBadgeTitleSweep{
  stroke-dasharray:64 180;
  filter:drop-shadow(0 0 8px rgba(125,252,255,.62));
  animation:quantumFamilyBadgeTitleSweep 4s ease-in-out infinite;
}
@keyframes quantumFamilyBadgeTitleSweep{
  0%{ stroke-dashoffset:190; opacity:.28; }
  45%{ opacity:1; }
  100%{ stroke-dashoffset:-120; opacity:.34; }
}
.subsCounter{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:100%;
  min-height:38px;
  padding:0;
  margin-left:0px;
  border-radius:999px;
  border:1px solid rgba(255,215,90,.22);
  background:rgba(10,16,28,.25);
  white-space:nowrap;
  overflow:hidden;
}
.quantumFamilyCounterPill{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0, 1fr) auto minmax(0, 1fr);
  align-items:center;
  width:100%;
  min-height:38px;
  padding:0 14px;
  gap:9px;
  border-radius:inherit;
  overflow:hidden;
}
.subsCounter.authed{
  cursor:pointer;
  border-color:rgba(255,215,90,.34);
  box-shadow:0 0 14px rgba(255,215,90,.10), inset 0 0 0 1px rgba(255,255,255,.04);
  transition:transform .14s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.subsCounter.authed:hover,
.subsCounter.authed:focus-visible{
  transform:translateY(-1px);
  border-color:rgba(255,220,112,.68);
  background:linear-gradient(135deg, rgba(255,215,90,.14), rgba(91,65,174,.18));
  box-shadow:0 0 24px rgba(255,215,90,.22), 0 0 18px rgba(125,252,255,.12), inset 0 0 0 1px rgba(255,255,255,.07);
}
.subsCounter.authed:focus-visible{
  outline:2px solid rgba(255,220,112,.72);
  outline-offset:3px;
}
.quantumFamilyCounterPill .subsRing{
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
.subsCounter .subsValue{
  font-variant-numeric:tabular-nums;
  font-size:12px;
  font-weight:800;
  position:relative;
  z-index:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
}
.subsCounter .subsValue--followers{ text-align:right; color:#eaf4ff; }
.subsCounter .subsValue--following{ text-align:left; color:#dff8ff; }

@media (max-width:520px){
  .subsCounterShell{ margin-top:8px; }
  .subsCounter{ margin-left:0; }
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

    .userInfoStat--stars{
      border:1px solid rgba(140,170,255,.22);
      background:rgba(10,16,28,.35);
      color:inherit;
      font:inherit;
      appearance:none;
      -webkit-appearance:none;
      cursor:pointer;
      align-items:stretch;
    }
    .userInfoStat--stars:hover{
      border-color:rgba(255,220,112,.46);
      box-shadow:0 0 18px rgba(255,215,90,.14), inset 0 0 0 1px rgba(255,255,255,.05);
    }
    .userInfoStat--stars .userInfoStatLabel{
      width:100%;
    }
    .userInfoQuantumTitleSvg{
      width:100%;
      height:auto;
      margin:-3px 0 -4px;
      overflow:visible;
    }
    .userInfoQuantumTitleSvg text{
      font-size:26px;
      font-weight:900;
      letter-spacing:0;
    }
    .userInfoQuantumPill{
      flex:1 1 auto;
      min-height:30px;
      padding:0 10px;
      gap:7px;
      border-radius:999px;
      border:1px solid rgba(255,215,90,.25);
      background:linear-gradient(135deg, rgba(20,35,62,.68), rgba(84,48,132,.24));
      box-shadow:0 0 16px rgba(255,215,90,.12), inset 0 0 0 1px rgba(255,255,255,.04);
    }
    .userInfoQuantumPill .subsValue{
      font-size:11px;
      font-weight:900;
      font-variant-numeric:tabular-nums;
      position:relative;
      z-index:1;
    }
    .userInfoQuantumPill .subsValue--followers{ text-align:right; }
    .userInfoQuantumPill .subsValue--following{ text-align:left; }
    .userInfoQuantumPill .subsStar{
      position:relative;
      z-index:1;
      color:rgba(255,215,90,.98);
      font-size:14px;
      line-height:1;
    }
    .userInfoStat--stars .userInfoStarBadge,
    .userInfoStat--stars .userInfoStatValue{
      display:none;
    }
    .userInfoStat--stars .userInfoStatArrow{
      flex:0 0 auto;
    }
    .userInfoStat--stars:focus-visible{
      outline:2px solid rgba(125,252,255,.72);
      outline-offset:3px;
      box-shadow:0 0 0 4px rgba(80,167,255,.16), 0 0 18px rgba(125,252,255,.22);
    }

    .subsFamilyOverlay{
      position:fixed;
      inset:0;
      z-index:2147482600;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:16px;
      overflow:hidden;
      color:#eaf4ff;
      background:
        radial-gradient(circle at 18% 12%, rgba(40,220,255,.20), transparent 34%),
        radial-gradient(circle at 82% 18%, rgba(255,218,110,.12), transparent 32%),
        radial-gradient(circle at 50% 88%, rgba(150,92,255,.16), transparent 38%),
        rgba(1,5,14,.72);
      backdrop-filter: blur(12px) saturate(130%);
    }
    .subsFamilyModal{
      position:relative;
      width:500px;
      max-width:92vw;
      flex:0 1 500px;
      min-height:420px;
      max-height:min(82dvh, 760px);
      display:flex;
      flex-direction:column;
      min-width:0;
      padding:14px;
      box-sizing:border-box;
      overflow:hidden;
      border-radius:20px;
      border:1px solid rgba(125,218,255,.36);
      background:
        radial-gradient(120% 90% at 12% 0%, rgba(69,218,255,.22), transparent 44%),
        radial-gradient(120% 90% at 92% 10%, rgba(255,221,125,.16), transparent 40%),
        linear-gradient(145deg, rgba(5,10,22,.96), rgba(13,24,42,.94) 48%, rgba(9,15,28,.98));
      box-shadow:
        0 24px 70px rgba(0,0,0,.66),
        0 0 46px rgba(80,167,255,.24),
        0 0 22px rgba(255,210,90,.10),
        inset 0 0 0 1px rgba(255,255,255,.06);
    }
    .subsFamilyModal::before{
      content:"";
      position:absolute;
      inset:1px;
      border-radius:19px;
      pointer-events:none;
      background:linear-gradient(120deg, rgba(255,255,255,.08), transparent 30%, rgba(125,252,255,.08) 70%, transparent);
      opacity:.7;
    }
    .subsFamilyHeader{
      position:relative;
      z-index:1;
      display:flex;
      align-items:center;
      gap:10px;
      min-width:0;
      padding:2px 46px 2px 2px;
    }
    .subsFamilyTitleSvg{
      display:block;
      width:min(360px, 100%);
      height:auto;
      min-width:0;
      overflow:visible;
    }
    .subsFamilyTitleSvg text{
      font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size:42px;
      font-weight:900;
      letter-spacing:0;
    }
    .subsFamilyTitleSweep{
      stroke-dasharray:80 220;
      animation:subsFamilyTitleSweep 4.5s ease-in-out infinite;
      filter:drop-shadow(0 0 10px rgba(125,252,255,.65));
    }
    @keyframes subsFamilyTitleSweep{
      0%{ stroke-dashoffset:240; opacity:.3; }
      45%{ opacity:1; }
      100%{ stroke-dashoffset:-160; opacity:.35; }
    }
    .subsFamilyClose{
      position:absolute;
      right:0;
      top:0;
      width:40px;
      height:40px;
      border-radius:14px;
      border:1px solid rgba(140,200,255,.34);
      background:linear-gradient(145deg, rgba(12,22,38,.78), rgba(45,83,144,.24));
      color:#eaf4ff;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 0 18px rgba(80,167,255,.16), inset 0 0 0 1px rgba(255,255,255,.05);
      transition:transform .14s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
    }
    .subsFamilyClose svg{
      width:21px;
      height:21px;
    }
    .subsFamilyClose path,
    .subsFamilySearch svg :is(path, circle),
    .subsFamilySearchClear path{
      fill:none;
      stroke:currentColor;
      stroke-width:1.9;
      stroke-linecap:round;
      stroke-linejoin:round;
    }
    .subsFamilyClose:hover{
      transform:translateY(-1px);
      border-color:rgba(125,252,255,.62);
      background:linear-gradient(145deg, rgba(20,40,68,.86), rgba(86,134,220,.3));
      box-shadow:0 0 24px rgba(125,252,255,.25), inset 0 0 0 1px rgba(255,255,255,.08);
    }
    .subsFamilyClose:focus-visible,
    .subsFamilyTab:focus-visible,
    .subsFamilySearchInput:focus-visible,
    .subsFamilySearchClear:focus-visible,
    .subsFamilyRow:focus-visible,
    .subsFamilyLoadMore:focus-visible,
    .subsFamilyError button:focus-visible{
      outline:2px solid rgba(125,252,255,.78);
      outline-offset:3px;
    }
    .subsFamilyRail{
      position:relative;
      z-index:1;
      height:2px;
      width:100%;
      margin:8px 0 12px;
      border-radius:999px;
      background:linear-gradient(90deg, rgba(125,252,255,0), rgba(125,252,255,.78), rgba(255,220,112,.68), rgba(150,92,255,.62), rgba(125,252,255,0));
      box-shadow:0 0 18px rgba(125,252,255,.22);
      overflow:hidden;
    }
    .subsFamilyRail::after{
      content:"";
      position:absolute;
      inset:0;
      width:36%;
      background:linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent);
      animation:subsFamilyRailPulse 3.8s ease-in-out infinite;
    }
    @keyframes subsFamilyRailPulse{
      0%{ transform:translateX(-120%); opacity:.2; }
      45%{ opacity:.95; }
      100%{ transform:translateX(320%); opacity:.25; }
    }
    .subsFamilyTabs{
      position:relative;
      z-index:1;
      display:grid;
      grid-template-columns:repeat(2, minmax(0, 1fr));
      gap:8px;
      margin-bottom:10px;
    }
    .subsFamilyTab{
      position:relative;
      min-width:0;
      min-height:44px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      padding:9px 10px;
      border-radius:14px;
      border:1px solid rgba(140,190,255,.22);
      background:rgba(8,15,28,.42);
      color:rgba(228,240,255,.72);
      font-weight:800;
      font-size:13px;
      line-height:1.1;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      transition:transform .14s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease, background .18s ease;
    }
    .subsFamilyTab::after{
      content:"";
      position:absolute;
      left:12px;
      right:12px;
      bottom:5px;
      height:2px;
      border-radius:999px;
      background:linear-gradient(90deg, transparent, rgba(125,252,255,.0), transparent);
      opacity:0;
    }
    .subsFamilyTab:hover{
      color:#f2f8ff;
      border-color:rgba(140,200,255,.42);
      background:rgba(16,28,48,.58);
    }
    .subsFamilyTab--active{
      color:#ffffff;
      border-color:rgba(125,252,255,.64);
      background:
        linear-gradient(135deg, rgba(19,44,74,.88), rgba(72,55,128,.38)),
        radial-gradient(circle at 18% 0%, rgba(125,252,255,.26), transparent 45%);
      box-shadow:0 0 24px rgba(80,167,255,.24), inset 0 0 0 1px rgba(255,255,255,.07);
      text-shadow:0 0 12px rgba(125,252,255,.36);
    }
    .subsFamilyTab--active::after{
      opacity:1;
      background:linear-gradient(90deg, rgba(125,252,255,0), rgba(125,252,255,.95), rgba(255,220,112,.82), rgba(125,252,255,0));
      box-shadow:0 0 10px rgba(125,252,255,.5);
    }
    .subsFamilyTabCount{
      flex:0 0 auto;
      min-width:34px;
      padding:3px 7px;
      border-radius:999px;
      border:1px solid rgba(255,220,112,.28);
      background:rgba(255,220,112,.09);
      color:#ffeaa8;
      font-size:12px;
      font-variant-numeric:tabular-nums;
    }
    .subsFamilySearch{
      position:relative;
      z-index:1;
      display:flex;
      align-items:center;
      gap:8px;
      min-height:46px;
      padding:0 10px;
      border-radius:15px;
      border:1px solid rgba(140,190,255,.24);
      background:linear-gradient(135deg, rgba(8,16,30,.74), rgba(18,34,56,.58));
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.04), 0 0 18px rgba(80,167,255,.10);
      margin-bottom:8px;
    }
    .subsFamilySearch > svg{
      flex:0 0 auto;
      width:20px;
      height:20px;
      color:rgba(178,220,255,.82);
    }
    .subsFamilySearch:focus-within{
      border-color:rgba(125,252,255,.62);
      box-shadow:0 0 24px rgba(80,167,255,.18), inset 0 0 0 1px rgba(255,255,255,.06);
    }
    .subsFamilySearchInput{
      flex:1 1 auto;
      min-width:0;
      height:42px;
      border:0;
      outline:0;
      background:transparent;
      color:#eef8ff;
      font:inherit;
      font-size:14px;
      letter-spacing:0;
    }
    .subsFamilySearchInput::placeholder{
      color:rgba(210,226,255,.48);
    }
    .subsFamilySearchClear{
      flex:0 0 auto;
      width:34px;
      height:34px;
      border-radius:12px;
      border:1px solid rgba(140,190,255,.22);
      background:rgba(8,16,30,.5);
      color:rgba(234,244,255,.86);
      display:inline-flex;
      align-items:center;
      justify-content:center;
    }
    .subsFamilySearchClear svg{
      width:18px;
      height:18px;
    }
    .subsFamilyMeta{
      position:relative;
      z-index:1;
      display:grid;
      grid-template-columns:auto auto minmax(0, 1fr);
      align-items:center;
      gap:8px;
      margin:0 2px 8px;
      color:rgba(218,232,255,.74);
      font-size:12px;
      line-height:1.25;
    }
    .subsFamilyMeta span:first-child{
      color:#f2f8ff;
      font-weight:800;
    }
    .subsFamilyMeta span:nth-child(2){
      min-width:36px;
      text-align:center;
      padding:3px 8px;
      border-radius:999px;
      color:#ffe9a2;
      border:1px solid rgba(255,220,112,.24);
      background:rgba(255,220,112,.08);
      font-variant-numeric:tabular-nums;
    }
    .subsFamilyMeta span:last-child{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .subsFamilyBody{
      position:relative;
      z-index:1;
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overscroll-behavior:contain;
      padding:6px 4px 2px;
      scrollbar-width:thin;
      scrollbar-color:rgba(125,252,255,.38) rgba(255,255,255,.06);
    }
    .subsFamilyList{
      display:flex;
      flex-direction:column;
      gap:9px;
    }
    .subsFamilyRow{
      position:relative;
      width:100%;
      min-height:66px;
      display:grid;
      grid-template-columns:48px minmax(0, 1fr);
      align-items:center;
      gap:12px;
      padding:9px 10px;
      text-align:left;
      border-radius:15px;
      border:1px solid rgba(140,190,255,.20);
      background:
        radial-gradient(110% 130% at 10% 0%, rgba(125,252,255,.13), transparent 42%),
        linear-gradient(135deg, rgba(7,14,26,.72), rgba(18,31,52,.54));
      color:#eaf4ff;
      font:inherit;
      appearance:none;
      -webkit-appearance:none;
      overflow:hidden;
      transition:transform .14s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
    }
    .subsFamilyRow:hover{
      transform:translateY(-1px);
      border-color:rgba(125,252,255,.48);
      box-shadow:0 0 22px rgba(80,167,255,.18), inset 0 0 0 1px rgba(255,255,255,.04);
      background:
        radial-gradient(110% 130% at 10% 0%, rgba(125,252,255,.22), transparent 46%),
        linear-gradient(135deg, rgba(11,22,40,.82), rgba(28,46,76,.62));
    }
    .subsFamilyRow:active{
      transform:translateY(0) scale(.995);
    }
    .subsFamilyRowRail{
      position:absolute;
      left:10px;
      right:10px;
      bottom:0;
      height:1px;
      border-radius:999px;
      background:linear-gradient(90deg, rgba(125,252,255,0), rgba(125,252,255,.55), rgba(255,220,112,.45), rgba(125,252,255,0));
      opacity:.72;
    }
    .subsFamilyAvatar{
      width:48px;
      height:48px;
      border-radius:14px;
      padding:0;
      font-size:22px;
      box-shadow:0 0 18px rgba(80,167,255,.22);
    }
    .subsFamilyRowMain{
      min-width:0;
      display:flex;
      align-items:center;
    }
    .subsFamilyNickWrap{
      min-width:0;
      display:inline-flex;
      align-items:center;
      gap:8px;
      max-width:100%;
    }
    .subsFamilyRow .nick-badge{
      max-width:100%;
      min-width:0;
      font-size:.95rem;
      padding:.32rem .55rem;
      border-radius:12px;
    }
    .subsFamilyRow .nick-text{
      max-width:24ch;
    }
    .subsFamilyVip{
      flex:0 0 auto;
      --vip-badge-w:34px;
      --vip-badge-h:34px;
    }
    .subsFamilySkeleton,
    .subsFamilyEmpty,
    .subsFamilyError,
    .subsFamilyMinChars{
      min-height:150px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:12px;
      text-align:center;
      color:rgba(228,240,255,.72);
      font-size:14px;
      padding:18px;
    }
    .subsFamilySkeleton i{
      width:min(320px, 82%);
      height:12px;
      border-radius:999px;
      background:linear-gradient(90deg, rgba(125,252,255,.06), rgba(125,252,255,.24), rgba(255,220,112,.10), rgba(125,252,255,.06));
      background-size:240% 100%;
      animation:subsFamilySkeleton 1.5s linear infinite;
    }
    .subsFamilySkeleton i:nth-child(3){ width:min(260px, 72%); }
    .subsFamilySkeleton i:nth-child(4){ width:min(210px, 64%); }
    @keyframes subsFamilySkeleton{
      to{ background-position:-240% 0; }
    }
    .subsFamilyError button,
    .subsFamilyLoadMore{
      min-height:42px;
      border-radius:14px;
      border:1px solid rgba(125,252,255,.38);
      background:linear-gradient(135deg, rgba(12,24,42,.82), rgba(50,92,160,.28));
      color:#eef8ff;
      font-weight:800;
      padding:9px 14px;
      box-shadow:0 0 18px rgba(80,167,255,.16), inset 0 0 0 1px rgba(255,255,255,.05);
    }
    .subsFamilyLoadMore{
      width:100%;
      margin-top:10px;
    }
    .subsFamilyLoadMore:disabled{
      opacity:.62;
      cursor:default;
    }
    [dir="rtl"] .subsFamilyModal,
    .subsFamilyModal:dir(rtl){
      direction:rtl;
    }
    [dir="rtl"] .subsFamilyHeader{
      padding:2px 2px 2px 46px;
    }
    [dir="rtl"] .subsFamilyClose{
      right:auto;
      left:0;
    }
    [dir="rtl"] .subsFamilyRow{
      text-align:right;
    }
    @media (max-width:640px){
      .subsFamilyOverlay{
        align-items:flex-start;
        padding:
          max(120px, calc(env(safe-area-inset-top) + 12px))
          8px
          max(12px, calc(env(safe-area-inset-bottom) + 12px));
        overflow-y:auto;
      }
      .subsFamilyModal{
        width:500px;
        max-width:96vw;
        min-height:min(390px, calc(100dvh - 96px));
        max-height:calc(90dvh - 96px);
        padding:12px 10px;
        border-radius:18px;
      }
      .subsFamilyModal::before{
        border-radius:17px;
      }
      .subsFamilyTitleSvg text{
        font-size:36px;
      }
      .subsFamilyTabs{
        gap:6px;
      }
      .subsFamilyTab{
        min-height:42px;
        padding:8px 7px;
        gap:5px;
        font-size:12px;
      }
      .subsFamilyTabCount{
        min-width:30px;
        padding:3px 6px;
      }
      .subsFamilyMeta{
        grid-template-columns:auto auto;
      }
      .subsFamilyMeta span:last-child{
        grid-column:1 / -1;
      }
      .subsFamilyRow{
        grid-template-columns:44px minmax(0, 1fr);
        min-height:62px;
        gap:10px;
        padding:8px;
      }
      .subsFamilyAvatar{
        width:44px;
        height:44px;
      }
      .subsFamilyRow .nick-text{
        max-width:16ch;
      }
    }
    @media (max-width:390px){
      .subsFamilyTab{
        flex-direction:column;
        gap:4px;
      }
      .subsFamilyTitleSvg text{
        font-size:31px;
      }
    }
    @media (prefers-reduced-motion: reduce){
      .subsFamilyTitleSweep,
      .subsFamilyRail::after,
      .subsFamilySkeleton i,
      .subsFamilyRow,
      .subsFamilyTab,
      .subsFamilyClose{
        animation:none !important;
        transition:none !important;
      }
      .subsFamilyRow:hover{
        transform:none;
      }
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
    .profileOverlay{
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
    .profilePop{
      position:relative;
      width:min(500px, 92vw);
      max-height:min(82vh, 760px);
      overflow:auto;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
      border:1px solid rgba(255,255,255,.14);
      background:
        radial-gradient(120% 140% at 12% 0%, rgba(120,200,255,.14), rgba(10,14,20,.96) 54%),
        linear-gradient(140deg, rgba(10,14,20,.97), rgba(12,20,32,.98));
      border-radius:16px;
      padding:12px;
      z-index:3200;
      box-shadow:
        0 18px 54px rgba(0,0,0,.58),
        0 0 34px rgba(80,167,255,.16),
        inset 0 0 0 1px rgba(255,255,255,.04);
      backdrop-filter: blur(16px) saturate(135%);
    }
    @media (max-width: 640px){
      .profileOverlay{
        align-items:center;
        padding:12px;
      }
      .profilePop{
        width:min(500px, 96vw);
        max-height:min(84vh, 760px);
        padding:10px;
      }
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
    .userInfoPopover--onlinePulse{
      border-color:rgba(60,255,190,.68);
      box-shadow:
        0 16px 40px rgba(0,0,0,.55),
        0 0 30px rgba(60,255,190,.24),
        inset 0 0 16px rgba(60,255,190,.08);
      animation:userInfoPresencePulse 1.65s ease-in-out infinite;
    }
    @keyframes userInfoPresencePulse{
      0%{
        border-color:rgba(60,255,190,.42);
        box-shadow:0 16px 40px rgba(0,0,0,.55), 0 0 16px rgba(60,255,190,.14), inset 0 0 10px rgba(60,255,190,.06);
      }
      55%{
        border-color:rgba(60,255,190,.96);
        box-shadow:0 16px 40px rgba(0,0,0,.55), 0 0 0 5px rgba(60,255,190,0), 0 0 34px rgba(60,255,190,.38), inset 0 0 18px rgba(60,255,190,.14);
      }
      100%{
        border-color:rgba(60,255,190,.42);
        box-shadow:0 16px 40px rgba(60,255,190,.14), 0 16px 40px rgba(0,0,0,.55), inset 0 0 10px rgba(60,255,190,.06);
      }
    }
    @media (prefers-reduced-motion: reduce){
      .userInfoPopover--onlinePulse{ animation:none; }
    }
    .userInfoBioRow{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:8px;
    }
    .userInfoActionGroup{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      flex:0 0 auto;
    }
    .userInfoCircleActionBtn{
      width:46px;
      height:46px;
      min-width:46px;
      min-height:46px;
      border-radius:999px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      position:relative;
      overflow:visible;
      color:#eaf4ff;
      transition: transform .12s ease, filter .14s ease, box-shadow .18s ease;
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
    .userInfoGiftBtn{
      border:1px solid rgba(250,204,21,.48);
      background:
        radial-gradient(circle at 50% 38%, rgba(250,204,21,.2), transparent 62%),
        linear-gradient(135deg, rgba(8,18,32,.88), rgba(88,28,135,.34), rgba(20,184,166,.16));
      box-shadow:0 0 24px rgba(250,204,21,.26), 0 0 18px rgba(34,211,238,.18), inset 0 0 12px rgba(255,255,255,.08);
      animation: giftPulse 2.8s ease-in-out infinite;
    }
    .userInfoGiftBtn::before{
      content:'';
      position:absolute;
      inset:-7px;
      border-radius:inherit;
      background:radial-gradient(circle, rgba(250,204,21,.28), rgba(34,211,238,.12) 38%, transparent 68%);
      pointer-events:none;
      animation: giftAura 2.8s ease-in-out infinite;
    }
    .userInfoGiftBtn svg{
      width:24px;
      height:24px;
      color:#fff7c2;
      filter:drop-shadow(0 0 6px rgba(250,204,21,.34));
    }
    .userInfoGiftBox,
    .userInfoGiftLid,
    .userInfoGiftBow{
      stroke:currentColor;
    }
    .userInfoGiftRibbon{
      stroke-dasharray:10 8;
      animation: giftRibbonSweep 2.6s ease-in-out infinite;
    }
    .userInfoGiftSpark{
      fill:#fef3c7;
      opacity:.78;
      animation: giftSpark 2.4s ease-in-out infinite;
    }
    .userInfoGiftSparkB{ animation-delay:.42s; }
    @keyframes giftPulse{
      0%,100%{ transform:scale(1); }
      50%{ transform:scale(1.035); }
    }
    @keyframes giftRibbonSweep{
      0%,100%{ stroke-dashoffset:0; }
      50%{ stroke-dashoffset:-18; }
    }
    @keyframes giftSpark{
      0%,100%{ opacity:.38; transform:scale(.92); }
      48%{ opacity:1; transform:scale(1.08); }
    }
    @keyframes giftAura{
      0%,100%{ opacity:.42; transform:scale(.96); }
      50%{ opacity:.78; transform:scale(1.05); }
    }
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
    @media (max-width: 420px){
      .userInfoBioRow{
        gap:7px;
      }
      .userInfoActionGroup{
        gap:6px;
      }
      .userInfoCircleActionBtn,
      .userInfoDmBtn{
        width:42px;
        height:42px;
        min-width:42px;
        min-height:42px;
      }
      .userInfoCircleActionBtn svg,
      .userInfoDmBtn svg{
        width:22px;
        height:22px;
      }
      .userInfoTranslateToggle{
        padding-inline:9px;
        min-width:0;
      }
    }
    .srOnly{
      position:absolute !important;
      height:1px;
      width:1px;
      overflow:hidden;
      clip:rect(1px,1px,1px,1px);
      white-space:nowrap;
    }       
    .profileIdentityRow{
      display:grid;
      grid-template-columns:minmax(0, 1fr) minmax(0, 140px);
      gap:10px;
      align-items:start;
      margin-top:8px;
      margin-bottom:2px;
    }
    .profileIdentityField{
      position:relative;
      min-width:0;
    }
    .profileIdentityField.isLocked{
      opacity:.78;
    }
    .profileIdentityLabel{
      font-size:11px;
      letter-spacing:.06em;
      text-transform:uppercase;
      color:rgba(234,244,255,.66);
      margin-bottom:6px;
    }
    .profileGenderOptions{
      display:grid;
      grid-template-columns:repeat(2, minmax(0, 1fr));
      gap:8px;
    }
    .profileSelectChip,
    .profileSelectTrigger{
      min-height:40px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.12);
      background:
        linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02)),
        rgba(8,12,20,.78);
      color:#eaf4ff;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.04), 0 8px 20px rgba(0,0,0,.18);
      transition:border-color .18s ease, box-shadow .18s ease, transform .12s ease, opacity .18s ease;
    }
    .profileSelectChip{
      width:100%;
      padding:0 10px;
      font-size:13px;
      font-weight:800;
      display:flex;
      align-items:center;
      justify-content:center;
      text-align:center;
    }
    .profileSelectTrigger{
      width:100%;
      padding:0 12px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      font-size:13px;
      font-weight:800;
    }
    .profileSelectTrigger svg{
      width:15px;
      height:15px;
      opacity:.82;
      flex:0 0 auto;
    }
    .profileSelectChip.isSelected,
    .profileSelectTrigger.isSelected{
      border-color:rgba(255,215,90,.5);
      box-shadow:
        inset 0 0 0 1px rgba(255,215,90,.08),
        0 0 18px rgba(255,215,90,.16),
        0 8px 20px rgba(0,0,0,.22);
      color:#fff7d1;
    }
    .profileSelectChip.isLocked,
    .profileSelectTrigger.isLocked{
      cursor:not-allowed;
      opacity:.62;
      filter:saturate(.85);
    }
    .profileYearMenu{
      position:absolute;
      top:calc(100% + 8px);
      left:0;
      right:0;
      z-index:40;
      max-height:172px;
      overflow:auto;
      padding:6px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(6,10,18,.96);
      box-shadow:0 16px 36px rgba(0,0,0,.35);
      backdrop-filter:blur(10px);
    }
    .profileYearOption{
      width:100%;
      min-height:34px;
      border-radius:10px;
      border:1px solid transparent;
      background:transparent;
      color:#eaf4ff;
      font-size:13px;
      font-weight:700;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .profileYearOption.isSelected{
      border-color:rgba(255,215,90,.42);
      background:rgba(255,215,90,.12);
      color:#fff4bf;
    }
    @media (hover:hover){
      .profileSelectChip:hover:not(:disabled),
      .profileSelectTrigger:hover:not(:disabled),
      .profileYearOption:hover{
        border-color:rgba(120,190,255,.35);
        box-shadow:0 0 14px rgba(120,190,255,.14);
      }
    }
    .profileList{ max-height:228px; overflow:auto; padding:4px; border:1px solid rgba(255,255,255,.08); border-radius:10px; background:rgba(255,255,255,.03) }
    @media (max-width:640px){
      .profileIdentityRow{
        grid-template-columns:1fr;
      }
    }

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
    flex-wrap:nowrap;         /* РІвЂ С’ Р СњР вЂў Р СџР вЂўР В Р вЂўР СњР С›Р РЋР ВР СћР РЋР Р‡ Р вЂ™Р СњР Р€Р СћР В Р В */
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
  box-sizing:border-box;
  max-width:130px;
  min-width:0;
  width:fit-content;
  flex-shrink:1;
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
  display:block;
  min-width:0;
  max-width:100%;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:clip;
}
@media (max-width:640px){
  .nick-text{ max-width:100%; }
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


/* ====== Р С’Р СњР ВР СљР С’Р В¦Р ВР Р‡ Р СњР ВР С™Р С’ ====== */
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
  width:18px;
  height:18px;
  color:#ffd38b;
  background:linear-gradient(180deg, rgba(16,22,34,.95), rgba(8,12,20,.85));
  border:1px solid rgba(255, 220, 150, .22);
  border-radius:999px;
  padding:0;
  box-shadow:0 0 12px rgba(255, 210, 125, .14);
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.lockBadge svg{
  width:11px;
  height:11px;
}
/* post image carousel */
.postImagesCarousel{
  position:relative;
  display:grid;
  gap:10px;
}
.postImagesCarouselViewport{
  position:relative;
  overflow:hidden;
  isolation:isolate;
}
.postImagesCarouselViewport::before{
  content:'';
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(90deg, rgba(6,10,18,.5), transparent 14%, transparent 86%, rgba(6,10,18,.5)),
    linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0));
  z-index:2;
}
.postImagesCarouselTrack{
  will-change:transform;
}
.postImagesCarouselSlide{
  position:relative;
}
.postImagesCarouselSlide > img{
  display:block;
  width:100%;
  height:100%;
}
.postGalleryNav{
  position:absolute;
  top:0;
  bottom:0;
  width:20%;
  min-width:56px;
  padding:0;
  border:0;
  background:transparent;
  color:#f3f7ff;
  display:flex;
  align-items:center;
  z-index:3;
  cursor:pointer;
  transition:opacity .18s ease, transform .18s ease, filter .18s ease;
}
.postGalleryNav--prev{
  left:0;
  justify-content:flex-start;
  padding-left:10px;
}
.postGalleryNav--next{
  right:0;
  justify-content:flex-end;
  padding-right:10px;
}
.postGalleryNav:disabled{
  opacity:.45;
  cursor:default;
}
.postGalleryNavGlyph{
  width:36px;
  height:36px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background:linear-gradient(180deg, rgba(10,16,26,.84), rgba(18,28,44,.52));
  box-shadow:
    0 10px 24px rgba(0,0,0,.24),
    inset 0 0 0 1px rgba(255,255,255,.05),
    0 0 18px rgba(109,167,255,.16);
  display:inline-flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
}
.postGalleryNavGlyph svg{
  width:18px;
  height:18px;
}
.postGalleryNav:hover .postGalleryNavGlyph{
  filter:brightness(1.12);
  transform:scale(1.04);
}
.postGalleryNav:active .postGalleryNavGlyph{
  transform:scale(.97);
}
.postGalleryDots{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:12px;
}
.postGalleryDot{
  width:8px;
  height:8px;
  border:0;
  padding:0;
  border-radius:999px;
  background:rgba(255,255,255,.26);
  box-shadow:0 0 0 1px rgba(255,255,255,.08);
  transition:transform .18s ease, background-color .18s ease, box-shadow .18s ease;
}
.postGalleryDot.isActive{
  background:#f6d56a;
  box-shadow:0 0 0 1px rgba(255,225,150,.2), 0 0 12px rgba(246,213,106,.55);
  transform:scale(1.18);
}
@media (max-width:640px){
  .postGalleryNav{
    width:24%;
    min-width:48px;
  }
  .postGalleryNavGlyph{
    width:32px;
    height:32px;
  }
  .postGalleryDots{
    gap:7px;
  }
}

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


/* composer image carousel: local draft preview + send-time moderation/upload */
.forumComposer .composerImagePreviewRow{
  width:100% !important;
  max-width:none !important;
  align-self:stretch;
  margin:8px 0 0 !important;
}
.forumComposer .composerImageCarousel{
  position:relative;
  width:100%;
  height:min(var(--mb-video-h, 620px), 620px);
  min-height:min(var(--mb-video-h, 620px), 620px);
  max-height:min(var(--mb-video-h, 620px), 620px);
  overflow:hidden;
  isolation:isolate;
  border-radius:16px;
  border:1px solid rgba(119,197,255,.2);
  background:#000 !important;
  box-shadow:
    0 16px 36px rgba(0,0,0,.42),
    inset 0 0 0 1px rgba(255,255,255,.035);
  touch-action:pan-y;
}
.forumComposer .composerImageCarousel::after{
  content:'';
  position:absolute;
  inset:0;
  z-index:2;
  pointer-events:none;
  background:
    linear-gradient(90deg, rgba(0,0,0,.38), transparent 14%, transparent 86%, rgba(0,0,0,.38)),
    linear-gradient(180deg, rgba(255,255,255,.035), transparent 18%, transparent 80%, rgba(0,0,0,.24));
}
.forumComposer .composerImageCarouselTrack{
  display:flex;
  width:100%;
  height:100%;
  transition:transform 280ms cubic-bezier(.2,.78,.2,1);
  will-change:transform;
}
.forumComposer .composerImageCarouselSlide{
  position:relative;
  flex:0 0 100%;
  width:100%;
  height:100%;
  margin:0;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#000 !important;
}
.forumComposer .composerImageCarouselImage{
  object-fit:contain !important;
  background:#000 !important;
}
.forumComposer .composerImageControl,
.forumComposer .composerImageNav{
  appearance:none;
  -webkit-appearance:none;
  position:absolute;
  padding:0 !important;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
}
.forumComposer .attachPreviewRow .composerImageControl{
  z-index:10;
  width:42px;
  height:42px;
  top:12px;
  border-radius:13px;
  background:linear-gradient(145deg, rgba(7,15,28,.94), rgba(10,24,42,.82)) !important;
  border:1px solid rgba(255,255,255,.24) !important;
  box-shadow:0 10px 24px rgba(0,0,0,.38), 0 0 22px rgba(79,173,255,.18), inset 0 0 0 1px rgba(255,255,255,.05) !important;
  color:#eaf7ff;
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
  transition:transform 160ms ease, filter 160ms ease, border-color 160ms ease;
}
.forumComposer .attachPreviewRow .composerImageControl:hover{
  transform:translateY(-1px) scale(1.04);
  filter:brightness(1.12);
  border-color:rgba(118,211,255,.52) !important;
}
.forumComposer .attachPreviewRow .composerImageControl:active{
  transform:scale(.96);
}
.forumComposer .composerImageControl--expand{ left:12px; }
.forumComposer .attachPreviewRow .composerImageControl--trash{
  right:12px;
  color:#ff6b82;
  border-color:rgba(255,98,124,.54) !important;
  background:linear-gradient(145deg, rgba(54,5,17,.92), rgba(9,12,22,.84)) !important;
  box-shadow:0 10px 24px rgba(0,0,0,.38), 0 0 22px rgba(255,67,102,.2), inset 0 0 0 1px rgba(255,255,255,.05) !important;
}
.forumComposer .attachPreviewRow .composerImageNav{
  z-index:7;
  top:50%;
  width:46px;
  height:46px;
  min-width:46px;
  border-radius:999px;
  transform:translateY(-50%);
  border:1px solid rgba(154,218,255,.34) !important;
  background:linear-gradient(145deg, rgba(4,11,22,.92), rgba(13,34,55,.78)) !important;
  box-shadow:0 12px 26px rgba(0,0,0,.42), 0 0 22px rgba(75,174,255,.2), inset 0 0 0 1px rgba(255,255,255,.06) !important;
  color:#f5fbff;
  transition:transform 160ms ease, filter 160ms ease, border-color 160ms ease;
}
.forumComposer .attachPreviewRow .composerImageNav:hover{
  transform:translateY(-50%) scale(1.08);
  filter:brightness(1.14);
  border-color:rgba(133,221,255,.62) !important;
}
.forumComposer .attachPreviewRow .composerImageNav:active{
  transform:translateY(-50%) scale(.94);
}
.forumComposer .composerImageNav--prev{ left:14px; }
.forumComposer .composerImageNav--next{ right:14px; }
.forumComposer .composerImageNavGlyph{
  position:relative;
  z-index:1;
  width:100%;
  height:100%;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:inherit;
}
.forumComposer .composerImageNavGlyph::after{
  content:'';
  position:absolute;
  inset:-5px;
  border-radius:inherit;
  border:1px solid rgba(95,199,255,.32);
  opacity:0;
  animation:composerImageArrowPulse 2.2s ease-out infinite;
  pointer-events:none;
}
.forumComposer .composerImageNavGlyph svg{
  display:block;
  margin:0;
  filter:drop-shadow(0 0 7px rgba(112,211,255,.48));
}
@keyframes composerImageArrowPulse{
  0%,38%{ transform:scale(.82); opacity:0; }
  52%{ opacity:.72; }
  100%{ transform:scale(1.28); opacity:0; }
}
.forumComposer .composerImageCounter{
  position:absolute;
  left:50%;
  bottom:12px;
  transform:translateX(-50%);
  z-index:8;
  padding:6px 11px;
  border-radius:999px;
  border:1px solid rgba(255,222,120,.34);
  background:rgba(2,8,17,.78);
  color:#fff0b4;
  font:800 11px/1 ui-monospace,monospace;
  letter-spacing:.08em;
  box-shadow:0 0 20px rgba(255,207,80,.12);
  pointer-events:none;
}
@media (max-width:640px){
  .forumComposer .composerImageCarousel{
    border-radius:13px;
  }
  .forumComposer .attachPreviewRow .composerImageControl{
    width:38px;
    height:38px;
    top:10px;
    border-radius:12px;
  }
  .forumComposer .composerImageControl--expand{ left:10px; }
  .forumComposer .attachPreviewRow .composerImageControl--trash{ right:10px; }
  .forumComposer .attachPreviewRow .composerImageNav{
    width:42px;
    height:42px;
    min-width:42px;
  }
  .forumComposer .composerImageNav--prev{ left:10px; }
  .forumComposer .composerImageNav--next{ right:10px; }
}
@media (prefers-reduced-motion:reduce){
  .forumComposer .composerImageCarouselTrack{ transition:none; }
  .forumComposer .composerImageNavGlyph::after{ animation:none; }
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
  50%{ text-shadow:0 0 .9РЎР‚Р ВµР С rgba(255,215,0,.55), 0 0 .25rem rgba(255,255,190,.55) }
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
  width:38px; height:38px; border:0; border-radius:8px;
  background:rgba(255,255,255,.06); color:#eaf4ff; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:16px; line-height:1;
  pointer-events: auto;
  touch-action: manipulation; /* Р±С‹СЃС‚СЂРµРµ/С‡РёС‰Рµ РєР»РёРє РЅР° РјРѕР±РёР»Рµ */  
}
.kebabBtn:hover{ filter:brightness(1.1); }
.ownerMenu{
position:absolute; right:40px; top:0px; display:flex; flex-direction:column; gap:8px; 
padding:11px; background:rgba(12,18,34,.96); border:1px solid rgba(170,200,255,.14);
  border-radius:13px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:20; visibility:hidden;
 pointer-events: auto;
  }
 /* RTL: Р·РµСЂРєР°Р»РёРј РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРёРµ в‹® Рё РІС‹РїР°РґР°СЋС‰РµРіРѕ РјРµРЅСЋ */
 [dir="rtl"] .ownerKebab{ right:auto; left:8px; }
 [dir="rtl"] .ownerMenu{ right:auto; left:40px; }

.ownerKebab:focus-within .ownerMenu,
.ownerKebab:hover .ownerMenu{ visibility:visible; }

.ownerMenu button{
  width:38px; height:38px;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:16px; line-height:1;
  border-radius:8px;
  border:1px solid rgba(170,200,255,.14);
}

 /* owner menu: РѕР±С‹С‡РЅС‹Рµ РєРЅРѕРїРєРё (РЅР°РїСЂРёРјРµСЂ вњЏпёЏ) вЂ” Р±РµР· СЃРµСЂРѕРіРѕ С„РѕРЅР° */
 .ownerMenu button:not(.danger){
   background: transparent !important;
   box-shadow: none !important;
   -webkit-appearance: none;
   appearance: none;
 }
.ownerMenu .danger{
  padding:0; border-radius:8px; background:rgba(255,60,60,.12); color:#ff6a6a; border:1px solid rgba(255,80,80,.25);
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
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  min-height:30px;
}
.dmConfirmBtn:hover{ filter:brightness(1.08) saturate(1.08); box-shadow:0 0 16px rgba(80,167,255,.25); }
.dmConfirmBtn:active{ transform:translateY(1px) scale(.98); }
.dmConfirmBtn:disabled{
  cursor:wait;
  opacity:.82;
  transform:none;
  filter:none;
}
.dmConfirmBtn.primary{
  border-color: rgba(140,200,255,.65);
  background: linear-gradient(120deg, rgba(40,140,255,.65), rgba(100,200,255,.35));
  color:#0b1b2e;
  text-shadow:0 0 8px rgba(255,255,255,.4);
}
.dmConfirmBtn.primary:hover{ filter:brightness(1.1) saturate(1.1); }
.dmConfirmBtn.primary.isPending{
  border-color:rgba(96,214,255,.82);
  box-shadow:0 0 18px rgba(80,188,255,.22), inset 0 0 14px rgba(255,255,255,.14);
}
.dmConfirmSpinner{
  width:13px;
  height:13px;
  border-radius:999px;
  border:2px solid rgba(10,27,46,.28);
  border-top-color:#f7fbff;
  border-right-color:#87e6ff;
  box-shadow:0 0 10px rgba(117,225,255,.45);
  animation:dmConfirmSpin .72s linear infinite;
}
.dmConfirmBtn.ghost{ background: transparent; color:#d6e9ff; }
.dmConfirmBtn:disabled:hover{
  filter:none;
  box-shadow:0 0 14px rgba(80,188,255,.18);
}
@keyframes dmConfirmSpin{
  to{ transform:rotate(360deg); }
}
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
  --trail: "РІСљВ¦";

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
.qcastFxLayer[data-scope="viewport"]{
  position:fixed;
  inset:0;
  z-index: 2147483000;
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
  --trail: "РІСљВ¦";

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
  padding:2px 8px;
  white-space:nowrap;          /* РЅРµ РїРµСЂРµРЅРѕСЃРёРј РЅРёРє */
  overflow:hidden; text-overflow:ellipsis;
}
.avaNick.avaNick--profileName .nick-text{
  display:block;
  width:100%;
  max-width:100%;
  min-width:0;
  text-align:center;
  overflow:hidden;
  text-overflow:clip;
}
.avaNick.avaNick--profileName{
  box-sizing:border-box;
  padding-inline:3px !important;
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
  flex:1 1 auto;
  min-width:0;
  width:100%;
  display:inline-flex;
  align-items:center;
  justify-content:flex-end;
  white-space:nowrap;
  overflow:visible;
  text-overflow:clip;
  text-align:right;

  /* Р±С‹Р»Рѕ clamp(12px, 2.8vw, 24px) вЂ” СЃР¶РёРјР°Р»Рѕ СЃ 857px */
  font-size:clamp(12px, 3.9vw, 22px);

  max-width:100%;
}

article[data-forum-post-card="1"] .forumDividerRail::after{
  content:'';
  display:block;
  left:-34%;
  width:34%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,236,166,.95), rgba(255,255,255,0));
  filter: drop-shadow(0 0 8px rgba(255,205,100,.62));
  animation: forumDividerPulse 2.4s linear infinite;
  animation-delay: .75s;
}
article[data-forum-post-card="1"] .forumDividerRail{
  background: linear-gradient(90deg, rgba(255,205,100,.06), rgba(255,214,120,.58), rgba(255,205,100,.06));
  opacity: .85;
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
   max-width:130px;
 }
 .item .topicUserRow .nick-badge .nick-text{
   display:block;
   white-space:nowrap;
   overflow:hidden;
   text-overflow:clip;
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
  max-width:130px;
}
.item .postUserRow .nick-badge .nick-text{
  display:block;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:clip;
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
  padding:0;
  background:transparent;
  box-shadow:0 0 18px rgba(120,200,255,.28);
  cursor:pointer;
}
.dmRowAvatarImg{
  width:100%; height:100%; border-radius:12px; overflow:hidden; background:transparent;
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
.dmRow .nick-badge .nick-text{ max-width:100%; }
.dmSystemBadge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:22px;
  max-width:132px;
  padding:0 8px;
  border-radius:999px;
  border:1px solid rgba(111,226,255,.45);
  background:linear-gradient(135deg, rgba(10,32,45,.76), rgba(9,17,34,.72));
  color:#e8fbff;
  font-size:10px;
  line-height:1;
  font-weight:900;
  letter-spacing:.04em;
  text-transform:uppercase;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:clip;
  box-shadow:0 0 14px rgba(78,220,255,.2), inset 0 0 12px rgba(78,220,255,.1);
}
.systemNick{
  border-color:rgba(111,226,255,.72) !important;
  box-shadow:0 0 14px rgba(111,226,255,.24), inset 0 0 12px rgba(111,226,255,.08) !important;
}
.ql7SupportPopover{
  position:fixed;
  z-index:2147482600;
  width:min(360px, calc(100vw - 24px));
  padding:14px;
  border-radius:18px;
  border:1px solid rgba(109,229,255,.46);
  background:
    radial-gradient(circle at 18% 0%, rgba(120,225,255,.22), transparent 36%),
    linear-gradient(145deg, rgba(8,16,29,.96), rgba(13,30,48,.94));
  color:#eaf9ff;
  box-shadow:0 24px 70px rgba(0,0,0,.55), 0 0 32px rgba(93,217,255,.22), inset 0 0 24px rgba(93,217,255,.08);
  backdrop-filter:blur(18px);
}
.ql7SupportPopoverHead{
  display:flex;
  align-items:center;
  gap:10px;
  min-width:0;
}
.ql7SupportAvatarShell{
  width:56px;
  height:56px;
  flex:0 0 auto;
  border-radius:17px;
  display:grid;
  place-items:center;
  background:linear-gradient(145deg, rgba(9,25,42,.72), rgba(11,15,28,.62));
  border:1px solid rgba(102,219,255,.42);
  box-shadow:0 0 18px rgba(91,220,255,.28);
  overflow:hidden;
}
.ql7SupportAvatar{
  width:100%;
  height:100%;
  object-fit:contain;
}
.ql7SupportTitleBlock{
  display:flex;
  flex:1 1 auto;
  min-width:0;
  flex-direction:column;
  gap:5px;
}
.ql7SupportTitleBlock b{
  font-size:16px;
  line-height:1;
  color:#fff;
  text-shadow:0 0 14px rgba(111,226,255,.45);
}
.ql7SupportTitleBlock span{
  width:auto;
  max-width:100%;
  min-width:0;
  padding:4px 7px;
  border-radius:999px;
  border:1px solid rgba(255,218,99,.5);
  color:#ffe590;
  font-size:clamp(8px, 2vw, 10px);
  line-height:1;
  font-weight:900;
  letter-spacing:.025em;
  text-transform:uppercase;
  white-space:nowrap;
  overflow:hidden;
  background:rgba(70,48,9,.35);
  box-shadow:0 0 14px rgba(255,205,67,.2);
}
.ql7SupportClose{
  width:34px;
  height:34px;
  border-radius:12px;
  display:grid;
  place-items:center;
  border:1px solid rgba(162,214,255,.22);
  background:rgba(8,15,28,.72);
  color:#dff8ff;
  cursor:pointer;
}
.ql7SupportClose svg{
  width:18px;
  height:18px;
}
.ql7SupportRail{
  position:relative;
  height:1px;
  margin:13px 0;
  overflow:hidden;
  border-radius:999px;
  background:linear-gradient(90deg, rgba(105,222,255,.06), rgba(255,219,98,.55), rgba(105,222,255,.06));
}
.ql7SupportRail::after{
  content:'';
  position:absolute;
  inset:0 auto 0 -28%;
  width:28%;
  background:linear-gradient(90deg, transparent, rgba(105,222,255,.9), transparent);
  animation: ql7SupportRail 2.4s linear infinite;
}
.ql7SupportPopover p{
  margin:0 0 10px;
  color:#d9f4ff;
  font-size:13px;
  line-height:1.45;
}
.ql7SupportPopover ul{
  margin:0;
  padding:0;
  display:grid;
  gap:7px;
  list-style:none;
}
.ql7SupportPopover li{
  position:relative;
  padding-left:14px;
  color:#bcd6e9;
  font-size:12px;
  line-height:1.35;
}
.ql7SupportPopover li::before{
  content:'';
  position:absolute;
  left:0;
  top:.55em;
  width:5px;
  height:5px;
  border-radius:999px;
  background:#7ee6ff;
  box-shadow:0 0 10px rgba(126,230,255,.75);
}
@keyframes ql7SupportRail{
  to{ transform:translateX(460%); }
}
.dmSupportLauncher{
  display:flex;
  justify-content:flex-end;
  padding:16px 18px 7px 8px;
}
.dmSupportLauncherBtn{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:9px;
  min-height:38px;
  max-width:min(100%, 250px);
  padding:0 16px 0 12px;
  border:1px solid rgba(125,232,255,.62);
  border-radius:999px;
  background:
    radial-gradient(circle at 14% 20%, rgba(255,226,120,.34), transparent 28%),
    linear-gradient(135deg, rgba(14,65,94,.78), rgba(5,18,33,.94) 58%, rgba(9,45,68,.82));
  color:#f4fbff;
  font-size:12px;
  font-weight:1000;
  letter-spacing:.08em;
  text-transform:uppercase;
  cursor:pointer;
  overflow:hidden;
  box-shadow:
    0 0 22px rgba(87,211,255,.22),
    0 0 18px rgba(255,215,107,.16),
    inset 0 0 18px rgba(119,229,255,.12);
  transition:transform .16s ease, border-color .16s ease, box-shadow .16s ease, filter .16s ease;
}
.dmSupportLauncherBtn::after{
  content:'';
  position:absolute;
  inset:1px;
  border-radius:inherit;
  background:linear-gradient(105deg, transparent 0 34%, rgba(255,255,255,.18) 46%, transparent 58% 100%);
  transform:translateX(-120%);
  animation:dmSupportLauncherSweep 3.4s ease-in-out infinite;
  pointer-events:none;
}
.dmSupportLauncherBtn:hover{
  transform:translateY(-1px);
  border-color:rgba(255,226,128,.8);
  filter:brightness(1.08);
  box-shadow:
    0 0 28px rgba(87,211,255,.3),
    0 0 26px rgba(255,215,107,.24),
    inset 0 0 22px rgba(119,229,255,.16);
}
.dmSupportLauncherBtn:active{
  transform:translateY(1px) scale(.99);
}
.dmSupportLauncherIcon{
  position:relative;
  z-index:1;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:25px;
  height:25px;
  flex:0 0 25px;
  border-radius:999px;
  background:radial-gradient(circle, rgba(126,232,255,.22), rgba(8,24,43,.7));
  box-shadow:0 0 16px rgba(126,232,255,.36), inset 0 0 10px rgba(255,225,128,.12);
}
.dmSupportLauncherIcon svg{
  width:19px;
  height:19px;
  fill:none;
  stroke:#dffaff;
  stroke-width:2.15;
  stroke-linecap:round;
  stroke-linejoin:round;
  filter:drop-shadow(0 0 5px rgba(126,232,255,.75));
}
.dmSupportLauncherText{
  position:relative;
  z-index:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  text-shadow:0 0 10px rgba(126,232,255,.36);
}
.dmSupportLauncherRail{
  position:relative;
  height:1px;
  margin:0 18px 14px;
  border-radius:999px;
  overflow:hidden;
  background:linear-gradient(90deg, rgba(94,220,255,.06), rgba(94,220,255,.45), rgba(255,220,120,.36), rgba(94,220,255,.06));
  box-shadow:0 0 16px rgba(94,220,255,.18);
}
.dmSupportLauncherRail::after{
  content:'';
  position:absolute;
  top:0;
  left:-38%;
  width:38%;
  height:100%;
  background:linear-gradient(90deg, transparent, rgba(255,236,152,.92), rgba(108,232,255,.9), transparent);
  animation:dmSupportLauncherRail 2.65s linear infinite;
}
@keyframes dmSupportLauncherSweep{
  0%,58%{ transform:translateX(-120%); opacity:0; }
  72%{ opacity:.85; }
  100%{ transform:translateX(120%); opacity:0; }
}
@keyframes dmSupportLauncherRail{
  to{ transform:translateX(430%); }
}
@media (max-width: 560px){
  .dmSupportLauncher{
    padding:14px 12px 7px 8px;
  }
  .dmSupportLauncherBtn{
    min-height:36px;
    max-width:min(100%, 210px);
    padding:0 13px 0 10px;
    font-size:10.5px;
    letter-spacing:.06em;
  }
  .dmSupportLauncherRail{
    margin:0 12px 12px;
  }
}
.topRail.supportOnly .railInner{
  grid-template-columns:minmax(72px,.5fr) minmax(96px,1fr) minmax(54px,.45fr);
}
.supportRailNotice{
  justify-content:center;
  min-width:0;
}
.supportRailNotice span{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  max-width:min(100%, 132px);
  min-height:28px;
  padding:0 6px;
  border-radius:999px;
  border:1px solid rgba(111,226,255,.35);
  background:linear-gradient(135deg, rgba(11,55,76,.58), rgba(6,17,31,.62));
  color:#dff8ff;
  font-size:clamp(8px, 1.7vw, 11px);
  font-weight:900;
  letter-spacing:.025em;
  text-transform:uppercase;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:clip;
  box-shadow:inset 0 0 14px rgba(111,226,255,.08);
}
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
  flex-wrap:nowrap;
  min-width:0;
  padding:8px 10px;
  margin:0 6px;
  border-radius:14px;
  background: linear-gradient(140deg, rgba(12,20,34,.75), rgba(18,30,48,.55));
  border:1px solid rgba(140,190,255,.2);
  box-shadow:0 10px 22px rgba(0,0,0,.22), inset 0 0 16px rgba(120,180,255,.1);
}
.dmThreadAvatar{
  width:46px; height:46px; flex:0 0 46px; border-radius:16px; padding:0;
  background:transparent;
  box-shadow:0 0 18px rgba(120,180,255,.34);
  cursor:pointer;
}
.dmThreadAvatarImg{ width:100%; height:100%; border-radius:14px; overflow:hidden; background:transparent; }
.dmThreadMeta{ min-width:0; flex:0 1 auto; display:flex; flex-direction:column; }
.dmThreadName{ font-weight:800; letter-spacing:.3px; color:#eaf4ff; text-shadow:0 0 12px rgba(120,190,255,.35); }
.dmThreadId{ font-size:12px; opacity:.7; color:#b6cce4; }
.dmThreadUser{ display:flex; align-items:center; gap:8px; flex-wrap:nowrap; min-width:0; }
.dmThreadNick{ font-size:1.05rem; padding:.3rem .6rem; }
.dmThreadHeaderRail{
  height:1px;
  margin:12px 10px 14px;
  border-radius:999px;
  overflow:hidden;
  background:linear-gradient(90deg, rgba(80,255,230,.03), rgba(80,255,230,.58), rgba(255,214,96,.28), rgba(80,255,230,.03));
  box-shadow:0 0 14px rgba(80,255,230,.2);
  position:relative;
}
.dmThreadHeaderRail::after{
  content:'';
  position:absolute;
  top:0;
  bottom:0;
  left:-38%;
  width:34%;
  background:linear-gradient(90deg, transparent, rgba(120,245,255,.95), transparent);
  filter:drop-shadow(0 0 8px rgba(120,245,255,.65));
  animation: dmRailPulse 2.6s linear infinite;
}
.dmThreadPresenceBadge{
  flex:0 1 104px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:0;
  min-width:0;
  max-width:104px;
  min-height:27px;
  margin-left:auto;
  padding:0 9px;
  border-radius:999px;
  border:1px solid rgba(255,81,109,.76);
  color:#dff8ff;
  font-size:10px;
  line-height:1;
  font-weight:900;
  letter-spacing:.055em;
  text-transform:uppercase;
  white-space:nowrap;
  overflow:hidden;
  background:linear-gradient(135deg, rgba(8,24,34,.92), rgba(12,20,34,.78));
  box-shadow:0 0 16px rgba(255,81,109,.22), inset 0 0 12px rgba(255,81,109,.08);
}
.dmThreadPresenceText{
  flex:0 0 auto;
  display:inline-block;
  font-size:calc(1em * var(--dm-presence-text-scale, 1));
  letter-spacing:.025em;
  line-height:1;
  white-space:nowrap;
  transform-origin:left center;
}
.dmThreadPresenceBadge.online{
  border-color:rgba(60,255,190,.55);
  color:#eafff8;
  box-shadow:0 0 20px rgba(60,255,190,.22), inset 0 0 14px rgba(60,255,190,.1);
  animation: dmPresencePulse 1.65s ease-in-out infinite;
}
.dmThreadPresenceBadge.system{
  border-color:rgba(111,226,255,.62);
  color:#e8fbff;
  box-shadow:0 0 18px rgba(78,220,255,.22), inset 0 0 14px rgba(78,220,255,.1);
}
@keyframes dmPresencePulse{
  0%{ border-color:rgba(60,255,190,.42); box-shadow:0 0 12px rgba(60,255,190,.14), inset 0 0 10px rgba(60,255,190,.08); }
  55%{ border-color:rgba(60,255,190,.92); box-shadow:0 0 0 5px rgba(60,255,190,0), 0 0 24px rgba(60,255,190,.36), inset 0 0 16px rgba(60,255,190,.16); }
  100%{ border-color:rgba(60,255,190,.42); box-shadow:0 0 12px rgba(60,255,190,.14), inset 0 0 10px rgba(60,255,190,.08); }
}
@media (max-width:560px){
  .dmThreadHeader{ gap:8px; }
  .dmThreadHeaderRail{ margin:10px 8px 12px; }
  .dmThreadPresenceBadge{ flex-basis:88px; max-width:88px; min-height:24px; padding:0 7px; font-size:8.5px; letter-spacing:.035em; }
  .supportRailNotice span{ max-width:min(100%, 108px); min-height:26px; padding:0 4px; font-size:clamp(7.5px, 2.25vw, 10px); letter-spacing:.01em; }
}
.dmThread{ display:flex; flex-direction:column; gap:8px; padding:0 6px; }
.dmThreadWindowSpacer{
  position:relative;
  width:100%;
  min-height:0;
  overflow:hidden;
  pointer-events:none;
}
.dmThreadWindowSkeleton{
  position:absolute;
  inset:0 0 auto;
  will-change:transform;
}
.dmThread .forumSkeletonPane--compact{
  min-height:0;
  padding:0;
  gap:10px;
}
.dmThread .forumSkeletonPane--compact .forumSkeletonCard{
  min-height:clamp(150px,22vw,230px);
  border-radius:16px;
}
.dmThread .forumSkeletonPane--compact .forumSkeletonHeader{ padding:14px 14px 0; }
.dmThread .forumSkeletonPane--compact .forumSkeletonAvatar{ width:48px; height:48px; border-radius:13px; }
.dmThread .forumSkeletonPane--compact .forumSkeletonBody{ padding:14px; }
.dmThread .forumSkeletonPane--compact .forumSkeletonMetrics{
  grid-template-columns:repeat(3,minmax(0,1fr));
  padding:0 14px 14px;
}
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
.dmMediaBox[data-kind="video"]{
  --mb-video-min-h:350px;
  min-height:350px;
  height:auto;
  max-height:none;
  display:flex;
  align-items:center;
  justify-content:center;
}
.dmMediaBox[data-kind="video"] > video,
.dmMediaBox[data-kind="video"] > .mediaBoxItem,
.dmMediaBox[data-kind="video"] > .ql7VideoSurface{
  min-height:350px;
  height:auto;
  max-height:min(72vh, 650px);
  width:100%;
  object-fit:contain;
}
.dmMediaBox[data-kind="video"] .ql7VideoSurface > video,
.dmMediaBox[data-kind="video"] > video{
  min-height:350px;
  height:auto;
  max-height:min(72vh, 650px);
  width:100%;
  object-fit:contain;
}
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
  .composerMediaBar[data-ready="1"]{
    border-color: rgba(97,255,181,.34);
    background: linear-gradient(180deg, rgba(8,22,18,.66), rgba(8,18,24,.42));
    box-shadow: 0 14px 34px rgba(37,214,133,.13), inset 0 0 0 1px rgba(133,255,201,.06);
  }
  .composerMediaBar[data-ready="1"] .cmbFill{
    background: linear-gradient(90deg, rgba(36,222,133,.94), rgba(115,250,197,.86), rgba(91,170,255,.72));
    box-shadow: 0 0 16px rgba(82,255,178,.36), 0 0 24px rgba(87,175,255,.22);
  }
  .cmbLeft{
    display:flex;
    align-items:center;
    justify-content:center;
    width: 42px;
    min-width: 42px;
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
  .cmbReadyIcon{
    width:32px;
    height:32px;
    color:#7dffba;
    display:grid;
    place-items:center;
    filter:drop-shadow(0 0 11px rgba(89,255,168,.52));
  }
  .cmbReadyIcon svg{
    width:31px;
    height:31px;
    display:block;
  }
  .cmbReadyRing{
    opacity:.82;
    transform-origin:center;
    stroke-dasharray:64;
    animation:cmbReadyRing .72s ease-out both;
  }
  .cmbReadyPath{
    stroke-dasharray:28;
    stroke-dashoffset:28;
    filter:drop-shadow(0 0 5px rgba(126,255,191,.65));
    animation:cmbReadyDraw .56s cubic-bezier(.2,.9,.2,1) .14s forwards;
  }
  @keyframes cmbReadyRing{
    0%{ transform:scale(.72); opacity:0; }
    48%{ transform:scale(1.18); opacity:1; }
    72%{ transform:scale(.96); opacity:.92; }
    100%{ transform:scale(1); opacity:.82; }
  }
  @keyframes cmbReadyDraw{
    to{ stroke-dashoffset:0; }
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
  isolation: isolate;
  overflow: hidden;
  box-shadow: none;
}
.qshine::before,
.qshine::after,
.qshine-hover::after{
  content: none !important;
  display: none !important;
  animation: none !important;
}
.qshine[data-intensity="soft"]::after,
.qshine[data-intensity="hard"]::after{
  content: none !important;
  display: none !important;
}
.qshine[data-intensity="hard"]{
  box-shadow: none;
}
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

.threadRepliesPane{
  overflow-x: clip;
}
.threadBranchRootCard{
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
}
.threadBranchRootRail{
  margin: 8px 0 10px;
  opacity: .96;
}
.threadBranchReplyEntry{
  --thread-reply-indent: 0px;
  position: relative;
  width: calc(100% - max(0px, var(--thread-reply-indent)));
  margin-inline-start: max(0px, var(--thread-reply-indent));
  max-width: 100%;
  padding-inline-start: 0;
  box-sizing: border-box;
  min-width: 0;
  overflow-x: clip;
}
.threadBranchReplyEntry::before{
  content: '';
  position: absolute;
  left: 6px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(120,180,255,.10),
    rgba(180,220,255,.95),
    rgba(120,180,255,.10)
  );
  box-shadow: 0 0 10px rgba(100,170,255,.34);
  animation: forumDividerPulse 2.4s linear infinite;
}
.threadBranchReplyEntry > article{
  max-width: 100%;
  min-width: 0;
}

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
  .userInfoGiftBtn,
  .userInfoGiftBtn::before,
  .userInfoGiftRibbon,
  .userInfoGiftSpark,
  .dmRowRail::after{
    animation: none !important;
  }
}



/* ql7-search-global-profile-premium-v27:start */
.searchPortalOverlay{
  z-index:2147482500;
  background:
    radial-gradient(80% 80% at 50% 8%, rgba(80,167,255,.13), rgba(0,0,0,0) 54%),
    rgba(0,0,0,.48);
  backdrop-filter: blur(7px) saturate(130%);
}
.searchPortalPop{
  width:min(500px, 92vw);
  max-height:min(82vh, 760px);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  padding:0;
  border-radius:18px;
  border-color:rgba(150,200,255,.22);
  background:
    radial-gradient(120% 115% at 12% 0%, rgba(120,200,255,.18), rgba(10,14,20,.98) 54%),
    radial-gradient(90% 80% at 100% 0%, rgba(255,210,92,.12), rgba(0,0,0,0) 48%),
    linear-gradient(145deg, rgba(8,13,22,.98), rgba(13,22,35,.99));
  box-shadow:
    0 24px 74px rgba(0,0,0,.68),
    0 0 42px rgba(80,167,255,.18),
    inset 0 0 0 1px rgba(255,255,255,.045);
}
.searchPortalHead{
  flex:0 0 auto;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
  padding:16px 16px 12px;
  border-bottom:1px solid rgba(255,255,255,.085);
  background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0));
}
.searchPortalTitleGroup{ min-width:0; display:flex; flex-direction:column; gap:3px; }
.searchPortalKicker{
  width:max-content;
  max-width:100%;
  font-size:.68rem;
  font-weight:900;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:rgba(255,220,130,.86);
  text-shadow:0 0 16px rgba(255,200,70,.28);
}
.searchPortalTitle{
  font-size:1.16rem;
  line-height:1.12;
  font-weight:950;
  color:#f5fbff;
  text-shadow:0 0 20px rgba(120,190,255,.22);
}
.searchPortalSubtitle{
  font-size:.78rem;
  line-height:1.28;
  color:rgba(222,238,255,.68);
}
.searchPortalCloseBtn{
  flex:0 0 auto;
  width:36px;
  height:36px;
  border-radius:12px;
  border:1px solid rgba(180,210,255,.18);
  background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.025));
  color:rgba(234,245,255,.9);
  display:grid;
  place-items:center;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.035), 0 8px 22px rgba(0,0,0,.28);
  transition:transform .16s ease, border-color .18s ease, box-shadow .18s ease, color .18s ease, background .18s ease;
}
.searchPortalCloseBtn svg{ width:18px; height:18px; stroke:currentColor; stroke-width:2; fill:none; stroke-linecap:round; }
.searchPortalCloseBtn:hover,
.searchPortalCloseBtn:focus-visible{
  color:#fff;
  border-color:rgba(180,225,255,.42);
  background:linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.045));
  box-shadow:0 0 22px rgba(80,167,255,.18), inset 0 0 0 1px rgba(255,255,255,.06);
  transform:translateY(-1px);
}
.searchPortalInputShell{
  flex:0 0 auto;
  position:relative;
  margin:14px 16px 10px;
  min-height:46px;
}
.searchPortalInputIcon{
  position:absolute;
  left:14px;
  top:50%;
  transform:translateY(-50%);
  width:22px;
  height:22px;
  display:grid;
  place-items:center;
  color:rgba(150,210,255,.82);
  pointer-events:none;
  filter:drop-shadow(0 0 10px rgba(80,167,255,.35));
}
[dir="rtl"] .searchPortalInputIcon{ left:auto; right:14px; }
.searchPortalInput{
  width:100%;
  height:46px;
  border-radius:15px;
  border:1px solid rgba(150,200,255,.22);
  background:
    radial-gradient(100% 140% at 0% 0%, rgba(80,167,255,.13), rgba(255,255,255,0) 50%),
    rgba(6,11,19,.72);
  color:#f4fbff;
  padding:0 38px 0 46px;
  font-weight:760;
  outline:none;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.035), 0 10px 28px rgba(0,0,0,.24);
  transition:border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
[dir="rtl"] .searchPortalInput{ padding:0 46px 0 38px; }
.searchPortalInput::placeholder{ color:rgba(220,236,255,.48); font-weight:700; }
.searchPortalInput:focus{
  border-color:rgba(255,215,120,.55);
  box-shadow:0 0 0 3px rgba(255,200,80,.10), 0 0 28px rgba(255,200,80,.12), inset 0 0 0 1px rgba(255,255,255,.055);
}
.searchPortalClearBtn{
  position:absolute;
  right:12px;
  top:50%;
  transform:translateY(-50%);
  width:18px;
  height:18px;
  border:0;
  background:transparent;
  color:rgba(238,248,255,.78);
  display:grid;
  place-items:center;
  padding:0;
  font-size:17px;
  line-height:1;
  font-weight:700;
  opacity:.86;
  transition:opacity .14s ease, color .14s ease, transform .14s ease;
}
[dir="rtl"] .searchPortalClearBtn{ right:auto; left:12px; }
.searchPortalClearBtn:hover,
.searchPortalClearBtn:focus-visible{ opacity:1; color:#fff; transform:translateY(-50%) scale(1.08); }
.searchPortalTabs{
  flex:0 0 auto;
  margin:0 16px 12px;
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  border:1px solid rgba(170,210,255,.16);
  border-radius:14px;
  overflow:hidden;
  background:linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.026));
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.035);
}
.searchPortalTab{
  position:relative;
  min-width:0;
  height:38px;
  border:0;
  background:transparent;
  color:rgba(224,240,255,.68);
  font-size:.82rem;
  font-weight:900;
  letter-spacing:.02em;
  display:grid;
  place-items:center;
  transition:color .18s ease, background .18s ease, box-shadow .18s ease;
}
.searchPortalTab + .searchPortalTab{ border-left:1px solid rgba(255,255,255,.105); }
[dir="rtl"] .searchPortalTab + .searchPortalTab{ border-left:0; border-right:1px solid rgba(255,255,255,.105); }
.searchPortalTab:hover,
.searchPortalTab:focus-visible{ color:#fff; background:rgba(255,255,255,.045); }
.searchPortalTab.isActive{
  color:#ffe39a;
  background:
    radial-gradient(90% 100% at 50% 0%, rgba(255,216,120,.20), rgba(255,255,255,0) 62%),
    linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.035));
  box-shadow:inset 0 -2px 0 rgba(255,204,80,.88), 0 0 22px rgba(255,204,80,.12);
}
.searchPortalResults{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  -webkit-overflow-scrolling:touch;
  overscroll-behavior:contain;
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:0 16px 16px;
}
.searchPortalResults::-webkit-scrollbar{ width:8px; }
.searchPortalResults::-webkit-scrollbar-thumb{ background:rgba(150,200,255,.22); border-radius:999px; }
.searchPortalResultCard{
  width:100%;
  min-width:0;
  border:1px solid rgba(150,200,255,.16);
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(80,167,255,.12), rgba(255,255,255,0) 58%),
    linear-gradient(145deg, rgba(255,255,255,.060), rgba(255,255,255,.026));
  color:#edf8ff;
  border-radius:16px;
  padding:11px;
  text-align:start;
  box-shadow:0 12px 30px rgba(0,0,0,.24), inset 0 0 0 1px rgba(255,255,255,.026);
  transition:transform .16s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.searchPortalResultCard:hover,
.searchPortalResultCard:focus-visible{
  transform:translateY(-1px);
  border-color:rgba(255,213,110,.40);
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(255,210,90,.13), rgba(255,255,255,0) 58%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.035));
  box-shadow:0 16px 38px rgba(0,0,0,.30), 0 0 26px rgba(255,204,80,.10), inset 0 0 0 1px rgba(255,255,255,.036);
}
.searchPortalPostCard{
  display:grid;
  grid-template-columns:minmax(112px, 136px) minmax(0, 1fr);
  gap:12px;
  align-items:stretch;
}
.searchPortalCardNoMedia{ grid-template-columns:1fr; }
.searchPortalTopicCard,
.searchPortalUserCard{ display:flex; align-items:center; gap:12px; }
.searchPortalUserCard{ min-height:68px; }
.searchPortalMedia{
  position:relative;
  min-width:0;
  width:100%;
  aspect-ratio:1.18/1;
  overflow:hidden;
  border-radius:14px;
  border:1px solid rgba(170,215,255,.18);
  background:radial-gradient(120% 120% at 10% 0%, rgba(120,200,255,.22), rgba(8,12,22,.88));
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.035), 0 0 22px rgba(80,167,255,.12);
  display:grid;
  place-items:center;
}
.searchPortalMedia img,
.searchPortalMedia video{ width:100%; height:100%; display:block; object-fit:cover; }
.searchPortalMedia--sticker img{ object-fit:contain; padding:9px; }
.searchPortalMedia--fallback{ color:rgba(222,240,255,.86); }
.searchPortalMediaIcon{ width:30px; height:30px; display:grid; place-items:center; }
.searchPortalMediaIcon svg{ width:100%; height:100%; }
.searchPortalMediaBadge{
  position:absolute;
  right:7px;
  bottom:7px;
  max-width:calc(100% - 14px);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  border-radius:999px;
  padding:3px 7px;
  font-size:9px;
  line-height:1;
  font-weight:900;
  letter-spacing:.05em;
  text-transform:uppercase;
  color:#fff;
  background:rgba(0,0,0,.56);
  backdrop-filter:blur(7px);
}
.searchPortalCardBody{ min-width:0; display:flex; flex-direction:column; gap:7px; justify-content:center; }
.searchPortalMetaRow{ min-width:0; display:flex; align-items:center; justify-content:space-between; gap:8px; }
.searchPortalAuthor{ min-width:0; display:inline-flex; align-items:center; gap:7px; }
.searchPortalAuthor--small{ max-width:100%; }
.searchPortalAuthor--regular{ width:100%; }
.searchPortalAuthorAvatar{
  flex:0 0 auto;
  width:30px;
  height:30px;
  border-radius:999px;
  border:1px solid rgba(130,200,255,.42);
  box-shadow:0 0 13px rgba(80,167,255,.22);
  overflow:hidden;
}
.searchPortalAuthor--small .searchPortalAuthorAvatar{ width:25px; height:25px; }
.searchPortalNickBadge{ max-width:190px; min-width:0; }
.searchPortalAuthor--small .searchPortalNickBadge{ max-width:138px; font-size:.75rem; }
.searchPortalVip{ flex:0 0 auto; transform:scale(.82); transform-origin:center; }
.searchPortalDate{
  flex:0 0 auto;
  color:rgba(222,238,255,.56);
  font-size:.68rem;
  font-weight:750;
  white-space:nowrap;
}
.searchPortalContext,
.searchPortalTopicCount{
  width:max-content;
  max-width:100%;
  color:rgba(255,221,145,.84);
  font-size:.74rem;
  font-weight:900;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.searchPortalTopicCount{
  color:rgba(210,230,255,.62);
  font-size:.70rem;
}
.searchPortalTopicTitle{
  color:#f5fbff;
  font-size:1rem;
  line-height:1.24;
  font-weight:950;
  overflow-wrap:anywhere;
  text-shadow:0 0 18px rgba(120,190,255,.15);
}
.searchPortalText{
  color:rgba(232,244,255,.84);
  font-size:.82rem;
  line-height:1.38;
  overflow-wrap:anywhere;
  display:-webkit-box;
  -webkit-line-clamp:4;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.searchPortalEmptyState{
  min-height:184px;
  display:grid;
  align-content:center;
  justify-items:center;
  text-align:center;
  gap:8px;
  padding:24px 16px;
  border:1px dashed rgba(150,200,255,.18);
  border-radius:16px;
  background:rgba(255,255,255,.025);
}
.searchPortalEmptyOrb{
  width:44px;
  height:44px;
  border-radius:999px;
  background:radial-gradient(circle at 30% 20%, rgba(255,230,150,.90), rgba(80,167,255,.28) 44%, rgba(255,255,255,.04) 70%);
  box-shadow:0 0 30px rgba(255,205,80,.14), 0 0 26px rgba(80,167,255,.18);
}
.searchPortalEmptyTitle{ color:#f2f8ff; font-size:.95rem; font-weight:950; }
.searchPortalEmptyText{ color:rgba(222,238,255,.62); font-size:.78rem; line-height:1.35; max-width:310px; }
@media (max-width: 640px){
  .searchPortalPop{
    width:min(500px, 96vw);
    max-height:min(84vh, 760px);
    border-radius:17px;
  }
  .searchPortalHead{ padding:14px 14px 10px; }
  .searchPortalInputShell{ margin:12px 14px 9px; }
  .searchPortalTabs{ margin:0 14px 10px; }
  .searchPortalResults{ padding:0 14px 14px; gap:9px; }
}
@media (max-width: 430px){
  .searchPortalPostCard{ grid-template-columns:1fr; }
  .searchPortalMedia{ aspect-ratio:16/9; }
  .searchPortalMetaRow{ align-items:flex-start; }
  .searchPortalDate{ white-space:normal; text-align:end; }
  .searchPortalAuthor--small .searchPortalNickBadge{ max-width:160px; }
  .searchPortalTitle{ font-size:1.06rem; }
  .searchPortalSubtitle{ font-size:.73rem; }
  .searchPortalTab{ font-size:.78rem; }
}

/* ql7-search-premium-fix-v33:start */
.profilePop.searchPortalPop{
  width:min(500px, 92vw) !important;
  max-width:min(500px, 92vw) !important;
}
.searchPortalHead{
  align-items:center;
}
.searchPortalBrandBlock{
  min-width:0;
  display:flex;
  align-items:center;
  gap:12px;
}
.searchPortalQuantumLogo{
  flex:0 0 auto;
  width:132px;
  height:42px;
  display:block;
  filter:drop-shadow(0 0 14px rgba(80,190,255,.18)) drop-shadow(0 0 16px rgba(255,210,90,.12));
}
.searchPortalQuantumLogo svg{
  width:100%;
  height:100%;
  display:block;
}
.searchPortalTitleGroup{
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:4px;
}
.searchPortalPostCard{
  display:grid !important;
  grid-template-columns:minmax(0, 1fr) 118px !important;
  gap:13px !important;
  align-items:center !important;
  min-height:132px;
}
.searchPortalCardNoMedia{
  grid-template-columns:1fr !important;
}
.searchPortalPostBody{
  min-width:0;
  align-self:stretch;
  justify-content:center;
  gap:7px;
}
.searchPortalAuthorLine{
  min-width:0;
  display:flex;
  align-items:center;
}
.searchPortalAuthor{
  min-width:0;
  max-width:100%;
}
.searchPortalAuthor--small{
  max-width:100%;
}
.searchPortalAuthor--small .searchPortalNickBadge{
  max-width:178px;
}
.searchPortalVip{
  flex:0 0 auto;
  margin-inline-start:2px;
}
.searchPortalPostDate{
  width:max-content;
  max-width:100%;
  margin-top:1px;
  padding-top:2px;
  opacity:.78;
}
.searchPortalMedia{
  justify-self:end;
  width:118px !important;
  height:118px !important;
  aspect-ratio:1 / 1 !important;
  background:#02050a !important;
  border-radius:14px;
  overflow:hidden;
}
.searchPortalMedia img,
.searchPortalMedia video{
  width:100% !important;
  height:100% !important;
  object-fit:contain !important;
  background:#000 !important;
}
.searchPortalMedia--sticker img{
  object-fit:contain !important;
  padding:8px !important;
}
.searchPortalText{
  -webkit-line-clamp:5;
}
@media (max-width: 520px){
  .searchPortalBrandBlock{ gap:9px; }
  .searchPortalQuantumLogo{ width:112px; height:36px; }
  .searchPortalPostCard{
    grid-template-columns:minmax(0, 1fr) 96px !important;
    min-height:112px;
    gap:10px !important;
  }
  .searchPortalMedia{
    width:96px !important;
    height:96px !important;
  }
  .searchPortalAuthor--small .searchPortalNickBadge{ max-width:128px; }
}
@media (max-width: 390px){
  .searchPortalHead{ align-items:flex-start; }
  .searchPortalBrandBlock{ align-items:flex-start; }
  .searchPortalQuantumLogo{ width:92px; height:32px; }
  .searchPortalPostCard{
    grid-template-columns:1fr !important;
  }
  .searchPortalMedia{
    justify-self:start;
    width:min(156px, 100%) !important;
    height:min(156px, 44vw) !important;
  }
}
/* ql7-search-premium-fix-v33:end */
/* ql7-search-global-profile-premium-v27:end */



/* ql7-search-hard-contain-v44:start */
.profilePop.searchPortalPop{
  --ql7-search-preview-size:116px;
  width:min(500px, 92vw) !important;
  max-width:min(500px, 92vw) !important;
}
.searchPortalQuantumLogo{
  width:146px !important;
  height:46px !important;
  filter:drop-shadow(0 0 16px rgba(88,205,255,.26)) drop-shadow(0 0 20px rgba(255,216,96,.18)) !important;
}
.searchPortalQuantumLogo svg{
  width:100% !important;
  height:100% !important;
  overflow:visible !important;
}
.searchPortalResults{
  gap:10px !important;
  padding:0 16px 16px !important;
}
.searchPortalResultCard{
  box-sizing:border-box !important;
  width:100% !important;
  min-width:0 !important;
  overflow:hidden !important;
  contain:layout paint !important;
}
.searchPortalPostCard{
  display:grid !important;
  grid-template-columns:minmax(0, 1fr) var(--ql7-search-preview-size) !important;
  gap:12px !important;
  align-items:center !important;
  min-height:calc(var(--ql7-search-preview-size) + 22px) !important;
  padding:10px 12px !important;
}
.searchPortalCardNoMedia{
  grid-template-columns:minmax(0, 1fr) !important;
  min-height:82px !important;
}
.searchPortalPostBody,
.searchPortalTopicBody,
.searchPortalCardBody{
  min-width:0 !important;
  max-width:100% !important;
  overflow:hidden !important;
  justify-content:flex-start !important;
  align-self:center !important;
  gap:6px !important;
}
.searchPortalAuthorLine{
  min-width:0 !important;
  max-width:100% !important;
  display:flex !important;
  align-items:center !important;
  overflow:hidden !important;
}
.searchPortalAuthor{
  min-width:0 !important;
  max-width:100% !important;
  overflow:hidden !important;
  flex-wrap:nowrap !important;
}
.searchPortalAuthorAvatar{
  flex:0 0 auto !important;
}
.searchPortalAuthor--small .searchPortalNickBadge,
.searchPortalNickBadge{
  min-width:0 !important;
  max-width:min(188px, 100%) !important;
  overflow:hidden !important;
}
.searchPortalNickBadge .nick-text{
  min-width:0 !important;
  max-width:100% !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
}
.searchPortalVip{
  flex:0 0 auto !important;
}
.searchPortalContext,
.searchPortalTopicTitle{
  color:#ffd36a !important;
  text-shadow:0 2px 14px rgba(255,190,60,.30) !important;
  min-width:0 !important;
  max-width:100% !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
}
.searchPortalContext{
  width:auto !important;
  display:block !important;
  font-size:.76rem !important;
  line-height:1.24 !important;
}
.searchPortalTopicTitle{
  display:block !important;
  font-size:.93rem !important;
  line-height:1.25 !important;
}
.searchPortalText,
.searchPortalPostText,
.searchPortalTopicText{
  min-width:0 !important;
  max-width:100% !important;
  color:rgba(238,246,255,.90) !important;
  font-size:.82rem !important;
  line-height:1.34 !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  display:-webkit-box !important;
  -webkit-box-orient:vertical !important;
  -webkit-line-clamp:2 !important;
  overflow-wrap:break-word !important;
  word-break:normal !important;
}
.searchPortalPostDate,
.searchPortalTopicFoot .searchPortalDate,
.searchPortalDate{
  display:inline-flex !important;
  align-items:center !important;
  width:max-content !important;
  max-width:100% !important;
  margin-top:1px !important;
  color:rgba(220,236,255,.56) !important;
  font-size:.66rem !important;
  line-height:1.1 !important;
  font-weight:760 !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
}
.searchPortalTopicFoot{
  min-width:0 !important;
  max-width:100% !important;
  display:flex !important;
  align-items:center !important;
  gap:8px !important;
  overflow:hidden !important;
}
.searchPortalTopicCount{
  flex:0 1 auto !important;
  min-width:0 !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
}
.searchPortalMedia{
  box-sizing:border-box !important;
  justify-self:end !important;
  align-self:center !important;
  flex:0 0 var(--ql7-search-preview-size) !important;
  width:var(--ql7-search-preview-size) !important;
  height:var(--ql7-search-preview-size) !important;
  min-width:var(--ql7-search-preview-size) !important;
  max-width:var(--ql7-search-preview-size) !important;
  min-height:var(--ql7-search-preview-size) !important;
  max-height:var(--ql7-search-preview-size) !important;
  aspect-ratio:1 / 1 !important;
  padding:0 !important;
  overflow:hidden !important;
  border-radius:14px !important;
  background:#000 !important;
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  place-items:center !important;
}
.searchPortalMedia--sticker{
  padding:8px !important;
}
.searchPortalMedia .searchPortalMediaObject,
.searchPortalMedia img,
.searchPortalMedia video{
  box-sizing:border-box !important;
  flex:0 1 auto !important;
  width:auto !important;
  height:auto !important;
  inline-size:auto !important;
  block-size:auto !important;
  min-width:0 !important;
  min-height:0 !important;
  max-width:100% !important;
  max-height:100% !important;
  max-inline-size:100% !important;
  max-block-size:100% !important;
  object-fit:contain !important;
  object-position:center center !important;
  display:block !important;
  background:#000 !important;
  transform:none !important;
}
.searchPortalMedia--sticker .searchPortalMediaObject,
.searchPortalMedia--sticker img{
  max-width:100% !important;
  max-height:100% !important;
  object-fit:contain !important;
  background:transparent !important;
}
.searchPortalMediaBadge{
  pointer-events:none !important;
  right:6px !important;
  bottom:6px !important;
  max-width:calc(100% - 12px) !important;
}
.searchPortalTopicCard,
.searchPortalUserCard{
  min-height:76px !important;
  overflow:hidden !important;
}
@media (max-width: 560px){
  .profilePop.searchPortalPop{ --ql7-search-preview-size:104px; }
  .searchPortalPostCard{
    grid-template-columns:minmax(0, 1fr) var(--ql7-search-preview-size) !important;
    gap:10px !important;
    min-height:calc(var(--ql7-search-preview-size) + 20px) !important;
    padding:10px !important;
  }
  .searchPortalQuantumLogo{ width:124px !important; height:40px !important; }
  .searchPortalAuthor--small .searchPortalNickBadge{ max-width:132px !important; }
}
@media (max-width: 390px){
  .profilePop.searchPortalPop{ --ql7-search-preview-size:88px; }
  .searchPortalPostCard{
    grid-template-columns:minmax(0, 1fr) var(--ql7-search-preview-size) !important;
    min-height:calc(var(--ql7-search-preview-size) + 20px) !important;
  }
  .searchPortalQuantumLogo{ width:104px !important; height:34px !important; }
  .searchPortalAuthor--small .searchPortalNickBadge{ max-width:108px !important; }
  .searchPortalText,
  .searchPortalPostText,
  .searchPortalTopicText{ -webkit-line-clamp:2 !important; }
}
/* ql7-search-hard-contain-v44:end */

/* ql7-search-final-polish-v46:start */
.profilePop.searchPortalPop{
  --ql7-search-preview-size:116px;
}
.searchPortalPostCard{
  min-height:calc(var(--ql7-search-preview-size) + 22px) !important;
  align-items:center !important;
}
.searchPortalPostCard.searchPortalCardNoMedia,
.searchPortalCardNoMedia.searchPortalPostCard{
  grid-template-columns:minmax(0, 1fr) !important;
  min-height:calc(var(--ql7-search-preview-size) + 22px) !important;
  padding-top:10px !important;
  padding-bottom:10px !important;
}
.searchPortalCardNoMedia .searchPortalPostBody{
  min-height:var(--ql7-search-preview-size) !important;
  justify-content:center !important;
  align-self:stretch !important;
  overflow:hidden !important;
}
.searchPortalPostBody,
.searchPortalTopicBody{
  overflow:hidden !important;
}
.searchPortalPostText,
.searchPortalTopicText,
.searchPortalText{
  min-height:0 !important;
}
.searchPortalClearBtn{
  font-size:0 !important;
  text-indent:0 !important;
  overflow:hidden !important;
}
.searchPortalClearBtn > span{
  display:grid !important;
  place-items:center !important;
  width:18px !important;
  height:18px !important;
  font-size:18px !important;
  line-height:1 !important;
  font-weight:850 !important;
  color:currentColor !important;
  text-indent:0 !important;
}
.searchPortalTopicFoot{
  width:100% !important;
  display:flex !important;
  align-items:center !important;
  flex-wrap:wrap !important;
  gap:7px !important;
  margin-top:2px !important;
  overflow:visible !important;
}
.searchPortalTopicBadge{
  min-width:0 !important;
  max-width:100% !important;
  display:inline-flex !important;
  align-items:center !important;
  gap:5px !important;
  height:22px !important;
  padding:0 8px !important;
  border-radius:999px !important;
  border:1px solid rgba(150,205,255,.20) !important;
  background:linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.030)) !important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.028), 0 8px 18px rgba(0,0,0,.18) !important;
  color:rgba(226,240,255,.80) !important;
  font-size:.66rem !important;
  line-height:1 !important;
  font-weight:850 !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
}
.searchPortalTopicBadge--posts{
  border-color:rgba(255,210,96,.34) !important;
  background:linear-gradient(180deg, rgba(255,210,96,.16), rgba(255,210,96,.050)) !important;
  color:#ffe3a0 !important;
}
.searchPortalTopicBadge--date{
  border-color:rgba(120,190,255,.24) !important;
  color:rgba(220,236,255,.74) !important;
}
.searchPortalTopicBadgeIcon{
  position:relative !important;
  flex:0 0 auto !important;
  width:12px !important;
  height:12px !important;
  display:inline-block !important;
}
.searchPortalTopicBadgeIcon--posts::before,
.searchPortalTopicBadgeIcon--posts::after{
  content:"" !important;
  position:absolute !important;
  border-radius:3px !important;
  border:1.5px solid currentColor !important;
  background:rgba(255,255,255,.06) !important;
}
.searchPortalTopicBadgeIcon--posts::before{
  width:8px !important;
  height:7px !important;
  left:1px !important;
  top:3px !important;
}
.searchPortalTopicBadgeIcon--posts::after{
  width:8px !important;
  height:7px !important;
  left:4px !important;
  top:1px !important;
  opacity:.7 !important;
}
.searchPortalTopicBadgeIcon--date::before{
  content:"" !important;
  position:absolute !important;
  inset:1px !important;
  border-radius:999px !important;
  border:1.5px solid currentColor !important;
}
.searchPortalTopicBadgeIcon--date::after{
  content:"" !important;
  position:absolute !important;
  left:6px !important;
  top:3px !important;
  width:4px !important;
  height:5px !important;
  border-left:1.5px solid currentColor !important;
  border-bottom:1.5px solid currentColor !important;
  transform-origin:left bottom !important;
  transform:rotate(-8deg) !important;
}
.searchPortalTopicBadgeValue{
  flex:0 0 auto !important;
  font-weight:950 !important;
  color:#ffd36a !important;
}
.searchPortalTopicBadgeLabel,
.searchPortalTopicBadgeText{
  min-width:0 !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
}
.searchPortalTopicBadgeText{
  max-width:18ch !important;
}
.searchPortalTopicCount{
  display:none !important;
}
@media (max-width: 560px){
  .profilePop.searchPortalPop{ --ql7-search-preview-size:104px; }
  .searchPortalPostCard.searchPortalCardNoMedia,
  .searchPortalCardNoMedia.searchPortalPostCard{
    min-height:calc(var(--ql7-search-preview-size) + 20px) !important;
  }
  .searchPortalCardNoMedia .searchPortalPostBody{
    min-height:var(--ql7-search-preview-size) !important;
  }
}
@media (max-width: 390px){
  .profilePop.searchPortalPop{ --ql7-search-preview-size:88px; }
  .searchPortalTopicBadgeText{ max-width:14ch !important; }
}
/* ql7-search-final-polish-v46:end */

/* QL7_GEO111_SORT_GEO_RAIL_STYLES_V1 */
.sortDrop{width:min(292px,calc(100vw - 28px));right:24px;gap:7px;}
.profilePop.sortPortalPop--disabled .sortPortalHead{opacity:.78;}
.profilePop.sortPortalPop--disabled .sortPortalBody{opacity:.48;filter:grayscale(.62) saturate(.55);pointer-events:none;}
.profilePop.sortPortalPop--disabled .sortGeoRail{border-color:rgba(154,169,185,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 0 14px rgba(120,150,180,.10);}
.profilePop.sortPortalPop--disabled .sortGeoRailPulse{background:#7e8b99;box-shadow:0 0 10px rgba(155,170,190,.32);}
.sortGeoRail{position:relative;display:flex;flex-direction:column;gap:8px;padding:10px;margin:0 0 3px;border-radius:14px;border:1px solid rgba(104,219,255,.22);background:radial-gradient(100% 120% at 0% 0%,rgba(103,214,255,.16),transparent 58%),linear-gradient(180deg,rgba(9,20,35,.82),rgba(6,10,18,.78));box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 0 18px rgba(70,170,255,.13);overflow:hidden;}
.sortGeoRail::before{content:"";position:absolute;left:12px;right:12px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(107,226,255,.72),rgba(255,222,94,.48),transparent);opacity:.88;}
.sortGeoRailHead{display:flex;align-items:center;gap:9px;min-width:0;}
.sortGeoRailOrb{width:26px;height:26px;flex:0 0 auto;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#8ff1ff 24%,#236cff 58%,rgba(35,108,255,.18) 72%),#123;box-shadow:0 0 18px rgba(100,218,255,.38),inset 0 0 10px rgba(255,255,255,.34);}
.sortGeoRailCopy{min-width:0;display:flex;flex-direction:column;gap:2px;}
.sortGeoRailTitle{color:#f8fbff;font-size:.78rem;font-weight:950;letter-spacing:.02em;}
.sortGeoRailSub{color:rgba(217,241,255,.72);font-size:.68rem;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:205px;}
.sortGeoRailPulse{margin-left:auto;width:8px;height:8px;border-radius:50%;background:#ffe66d;box-shadow:0 0 14px rgba(255,230,109,.72);}
.sortGeoRailBtns{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.sortGeoRailBtn{min-width:0;min-height:48px;border:1px solid rgba(132,204,255,.20);border-radius:12px;background:rgba(6,14,25,.58);color:rgba(231,245,255,.82);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;padding:8px 9px;cursor:pointer;text-align:left;transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .12s ease;}
.sortGeoRailBtn:hover,.sortGeoRailBtn:focus-visible{border-color:rgba(140,222,255,.45);box-shadow:0 0 15px rgba(75,184,255,.16),inset 0 0 12px rgba(94,205,255,.08);}
.sortGeoRailBtn:active{transform:scale(.985);}
.sortGeoRailBtn--active{color:#fff6bf;border-color:rgba(255,225,105,.66);background:linear-gradient(180deg,rgba(255,223,95,.18),rgba(80,170,255,.11));box-shadow:0 0 18px rgba(255,223,95,.18),inset 0 0 14px rgba(255,223,95,.10);}
.sortGeoRailBtn--disabled{cursor:not-allowed !important;opacity:.42;filter:grayscale(.72) saturate(.42);box-shadow:none;}
.sortGeoRailBtnMain{font-size:.72rem;font-weight:950;line-height:1.05;}
.sortGeoRailBtnMeta{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.61rem;font-weight:800;color:rgba(220,240,255,.63);}
.sortGeoRailBtn--active .sortGeoRailBtnMeta{color:rgba(255,248,198,.76);}
.sortGeoRailBtn:disabled,.sortDropItem:disabled{cursor:wait;opacity:.62;}
.sortGeoRailBtn.sortGeoRailBtn--disabled:disabled{cursor:not-allowed !important;opacity:.42;filter:grayscale(.72) saturate(.42);box-shadow:none;}
.sortGeoApplyOverlay{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;gap:11px;background:linear-gradient(180deg,rgba(4,12,22,.86),rgba(6,13,24,.82));backdrop-filter:blur(7px);border-radius:inherit;}
.sortGeoApplySpinner{width:28px;height:28px;border-radius:50%;border:2px solid rgba(125,226,255,.24);border-top-color:#79f2ff;border-right-color:#ffe375;box-shadow:0 0 18px rgba(95,218,255,.28);animation:ql7SortGeoSpinV1 .82s linear infinite;}
.sortGeoApplyBrand{width:116px;height:30px;overflow:visible;filter:drop-shadow(0 0 10px rgba(108,232,255,.42));}
.sortGeoApplyBrand text{fill:#f9fdff;font-size:24px;font-weight:900;letter-spacing:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
@keyframes ql7SortGeoSpinV1{to{transform:rotate(360deg);}}
@media (max-width:560px){.sortDrop{right:12px;top:62px;}}

/* ql7-geo111-search-topic-card-height-v1:start */
.searchPortalResults{
  align-items:stretch !important;
}
.searchPortalResults > .searchPortalTopicCard,
.searchPortalResultCard.searchPortalTopicCard{
  flex:0 0 auto !important;
  min-height:142px !important;
  height:auto !important;
  padding:14px 12px 14px !important;
  align-items:stretch !important;
  overflow:visible !important;
}
.searchPortalResults > .searchPortalTopicCard .searchPortalTopicBody,
.searchPortalResultCard.searchPortalTopicCard .searchPortalTopicBody{
  min-height:112px !important;
  height:auto !important;
  justify-content:flex-start !important;
  gap:7px !important;
  overflow:visible !important;
  align-self:stretch !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalAuthorLine{
  flex:0 0 auto !important;
  min-height:30px !important;
  padding-top:1px !important;
  align-items:center !important;
  overflow:visible !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalAuthor,
.searchPortalResultCard.searchPortalTopicCard .searchPortalAuthor--small{
  overflow:visible !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalAuthor--small .searchPortalAuthorAvatar{
  width:28px !important;
  height:28px !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalTopicTitle{
  flex:0 0 auto !important;
  line-height:1.28 !important;
  min-height:19px !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalTopicText{
  flex:0 0 auto !important;
  line-height:1.34 !important;
  -webkit-line-clamp:2 !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalTopicFoot{
  flex:0 0 auto !important;
  min-height:26px !important;
  margin-top:4px !important;
  padding-bottom:1px !important;
  align-items:center !important;
  flex-wrap:wrap !important;
  row-gap:4px !important;
  overflow:visible !important;
}
.searchPortalResultCard.searchPortalTopicCard .searchPortalTopicBadge{
  flex:0 0 auto !important;
  min-height:23px !important;
  height:23px !important;
  line-height:1 !important;
}
@media (max-width:560px){
  .searchPortalResults > .searchPortalTopicCard,
  .searchPortalResultCard.searchPortalTopicCard{
    min-height:136px !important;
    padding:13px 11px 13px !important;
  }
  .searchPortalResults > .searchPortalTopicCard .searchPortalTopicBody,
  .searchPortalResultCard.searchPortalTopicCard .searchPortalTopicBody{
    min-height:106px !important;
  }
}
@media (max-width:390px){
  .searchPortalResults > .searchPortalTopicCard,
  .searchPortalResultCard.searchPortalTopicCard{
    min-height:130px !important;
    padding:12px 10px 12px !important;
  }
  .searchPortalResults > .searchPortalTopicCard .searchPortalTopicBody,
  .searchPortalResultCard.searchPortalTopicCard .searchPortalTopicBody{
    min-height:100px !important;
  }
}
/* ql7-geo111-search-topic-card-height-v1:end */

/* ql7-sort-global-portal-v1:start */
.sortPortalOverlay{
  z-index:2147482850 !important;
  align-items:center !important;
  justify-content:center !important;
  padding:clamp(12px,3vw,28px) !important;
  background:radial-gradient(circle at 50% 20%,rgba(76,174,255,.12),rgba(0,0,0,.58) 56%,rgba(0,0,0,.72)) !important;
  backdrop-filter:blur(8px) saturate(142%) !important;
}
.profilePop.sortPortalPop{
  width:min(368px,calc(100vw - 28px)) !important;
  max-width:min(368px,calc(100vw - 28px)) !important;
  max-height:min(76vh,660px) !important;
  overflow:auto !important;
  padding:12px !important;
  border-radius:18px !important;
  border:1px solid rgba(114,184,255,.28) !important;
  background:
    radial-gradient(125% 120% at 18% 0%,rgba(84,190,255,.18),transparent 58%),
    radial-gradient(120% 120% at 82% 0%,rgba(255,218,84,.10),transparent 52%),
    linear-gradient(155deg,rgba(8,14,24,.98),rgba(7,12,20,.96)) !important;
  box-shadow:0 24px 68px rgba(0,0,0,.64),0 0 38px rgba(65,177,255,.16),inset 0 0 0 1px rgba(255,255,255,.05) !important;
  backdrop-filter:blur(18px) saturate(150%) !important;
}
.sortPortalHead{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:space-between;
  min-height:82px;
  gap:10px;
  padding:2px 42px 10px 8px;
  margin:-2px 0 9px;
  border-bottom:1px solid rgba(125,202,255,.14);
  overflow:hidden;
  isolation:isolate;
}
.sortPortalHead--floatingSort::before{
  content:"";
  position:absolute;
  left:10px;right:42px;bottom:7px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(130,231,255,.54),rgba(255,217,92,.42),transparent);
  opacity:.8;
  pointer-events:none;
}
.sortPortalBladeBrand{
  position:relative;
  z-index:1;
  display:block;
  flex:1 1 auto;
  min-width:0;
  margin-left:0;
  margin-right:0;
  overflow:hidden;
  pointer-events:none;
  border-radius:14px;
}
.sortPortalBrandSvg{
  display:block;
  width:100%;
  height:78px;
  overflow:hidden;
  contain:layout style;
}
.sortBrandGeoConstellation path{
  fill:none;
  stroke:rgba(104,219,255,.30);
  stroke-width:1.05;
  stroke-linecap:round;
  stroke-dasharray:7 13;
  animation:ql7SortConstellationFlowV3B 5.4s linear infinite;
}
.sortBrandGeoConstellation circle{
  fill:#79ebff;
  opacity:.68;
  animation:ql7SortStarPulseV3B 3.2s ease-in-out infinite;
}
.sortBrandText{
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-weight:1000;
  letter-spacing:.035em;
  paint-order:stroke;
  stroke:rgba(4,9,18,.88);
  stroke-width:3.2px;
  stroke-linejoin:round;
}
.sortBrandText--quantum{
  font-size:23px;
  fill:#f8fcff;
  text-shadow:0 0 12px rgba(117,231,255,.34),0 0 2px rgba(255,255,255,.7);
}
.sortBrandText--geodetect{
  font-size:22px;
  fill:#70e7ff;
  text-shadow:0 0 12px rgba(112,231,255,.36),0 0 18px rgba(255,211,91,.14);
}
.sortBrandSortFloat{
  transform-box:fill-box;
  transform-origin:center;
  animation:ql7SortFloatWordV3B 4.8s ease-in-out infinite;
}
.sortBrandSortWord{
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-weight:1000;
  font-size:30px;
  letter-spacing:.11em;
  fill:#d7a839;
  paint-order:stroke;
  stroke:rgba(7,11,19,.96);
  stroke-width:4px;
  stroke-linejoin:round;
  text-shadow:0 0 13px rgba(215,168,57,.42),0 0 18px rgba(104,231,255,.13);
  animation:ql7SortGoldBreathV3B 3.2s ease-in-out infinite;
}
.sortBrandSortWord--aura{
  fill:rgba(255,230,139,.42);
  stroke:rgba(255,218,88,.08);
  stroke-width:8px;
  opacity:.42;
}
.sortBrandSortOrbit{
  fill:#e8c56b;
  opacity:.54;
  transform-box:fill-box;
  transform-origin:center;
  animation:ql7SortOrbitDustV3B 4.8s ease-in-out infinite;
}
.sortBrandSortOrbit--b{animation-delay:.34s;fill:#8ff2ff;opacity:.42;}
.sortBrandSortOrbit--c{animation-delay:.68s;}
.sortBrandSortOrbit--d{animation-delay:1.02s;fill:#8ff2ff;opacity:.38;}
.sortPortalClose{
  position:absolute;
  top:9px;right:6px;
  z-index:4;
  width:36px;height:36px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;
  border:1px solid rgba(152,225,255,.42);background:linear-gradient(180deg,rgba(22,42,65,.94),rgba(8,14,24,.86));
  color:#fff;cursor:pointer;box-shadow:0 0 18px rgba(77,181,255,.18),0 0 12px rgba(255,219,104,.10),inset 0 0 0 1px rgba(255,255,255,.08);
  transition:transform .12s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease;
}
.sortPortalClose--visibleX{color:#fff !important;}
.sortPortalClose:hover,.sortPortalClose:focus-visible{border-color:rgba(255,225,112,.78);box-shadow:0 0 24px rgba(255,222,105,.26),0 0 18px rgba(77,181,255,.18),inset 0 0 14px rgba(255,222,105,.09);outline:none;}
.sortPortalClose:active{transform:scale(.96);}
.sortPortalCloseSvg{width:22px;height:22px;display:block;overflow:visible;}
.sortPortalCloseSvgGlow{fill:none;stroke:#6eeeff;stroke-width:5.4;stroke-linecap:round;opacity:.34;}
.sortPortalCloseSvgCore{fill:none;stroke:#fff;stroke-width:2.7;stroke-linecap:round;opacity:1;}
.profilePop.sortPortalPop .sortDrop,.profilePop.sortPortalPop .sortPortalBody{
  position:relative !important;top:auto !important;right:auto !important;width:100% !important;max-width:100% !important;z-index:auto !important;
  display:flex !important;flex-direction:column !important;gap:7px !important;padding:0 !important;margin:0 !important;border:0 !important;border-radius:0 !important;
  background:transparent !important;box-shadow:none !important;backdrop-filter:none !important;
}
.profilePop.sortPortalPop .sortGeoRail{margin:0 0 2px !important;}
.sortGeoBladeDivider{
  display:grid;
  gap:4px;
  padding:2px 3px 4px;
  margin:0 0 1px;
  pointer-events:none;
}
.sortGeoBladeDivider span{
  display:block;
  height:1px;
  border-radius:999px;
  background:linear-gradient(90deg,transparent,rgba(99,235,255,.54),rgba(255,216,96,.38),transparent);
  box-shadow:0 0 10px rgba(99,235,255,.14);
}
.sortGeoBladeDivider span + span{opacity:.48;transform:scaleX(.72);}
.profilePop.sortPortalPop .sortGeoRailPulse--geo{background:#4dff9a !important;box-shadow:0 0 14px rgba(77,255,154,.82),0 0 28px rgba(77,255,154,.34) !important;animation:ql7SortGeoPulseV1 1.28s ease-in-out infinite;}
.profilePop.sortPortalPop .sortGeoRailPulse--world{background:#ff4d4d !important;box-shadow:0 0 13px rgba(255,77,77,.72),0 0 24px rgba(255,77,77,.18) !important;animation:none !important;}
@keyframes ql7SortGeoPulseV1{0%,100%{transform:scale(.82);opacity:.72;}45%{transform:scale(1.34);opacity:1;}70%{transform:scale(1.02);opacity:.9;}}
@keyframes ql7SortConstellationFlowV3B{0%{stroke-dashoffset:0;opacity:.24;}50%{opacity:.58;}100%{stroke-dashoffset:-38;opacity:.24;}}
@keyframes ql7SortStarPulseV3B{0%,100%{opacity:.40;transform:scale(.88);}45%{opacity:.9;transform:scale(1.16);}70%{opacity:.58;transform:scale(.98);}}
@keyframes ql7SortFloatWordV3B{
  0%,100%{opacity:.94;transform:translate(0,0) scale(.99);}
  22%{opacity:1;transform:translate(4px,-3px) scale(1.035);}
  48%{opacity:.98;transform:translate(1px,3px) scale(1.005);}
  72%{opacity:1;transform:translate(-4px,-1px) scale(1.045);}
}
@keyframes ql7SortGoldBreathV3B{0%,100%{fill:#d1a137;}45%{fill:#ffe18a;}72%{fill:#c8952e;}}
@keyframes ql7SortOrbitDustV3B{0%,100%{opacity:.34;transform:translate(0,0) scale(.86);}35%{opacity:.72;transform:translate(3px,-4px) scale(1.12);}68%{opacity:.46;transform:translate(-3px,3px) scale(.94);}}
@media (prefers-reduced-motion:reduce){.sortBrandGeoConstellation path,.sortBrandGeoConstellation circle,.sortBrandSortFloat,.sortBrandSortWord,.sortBrandSortOrbit,.profilePop.sortPortalPop .sortGeoRailPulse--geo{animation:none !important;opacity:1;transform:none;}}
@media (max-width:820px){.profilePop.sortPortalPop{width:min(368px,calc(100vw - 24px)) !important;max-width:min(368px,calc(100vw - 24px)) !important;max-height:min(78vh,640px) !important;}.sortPortalHead{min-height:78px;padding-right:40px;}.sortPortalBrandSvg{height:74px;}}
@media (max-width:560px){.sortPortalOverlay{padding:12px !important;align-items:center !important;}.profilePop.sortPortalPop{width:min(358px,calc(100vw - 20px)) !important;max-width:min(358px,calc(100vw - 20px)) !important;max-height:min(82vh,620px) !important;padding:11px !important;border-radius:17px !important;}.sortPortalHead{min-height:74px;padding:0 38px 9px 6px;margin-bottom:7px;}.sortPortalBrandSvg{height:70px;}.sortPortalClose{width:33px;height:33px;border-radius:11px;top:8px;right:5px;}.sortBrandSortWord{font-size:27px;}}
@media (max-width:380px){.profilePop.sortPortalPop{width:calc(100vw - 16px) !important;max-width:calc(100vw - 16px) !important;}.profilePop.sortPortalPop .sortGeoRailBtns{grid-template-columns:1fr;}.profilePop.sortPortalPop .sortGeoRailSub{max-width:190px;}.sortBrandSortWord{font-size:24px;}.sortPortalHead{padding-right:36px;}}
/* ql7-sort-global-portal-v1:end */

.threadOpeningLoader{
  position:relative;
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
  isolation:isolate;
}
.threadOpeningLoader::before{
  content:"";
  position:absolute;
  width:min(94px,21vw);
  height:48px;
  border-radius:999px;
  background:
    linear-gradient(90deg,rgba(80,167,255,0),rgba(80,205,255,.12),rgba(255,211,106,.10),rgba(80,167,255,0)),
    radial-gradient(ellipse at 50% 50%,rgba(10,16,26,.62),rgba(10,16,26,0) 70%);
  border:1px solid rgba(255,255,255,.055);
  box-shadow:
    0 0 28px rgba(25,129,255,.12),
    inset 0 0 18px rgba(25,129,255,.045);
  opacity:.92;
  z-index:-1;
}
.threadOpeningLoader--center{
  min-height:min(54vh,560px);
  padding:34px 0;
}
.threadOpeningLoader--inline{
  min-height:96px;
  padding:12px 0 18px;
}
.threadOpeningSpinner{
  position:relative;
  width:44px;
  height:44px;
  border-radius:50%;
  background:
    radial-gradient(circle at 50% 50%,rgba(255,255,255,.88) 0 2px,rgba(80,205,255,.70) 3px 7px,transparent 8px),
    radial-gradient(circle at 50% 50%,rgba(10,16,26,.96) 0 29%,transparent 30%),
    conic-gradient(from 0deg,transparent 0 8%,rgba(80,205,255,.94) 12% 18%,transparent 23% 35%,rgba(255,211,106,.88) 41% 48%,transparent 53% 69%,rgba(125,252,255,.74) 74% 83%,transparent 89% 100%),
    radial-gradient(circle at 50% 50%,rgba(80,167,255,.18) 0 42%,rgba(255,211,106,.12) 43% 57%,transparent 58%);
  border:1px solid rgba(255,255,255,.16);
  box-shadow:
    0 0 22px rgba(80,205,255,.34),
    0 0 38px rgba(255,211,106,.14),
    0 16px 34px rgba(0,0,0,.36),
    inset 0 0 0 1px rgba(255,255,255,.055),
    inset 0 0 18px rgba(80,167,255,.12);
  animation:ql7ThreadSpinnerSpinV1 1.28s cubic-bezier(.55,.08,.35,.92) infinite;
  isolation:isolate;
}
.threadOpeningSpinner::before,
.threadOpeningSpinner::after{
  content:"";
  position:absolute;
  inset:6px;
  border-radius:50%;
  z-index:1;
  background:
    linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,0) 42%),
    radial-gradient(circle at 50% 50%,rgba(8,13,20,.98) 0 47%,rgba(12,25,39,.84) 48% 62%,transparent 63%);
  border:1px solid rgba(255,255,255,.12);
  box-shadow:
    inset 0 0 18px rgba(80,167,255,.12),
    inset 0 0 12px rgba(255,211,106,.07),
    0 0 16px rgba(80,205,255,.10);
}
.threadOpeningSpinner::after{
  inset:12px;
  z-index:2;
  background:
    conic-gradient(from 120deg,rgba(255,211,106,.92),transparent 22%,rgba(80,205,255,.84) 44%,transparent 64%,rgba(255,255,255,.64) 82%,rgba(255,211,106,.92)),
    radial-gradient(circle at 50% 50%,rgba(8,13,20,.98) 0 45%,transparent 47%);
  border:1px solid rgba(255,211,106,.42);
  box-shadow:
    0 0 14px rgba(255,211,106,.22),
    inset 0 0 12px rgba(80,205,255,.14);
  animation:ql7ThreadSpinnerReverseV1 .94s linear infinite;
}
.threadOpeningSpinner span{
  position:absolute;
  left:50%;
  top:50%;
  z-index:3;
  width:4px;
  height:4px;
  border-radius:50%;
  background:rgb(125,252,255);
  box-shadow:0 0 10px rgba(125,252,255,.72),0 0 18px rgba(255,211,106,.24);
  transform-origin:0 0;
  animation:ql7ThreadSpinnerNodePulseV1 1.28s ease-in-out infinite;
}
.threadOpeningSpinner span:nth-child(1){transform:rotate(20deg) translateX(19.5px);}
.threadOpeningSpinner span:nth-child(2){transform:rotate(151deg) translateX(19.5px);background:#ffd36a;animation-delay:.18s;}
.threadOpeningSpinner span:nth-child(3){transform:rotate(275deg) translateX(19.5px);animation-delay:.36s;}
@keyframes ql7ThreadSpinnerSpinV1{to{transform:rotate(360deg);}}
@keyframes ql7ThreadSpinnerReverseV1{to{transform:rotate(-360deg);}}
@keyframes ql7ThreadSpinnerNodePulseV1{0%,100%{opacity:.64;filter:brightness(.92);}44%{opacity:1;filter:brightness(1.35);}}
@media (prefers-reduced-motion:reduce){.threadOpeningSpinner,.threadOpeningSpinner::after,.threadOpeningSpinner span{animation:none !important;}}

/* ql7-load-more-premium-spinner-v1:start */
.loadMoreFooter{
  position:relative;
  width:100%;
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  min-height:64px;
  padding:8px 0 10px;
  opacity:1;
  text-align:center;
  isolation:isolate;
}
.loadMoreFooter::before{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:min(94px,21vw);
  height:48px;
  transform:translate(-50%,-50%);
  border-radius:999px;
  pointer-events:none;
  z-index:0;
  background:
    linear-gradient(90deg,rgba(80,167,255,0),rgba(80,205,255,.12),rgba(255,211,106,.10),rgba(80,167,255,0)),
    radial-gradient(ellipse at 50% 50%,rgba(10,16,26,.62),rgba(10,16,26,0) 70%);
  border:1px solid rgba(255,255,255,.055);
  box-shadow:
    0 0 28px rgba(25,129,255,.12),
    inset 0 0 18px rgba(25,129,255,.045);
  opacity:.92;
}
.dmLoadMoreFooter{
  min-height:64px;
}
.loadMoreShimmer{
  position:absolute !important;
  z-index:1;
  display:block !important;
  flex:0 0 44px !important;
  align-self:center !important;
  justify-self:center !important;
  left:50% !important;
  top:50% !important;
  translate:-50% -50%;
  transform:none !important;
  width:44px !important;
  height:44px !important;
  min-width:44px !important;
  min-height:44px !important;
  margin:0 auto !important;
  padding:0 !important;
  overflow:visible !important;
  border-radius:50% !important;
  color:transparent !important;
  font-size:0 !important;
  line-height:0 !important;
  text-align:center !important;
  text-indent:0 !important;
  white-space:nowrap;
  background:
    radial-gradient(circle at 50% 50%,rgba(255,255,255,.88) 0 2px,rgba(80,205,255,.70) 3px 7px,transparent 8px),
    radial-gradient(circle at 50% 50%,rgba(10,16,26,.96) 0 29%,transparent 30%),
    conic-gradient(from 0deg,transparent 0 8%,rgba(80,205,255,.94) 12% 18%,transparent 23% 35%,rgba(255,211,106,.88) 41% 48%,transparent 53% 69%,rgba(125,252,255,.74) 74% 83%,transparent 89% 100%),
    radial-gradient(circle at 50% 50%,rgba(80,167,255,.18) 0 42%,rgba(255,211,106,.12) 43% 57%,transparent 58%) !important;
  border:1px solid rgba(255,255,255,.16) !important;
  box-shadow:
    0 0 22px rgba(80,205,255,.34),
    0 0 38px rgba(255,211,106,.14),
    0 16px 34px rgba(0,0,0,.36),
    inset 0 0 0 1px rgba(255,255,255,.055),
    inset 0 0 18px rgba(80,167,255,.12) !important;
  animation:ql7LoadMoreSpinnerSpinV1 1.28s cubic-bezier(.55,.08,.35,.92) infinite !important;
  isolation:isolate;
}
.loadMoreShimmer::before,
.loadMoreShimmer::after{
  content:"" !important;
  position:absolute !important;
  border-radius:50% !important;
  pointer-events:none;
}
.loadMoreShimmer::before{
  inset:6px !important;
  z-index:1;
  background:
    linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,0) 42%),
    radial-gradient(circle at 50% 50%,rgba(8,13,20,.98) 0 47%,rgba(12,25,39,.84) 48% 62%,transparent 63%) !important;
  border:1px solid rgba(255,255,255,.12) !important;
  box-shadow:
    inset 0 0 18px rgba(80,167,255,.12),
    inset 0 0 12px rgba(255,211,106,.07),
    0 0 16px rgba(80,205,255,.10) !important;
  animation:none !important;
}
.loadMoreShimmer::after{
  inset:12px !important;
  z-index:2;
  background:
    conic-gradient(from 120deg,rgba(255,211,106,.92),transparent 22%,rgba(80,205,255,.84) 44%,transparent 64%,rgba(255,255,255,.64) 82%,rgba(255,211,106,.92)),
    radial-gradient(circle at 50% 50%,rgba(8,13,20,.98) 0 45%,transparent 47%) !important;
  border:1px solid rgba(255,211,106,.42) !important;
  box-shadow:
    0 0 14px rgba(255,211,106,.22),
    inset 0 0 12px rgba(80,205,255,.14) !important;
  animation:ql7LoadMoreSpinnerReverseV1 .94s linear infinite !important;
}
@keyframes ql7LoadMoreSpinnerSpinV1{to{rotate:360deg;}}
@keyframes ql7LoadMoreSpinnerReverseV1{to{rotate:-360deg;}}
@media (prefers-reduced-motion:reduce){
  .loadMoreShimmer,
  .loadMoreShimmer::after{
    animation:none !important;
  }
}
/* ql7-load-more-premium-spinner-v1:end */

/* ql7-forum-search-geodetect-control-v4-clean:start */
.searchInputWrap{
  isolation:isolate;
}
.searchInput{
  padding-right:3rem !important;
}
.forumSearchInputAction{
  position:absolute;
  top:50%;
  right:4px;
  z-index:2;
  width:32px;
  height:32px;
  padding:0;
  border:0;
  border-radius:10px;
  display:grid;
  place-items:center;
  color:rgba(210,232,249,.74);
  background:transparent;
  box-shadow:none;
  outline:none;
  cursor:pointer;
  transform:translateY(-50%);
  -webkit-tap-highlight-color:transparent;
  transition:color .18s ease, filter .18s ease, transform .12s ease;
}
.forumSearchInputAction:hover,
.forumSearchInputAction:focus-visible,
.forumSearchInputAction--active{
  color:#e9f9ff;
  filter:drop-shadow(0 0 7px rgba(105,220,255,.44));
}
.forumSearchInputAction:focus-visible{
  outline:1px solid rgba(117,221,255,.72);
  outline-offset:-3px;
}
.forumSearchInputAction:active{
  transform:translateY(-50%) scale(.94);
}
.forumSearchInputAction .forumCtlFx{
  display:block;
  width:20px;
  height:20px;
  color:currentColor;
}
.forumGeoDetectControlBtn{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  flex:0 0 auto;
  width:100px;
  height:50px;
  min-width:100px;
  padding:0;
  border:0;
  border-radius:13px;
  display:grid;
  place-items:center;
  color:#f4fbff;
  background:
    linear-gradient(90deg,rgba(103,232,249,.055) 1px,transparent 1px),
    linear-gradient(0deg,rgba(103,232,249,.045) 1px,transparent 1px),
    radial-gradient(circle at 16% 24%,rgba(34,211,238,.22),transparent 40%),
    radial-gradient(circle at 88% 76%,rgba(107,153,255,.18),transparent 43%),
    linear-gradient(135deg,rgba(2,8,20,.97),rgba(6,19,39,.95) 56%,rgba(4,12,25,.98));
  background-size:auto,9px 9px,auto,auto,auto;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.045),
    inset 0 0 16px rgba(87,190,255,.07),
    0 8px 22px rgba(0,0,0,.24),
    0 0 20px rgba(34,211,238,.16);
  cursor:pointer;
  -webkit-user-select:none;
  user-select:none;
  -webkit-tap-highlight-color:transparent;
  transition:transform .14s ease,border-color .2s ease,box-shadow .2s ease,filter .2s ease;
}
.forumGeoDetectControlBtn::before{
  content:"";
  position:absolute;
  inset:1px;
  z-index:-1;
  border-radius:inherit;
  pointer-events:none;
  background:linear-gradient(110deg,transparent 0%,rgba(103,232,249,.16) 43%,rgba(255,255,255,.08) 50%,transparent 62%);
  transform:translateX(-135%);
  opacity:0;
  animation:ql7GeoDetectButtonSweep 6.4s ease-in-out infinite;
}
.forumGeoDetectControlBtn:hover{
  transform:translateY(-1px);
  border-color:rgba(125,232,255,.72);
  filter:brightness(1.08) saturate(1.08);
  box-shadow:
    inset 0 0 0 1px rgba(103,232,249,.16),
    inset 0 0 18px rgba(87,190,255,.10),
    0 10px 26px rgba(0,0,0,.3),
    0 0 27px rgba(34,211,238,.26);
}
.forumGeoDetectControlBtn:active{
  transform:translateY(0) scale(.985);
}
.forumGeoDetectControlBtn:focus-visible{
  outline:none;
  box-shadow:
    0 0 0 2px rgba(2,10,24,.96),
    0 0 0 4px rgba(103,232,249,.72),
    0 0 28px rgba(92,171,255,.30);
}
.forumGeoDetectControlBtn--active{
  border-color:rgba(147,235,255,.86);
  box-shadow:
    inset 0 0 0 1px rgba(103,232,249,.22),
    inset 0 0 20px rgba(87,190,255,.13),
    0 0 25px rgba(34,211,238,.34),
    0 0 38px rgba(103,145,255,.14);
}
.forumGeoDetectControlSvg{
  display:block;
  width:100%;
  height:100%;
  overflow:visible;
}
.forumGeoDetectPlate{
  stroke:rgba(103,232,249,.30);
  stroke-width:1;
  animation:ql7GeoDetectPlateBreathe 6.4s ease-in-out infinite;
}
.forumGeoDetectCircuit,
.forumGeoDetectScanner,
.forumGeoDetectComet,
.forumGeoDetectShard{
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.forumGeoDetectCircuit{
  stroke:#6ee7ff;
  stroke-width:.9;
  stroke-dasharray:14 10;
  opacity:.42;
  animation:ql7GeoDetectCircuitFlow 6.4s linear infinite;
}
.forumGeoDetectCircuit--bottom{
  stroke:#9ebfff;
  opacity:.34;
  animation-direction:reverse;
}
.forumGeoDetectNode{
  fill:#eaffff;
  filter:url(#forum-geodetect-glow);
  transform-box:fill-box;
  transform-origin:center;
  animation:ql7GeoDetectNodePulse 6.4s ease-in-out infinite;
}
.forumGeoDetectNode--b{
  animation-delay:3.2s;
}
.forumGeoDetectGeoWord,
.forumGeoDetectDetectWord,
.forumGeoDetectFragments{
  transform-box:fill-box;
  transform-origin:center;
}
.forumGeoDetectGeoLetter,
.forumGeoDetectDetectWord text{
  font-family:var(--font-display,var(--font-sans,system-ui,sans-serif));
  font-weight:950;
  paint-order:stroke fill;
  stroke:rgba(0,8,18,.96);
  stroke-width:2px;
  text-transform:none;
}
.forumGeoDetectGeoLetter{
  fill:url(#forum-geodetect-geo);
  font-size:18px;
  letter-spacing:0;
  opacity:0;
  transform-box:fill-box;
  transform-origin:center;
}
.forumGeoDetectGeoLetter--g{
  --ql7-geo-arrive-x:48px;
  --ql7-geo-burst-x:-16px;
  --ql7-geo-burst-y:-7px;
  animation:ql7GeoDetectLetterG 6.4s cubic-bezier(.2,.78,.22,1) infinite;
}
.forumGeoDetectGeoLetter--e{
  --ql7-geo-arrive-x:39px;
  --ql7-geo-burst-x:2px;
  --ql7-geo-burst-y:12px;
  animation:ql7GeoDetectLetterE 6.4s cubic-bezier(.2,.78,.22,1) infinite;
}
.forumGeoDetectGeoLetter--o{
  --ql7-geo-arrive-x:30px;
  --ql7-geo-burst-x:18px;
  --ql7-geo-burst-y:-6px;
  animation:ql7GeoDetectLetterO 6.4s cubic-bezier(.2,.78,.22,1) infinite;
}
.forumGeoDetectDetectWord{
  opacity:0;
  animation:ql7GeoDetectDetectCycle 6.4s cubic-bezier(.2,.75,.24,1) infinite;
}
.forumGeoDetectDetectWord text{
  fill:url(#forum-geodetect-detect);
  font-size:15.6px;
  letter-spacing:.025em;
}
.forumGeoDetectScanner{
  stroke:#ecfeff;
  stroke-width:1.1;
  stroke-dasharray:9 92;
  opacity:.82;
  filter:url(#forum-geodetect-glow);
  animation:ql7GeoDetectScannerRun 6.4s ease-in-out infinite;
}
.forumGeoDetectShard{
  --ql7-shard-x:0px;
  --ql7-shard-y:0px;
  opacity:0;
  stroke:#eaffff;
  fill:#eaffff;
  stroke-width:1.25;
  transform-box:fill-box;
  transform-origin:center;
  animation:ql7GeoDetectShardBurst 6.4s ease-in-out infinite;
}
.forumGeoDetectShard--1{--ql7-shard-x:-28px;--ql7-shard-y:-10px;fill:#ffffff;}
.forumGeoDetectShard--2{--ql7-shard-x:-20px;--ql7-shard-y:11px;fill:#73e8ff;}
.forumGeoDetectShard--3{--ql7-shard-x:-7px;--ql7-shard-y:-15px;fill:#c8f7ff;}
.forumGeoDetectShard--4{--ql7-shard-x:8px;--ql7-shard-y:14px;fill:#ffffff;}
.forumGeoDetectShard--5{--ql7-shard-x:21px;--ql7-shard-y:-10px;fill:#75d8ff;}
.forumGeoDetectShard--6{--ql7-shard-x:29px;--ql7-shard-y:9px;fill:#a8bdff;}
.forumGeoDetectShard--7{--ql7-shard-x:-33px;--ql7-shard-y:1px;stroke:#73e8ff;}
.forumGeoDetectShard--8{--ql7-shard-x:34px;--ql7-shard-y:-1px;stroke:#a8bdff;}
.forumGeoDetectShard--2,
.forumGeoDetectShard--5{animation-delay:.035s;}
.forumGeoDetectShard--3,
.forumGeoDetectShard--6{animation-delay:.07s;}
.forumGeoDetectShard--7,
.forumGeoDetectShard--8{animation-delay:.105s;}
.forumGeoDetectComet{
  stroke:#dffbff;
  stroke-width:1;
  stroke-dasharray:12 88;
  opacity:.78;
  filter:url(#forum-geodetect-glow);
  animation:ql7GeoDetectCometRun 6.4s ease-in-out infinite;
}
@keyframes ql7GeoDetectLetterG{
  0%,5%{opacity:0;transform:translateX(var(--ql7-geo-arrive-x)) scale(.72);}
  12%,48%{opacity:1;transform:translateX(0) scale(1);}
  54%{opacity:1;transform:translateX(0) scale(1.04);}
  63%,100%{opacity:0;transform:translate(var(--ql7-geo-burst-x),var(--ql7-geo-burst-y)) scale(1.24);}
}
@keyframes ql7GeoDetectLetterE{
  0%,11%{opacity:0;transform:translateX(var(--ql7-geo-arrive-x)) scale(.72);}
  18%,48%{opacity:1;transform:translateX(0) scale(1);}
  54%{opacity:1;transform:translateX(0) scale(1.04);}
  63%,100%{opacity:0;transform:translate(var(--ql7-geo-burst-x),var(--ql7-geo-burst-y)) scale(1.24);}
}
@keyframes ql7GeoDetectLetterO{
  0%,17%{opacity:0;transform:translateX(var(--ql7-geo-arrive-x)) scale(.72);}
  24%,48%{opacity:1;transform:translateX(0) scale(1);}
  54%{opacity:1;transform:translateX(0) scale(1.04);}
  63%,100%{opacity:0;transform:translate(var(--ql7-geo-burst-x),var(--ql7-geo-burst-y)) scale(1.24);}
}
@keyframes ql7GeoDetectDetectCycle{
  0%,60%{opacity:0;transform:translateY(4px) scale(.9);}
  68%,92%{opacity:1;transform:translateY(0) scale(1);}
  100%{opacity:0;transform:translateY(-2px) scale(.98);}
}
@keyframes ql7GeoDetectShardBurst{
  0%,48%{opacity:0;transform:translate(0,0) scale(.5);}
  53%{opacity:1;transform:translate(0,0) scale(1);}
  66%,100%{opacity:0;transform:translate(var(--ql7-shard-x),var(--ql7-shard-y)) scale(1.22);}
}
@keyframes ql7GeoDetectCircuitFlow{
  0%{stroke-dashoffset:0;opacity:.26;}
  22%,82%{opacity:.64;}
  100%{stroke-dashoffset:-96;opacity:.26;}
}
@keyframes ql7GeoDetectPlateBreathe{
  0%,100%{stroke:rgba(103,232,249,.25);}
  46%{stroke:rgba(145,232,255,.48);}
  76%{stroke:rgba(126,162,255,.40);}
}
@keyframes ql7GeoDetectScannerRun{
  0%,6%{stroke-dashoffset:104;opacity:0;}
  14%,45%{opacity:.92;}
  54%{stroke-dashoffset:0;opacity:.12;}
  62%{stroke-dashoffset:104;opacity:0;}
  70%,92%{opacity:.82;}
  100%{stroke-dashoffset:-10;opacity:0;}
}
@keyframes ql7GeoDetectCometRun{
  0%,58%{stroke-dashoffset:92;opacity:0;}
  68%,90%{opacity:.9;}
  100%{stroke-dashoffset:-18;opacity:0;}
}
@keyframes ql7GeoDetectNodePulse{
  0%,100%{opacity:.34;transform:scale(.8);}
  45%,72%{opacity:1;transform:scale(1.34);}
}
@keyframes ql7GeoDetectButtonSweep{
  0%,28%{transform:translateX(-135%);opacity:0;}
  43%,58%{opacity:.82;}
  76%,100%{transform:translateX(135%);opacity:0;}
}
@media (max-width:560px){
  .forumGeoDetectControlBtn{
    width:74px;
    min-width:74px;
    height:40px;
    border-radius:12px;
  }
  .forumSearchInputAction{
    right:2px;
    width:32px;
    height:32px;
  }
}
@media (max-width:420px){
  .forumGeoDetectControlBtn{
    width:84px;
    min-width:84px;
  }
  .forumGeoDetectControlSvg{
    transform:scaleX(.9);
  }
}
@media (prefers-reduced-motion:reduce){
  .forumGeoDetectControlBtn::before,
  .forumGeoDetectPlate,
  .forumGeoDetectCircuit,
  .forumGeoDetectNode,
  .forumGeoDetectGeoLetter,
  .forumGeoDetectDetectWord,
  .forumGeoDetectShard,
  .forumGeoDetectScanner,
  .forumGeoDetectComet{
    animation:none !important;
  }
  .forumGeoDetectGeoWord{
    transform:translateX(-18px);
  }
  .forumGeoDetectGeoLetter{
    opacity:1;
    transform:none;
  }
  .forumGeoDetectDetectWord{
    opacity:1;
    transform:translateX(20px);
  }
  .forumGeoDetectShard{
    opacity:0;
  }
}

.forumSkeletonPane{
  min-height:min(760px,calc(100vh - 160px));
  display:grid;
  gap:14px;
  padding:8px 0 18px;
}
.forumSkeletonCard{
  position:relative;
  min-height:clamp(190px,30vw,310px);
  overflow:hidden;
  border:1px solid rgba(93,183,255,.26);
  border-radius:18px;
  background:
    linear-gradient(145deg,rgba(19,42,66,.70),rgba(4,12,24,.86)),
    radial-gradient(circle at 18% 12%,rgba(103,232,249,.13),transparent 34%),
    radial-gradient(circle at 92% 0%,rgba(250,204,21,.08),transparent 42%);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.035),
    0 14px 34px rgba(0,0,0,.26);
}
.forumSkeletonCard::before{
  content:"";
  position:absolute;
  inset:0;
  transform:translateX(-120%);
  background:linear-gradient(90deg,transparent,rgba(112,231,255,.16),rgba(255,231,128,.11),transparent);
  animation:forumSkeletonSweep 1.35s ease-in-out infinite;
}
.forumSkeletonHeader,
.forumSkeletonBody,
.forumSkeletonMetrics{
  position:relative;
  z-index:1;
}
.forumSkeletonHeader{
  display:flex;
  align-items:center;
  gap:12px;
  padding:18px 18px 0;
}
.forumSkeletonAvatar{
  width:58px;
  height:58px;
  flex:0 0 auto;
  border-radius:16px;
  background:
    radial-gradient(circle at 40% 28%,rgba(103,232,249,.26),transparent 54%),
    rgba(3,12,25,.68);
  border:1px solid rgba(125,211,252,.22);
}
.forumSkeletonTitle{
  width:min(260px,54%);
  height:24px;
  border-radius:999px;
  background:linear-gradient(90deg,rgba(125,211,252,.16),rgba(250,204,21,.12));
}
.forumSkeletonLine{
  height:16px;
  border-radius:999px;
  background:rgba(159,219,255,.12);
}
.forumSkeletonBody{
  display:grid;
  gap:10px;
  padding:18px;
}
.forumSkeletonBody .forumSkeletonLine:nth-child(1){width:86%;}
.forumSkeletonBody .forumSkeletonLine:nth-child(2){width:72%;}
.forumSkeletonMedia{
  height:clamp(110px,18vw,210px);
  border-radius:14px;
  background:
    linear-gradient(135deg,rgba(10,28,48,.80),rgba(3,9,19,.88)),
    radial-gradient(circle at 52% 46%,rgba(250,204,21,.12),transparent 42%);
  border:1px solid rgba(125,211,252,.16);
}
.forumSkeletonMetrics{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:8px;
  padding:0 18px 18px;
}
.forumSkeletonMetric{
  height:24px;
  border:1px solid rgba(125,211,252,.18);
  border-radius:999px;
  background:rgba(8,22,38,.56);
}
@keyframes forumSkeletonSweep{
  0%{transform:translateX(-120%);opacity:0;}
  18%,76%{opacity:1;}
  100%{transform:translateX(120%);opacity:0;}
}
@media (max-width:620px){
  .forumSkeletonPane{min-height:min(680px,calc(100vh - 120px));gap:12px;}
  .forumSkeletonCard{min-height:220px;border-radius:16px;}
  .forumSkeletonHeader{padding:14px 14px 0;}
  .forumSkeletonAvatar{width:50px;height:50px;}
  .forumSkeletonBody{padding:14px;}
  .forumSkeletonMetrics{grid-template-columns:repeat(3,minmax(0,1fr));padding:0 14px 14px;}
}
@media (prefers-reduced-motion:reduce){
  .forumSkeletonCard::before{animation:none;opacity:.7;transform:none;}
}
/* ql7-forum-search-geodetect-control-v4-clean:end */

`

const Styles = () => (
  <style jsx global>{FORUM_STYLES}</style>
)

export default Styles
