import React from 'react'

export const FORUM_FX_STYLES = `

 /* ===== Forum header row (LTR/RTL aware) ===== */
 .forumRowBar{
   display:flex; align-items:center; gap:10px;
   width:100%;
 }
 .forumRowBar .slot-left,
 .forumRowBar .slot-right{
   display:flex; align-items:center; gap:8px; flex:0 0 auto;
 }
 .forumRowBar .slot-center{
   flex:1 1 auto; display:flex; align-items:center; justify-content:center; min-width:0;
 }
 .forumRowBar .forumTotal{
   white-space:nowrap; opacity:.85;
 }
 /* keep badge on inbox button pinned visually */
 .forumRowBar .inboxBtn{ position:relative; }
 .forumRowBar .inboxBtn .inboxBadgeReplies{
   position:absolute; top:-6px; right:-6px; z-index:3;
 }
 .forumRowBar .inboxBtn .inboxBadgeDM{
   position:absolute; top:-6px; left:-6px; z-index:2;
 }
 /* RTL: Р·РµСЂРєР°Р»РёРј С‚РѕР»СЊРєРѕ РїРѕСЂСЏРґРѕРє СЃР»РѕС‚РѕРІ, С†РµРЅС‚СЂ РѕСЃС‚Р°С‘С‚СЃСЏ С†РµРЅС‚СЂРѕРј */
 [dir="rtl"] .forumRowBar{ direction:ltr; } /* С‡С‚РѕР±С‹ РёРєРѕРЅРєРё РЅРµ РїРµСЂРµРІРѕСЂР°С‡РёРІР°Р»РёСЃСЊ */
 [dir="rtl"] .forumRowBar .slot-left{ order:3; }
 [dir="rtl"] .forumRowBar .slot-center{ order:2; }
 [dir="rtl"] .forumRowBar .slot-right{ order:1; }

 @media (max-width:480px){
   .forumRowBar{ gap:8px; }
   .forumRowBar .forumTotal{ font-size:12px; }
 }
  @keyframes coin-pop { 0%{transform:scale(0.2);opacity:0} 60%{transform:scale(1.05);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes coin-fall {
    0%{ transform: translateY(-120vh) rotate(0deg); opacity:0 }
    15%{ opacity:1 }
    100%{ transform: translateY(120vh) rotate(720deg); opacity:0 }
  }
  .coinBurstOverlay{
    position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;
    z-index:9999; backdrop-filter: blur(2px);
  }
  .coinBurstBox{
    background: radial-gradient(ellipse at center, #1d1d1d 0%, #0e0e0e 60%, #000 100%);
    border:1px solid rgba(255,215,0,0.25);
    box-shadow:0 0 40px rgba(255,215,0,0.25), inset 0 0 40px rgba(255,215,0,0.08);
    border-radius:18px; padding:28px 24px; width:min(520px, 92vw); text-align:center; color:#ffd700; animation: coin-pop .35s ease-out;
  }
  .coinSum{ font-size:42px; font-weight:800; letter-spacing:0.5px; text-shadow:0 0 18px rgba(255,215,0,0.55); margin:8px 0 16px }
  .coinCongrats{ font-size:18px; color:#ffeaa7; opacity:0.95 }
  .coinClaimBtn{
    margin-top:16px;
    border:1px solid rgba(255,215,0,0.45);
    background:linear-gradient(180deg, rgba(255,205,70,.35), rgba(120,80,0,.35));
    color:#fff6cd;
    border-radius:12px;
    min-height:42px;
    padding:10px 16px;
    font-weight:800;
    letter-spacing:.02em;
    box-shadow:0 0 18px rgba(255,215,0,.22), inset 0 0 12px rgba(255,220,120,.18);
    cursor:pointer;
  }
  .coinClaimBtn[data-loading="1"]{ opacity:.8; cursor:wait; }
  .coinPiece{ position:fixed; top:0; left:50%; width:18px; height:18px; border-radius:50%;
    background: radial-gradient(circle at 30% 30%, #fff 0%, #ffe082 15%, #ffd54f 35%, #ffca28 60%, #d4a017 100%);
    box-shadow:0 0 12px rgba(255,215,0,0.6);
    animation: coin-fall 1.6s linear forwards;
  }

`

const ForumFxStyles = () => (
  <style jsx global>{FORUM_FX_STYLES}</style>
)

export default ForumFxStyles


