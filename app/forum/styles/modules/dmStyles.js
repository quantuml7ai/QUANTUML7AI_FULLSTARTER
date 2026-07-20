const dmStyles = String.raw`/* ---- INBOX (конверт справа в шапке списка) ---- */
.head .flex.items-center.justify-between{ flex-wrap:nowrap; } /* не переносим ряд */

.iconBtn.inboxBtn{
  position:relative;
  display:inline-flex; align-items:center; justify-content:center;
  width:42px; height:42px;
  border:0; background:transparent; color:#cfe0ff;
  transition: transform .12s ease, filter .18s ease;
}
.iconBtn.inboxBtn:hover{ filter:brightness(1.08) saturate(1.08); }
.iconBtn.inboxBtn:active{ transform:translateY(1px) scale(.98); }

/* красный бейдж непрочитанного (Replies) */
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
/* зелёный/оранжевый бейдж непрочитанного (DM) */
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

/* тело «Inbox» — карточки ровно как посты */
.inboxList{ display:grid; gap:10px; }
.inboxEmpty{ opacity:.75; padding:8px 2px; }

/* ---- INBOX button ---- */
.iconBtn.inboxBtn{
  position:relative;
  /* делаем крупной и без фона */
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

/* красный бейдж (Replies) */
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
/* зелёный/оранжевый бейдж (DM) */
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
/* Отступ контента Inbox от контролов (заголовок/табы).
   Настраивается через CSS-переменную:
   --inbox-content-top-offset: 8px; (по умолчанию как было mt-2)
*/
:root{
  --inbox-content-top-offset: 100px; /* сколько нужно */
}
:root{ --inbox-dm-list-start-desktop: 980px; }
@media (max-width: 640px){
  :root{ --inbox-dm-list-start-mobile: 620px; }
}

.inboxBody{ padding:0 6px 6px; }
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
/* TMA: отдельная ручная докрутка липкой панели */
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

/* “дорожка” прогресса под волной (неон, дешево по CPU) */
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

/* SVG волна */
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
  touch-action: none; /* ✅ важно для pointer drag на мобиле */
}

/* Бар волны: базовый */
.dmWaveBar{
  fill: rgba(150,200,255,.28);
  transition: fill .18s ease, filter .18s ease;
  transform-box: fill-box;
  transform-origin: center;
}

/* Активные бары (до прогресса) */
.dmWaveBar.isActive{
  fill: rgba(140,220,255,.92);
  filter: drop-shadow(0 0 8px rgba(120,220,255,.18));
}

/* “под бит” — только когда играет (CSS-only, лёгкая анимация) */
.dmVoicePlaying .dmWaveBar{
  animation: dmWaveBounce 1.15s ease-in-out infinite;
  animation-delay: var(--d);
}

/* Бары, которые уже “пройденные”, прыгают чуть ярче */
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

/* Метаданные */
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
`;

export default dmStyles
