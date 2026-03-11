const questStyles = String.raw`/* === QUEST: full-width cards, like TopicItem/PostCard === */
.questList { display: grid; gap: .5rem; }
.questItem {                       /* базовый контейнер квеста */
  width: 100%;                     /* во всю ширину колонки */
}
.questItem.item {                  /* наследуем визуал от .item */
  padding: 10px 12px;
  min-height: auto;                /* по контенту */
}
/* превью и заголовки */
.questHead{ display:flex; align-items:center; gap:.6rem; }
.questThumb{
  width: 98px; height: 98px; border-radius: .6rem;
  object-fit: cover; flex: 0 0 38px;
}
.questTitle{ font-weight:700; line-height:1.15; }
.questMeta{ font-size:.82rem; opacity:.8; }

/* задачи внутри квеста — те же полноширинные карточки */
.questTaskList{ display:grid; gap:.5rem; }
.questTask.item{ padding:10px 12px; }
.questTask .right{ margin-left:auto; display:flex; align-items:center; gap:.5rem; }

/* состояния кнопок выполнения */
.btnQuest.do     { background:#1e66ff; }
.btnQuest.done   { background:#16a34a; }
.btnQuest.locked { background:#7a7a7a; cursor:not-allowed; opacity:.7; }

/* мини-счётчик */
.miniCounter{
  position:absolute; left:10px; inset-inline-start:10px; bottom:6px;
  font-size:12px; opacity:.75; user-select:none;
}

/* RTL fallback for old browsers */
[dir="rtl"] .miniCounter{ left:auto; right:10px; }
.miniCounter .sep{ opacity:.6; padding:0 2px; }
.miniCounter .max{ opacity:.75; }
.miniCounter .over{ color:#ff7f7f; opacity:1; }

/* старые элементы композера прячем (если остались в DOM) */
.tools{ display:none !important; }
/* Базовая икон-кнопка */
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

/* Большой контурный плюс */
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
/* Полоса над списком тем с кнопкой-плюсом */
.createTopicRow{
  /* отступ сверху от шапки блока тем */
  margin-block-start: 8px;        /* = margin-top, логично для RTL */
  /* внутренний паддинг, чтобы плюс не прилипал к левому бордюру карточки */
  padding-inline-start: 10px;     /* = padding-left в LTR, padding-right в RTL */
  padding-inline-end: 10px;
  padding-block-start: 6px;
  padding-block-end: 0;
}

/* сам плюс — небольшой зазор от верхней кромки и левого борта */
.createTopicRow .bigPlus{
  margin-block-start: 2px;        /* ↓ отступ от верхней кромки */
  margin-inline-start: 6px;       /* ← отступ от левого (или правого в RTL) */
}

/* если хочется чуть больше воздуха над первой карточкой темы */
.createTopicRow + .item,
.createTopicRow + div .item{
  margin-block-start: 14px;        /* первая карточка тем отъедет вниз */
}

/* на очень узких экранах можно слегка увеличить внутренние поля */
@media (max-width: 420px){
  .createTopicRow{
    padding-inline-start: 12px;
    padding-inline-end: 12px;
    margin-block-start: 10px;
  }
}
/* =========================================================
   Create Topic — всплывающая форма по центру экрана (без оверлея)
   - НЕ занимает место под контроллами
   - поверх всего (в т.ч. шапки), т.к. рендерится порталом в body
========================================================= */
.createTopicModal{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2147483000; /* максимально выше шапок/липких панелей */
  width: min(92vw, 720px);
  pointer-events: auto;
}
.createTopicModalInner{
  width: 100%;
  max-height: min(78vh, 720px);
  overflow: auto;
  border-radius: 14px;
  box-shadow: 0 18px 55px rgba(0,0,0,.35);
  /* ✅ чтобы не была прозрачной как .item */
  background: rgba(10,14,22,.96);
  border: 1px solid rgba(255,255,255,.12);
 /* ✅ чтобы визуально было как у .item (если раньше она давала отступы) */
  padding: 12px;
}

/* Единая горизонтальная рельса — визуально как сам композер */
.topRail{
  width:100%;
  margin-bottom:8px;
}
.topRail .railInner{
  display:grid;
  grid-template-columns: repeat(6, 1fr); /* 6 равных зон */
  align-items:center;
  gap: clamp(8px, 2vw, 16px);
  padding: 8px 10px;

  /* подгон под стиль композера */
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
  padding:0; /* не меняем твои классы, только габариты */
}

.topRail .miniCounter{
  position: static;
  inset: auto;
  display:inline-flex; align-items:center; gap:4px;
  font-size:12px; opacity:.8;
}


/* Чтоб между рельсой и полем ввода было ровно как по бокам раньше */
.taWrap { gap: 8px; display:flex; flex-direction:column; }

/* ===========================================
   Q-shine: мягкий золотой перелив для карточек
   =========================================== */
 /* Золотой VIP-перелив для суммы награды — как у .qcoinX2.vip */
.goldReward{
  display:inline-block;
  font-weight:800;
  font-size:1.15rem;
  letter-spacing:.02em;
  /* тот же градиент и скорость «shine», что у qcoinX2.vip */
  background:
    linear-gradient(135deg,
      #7a5c00 0%, #ffd700 18%, #fff4b3 32%, #ffd700 46%,
      #ffea80 60%, #b38400 74%, #ffd700 88%, #7a5c00 100%);
  background-size:200% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent; /* сам текст «золотится» градиентом */
  /* свечение как у бейджа X2 */
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
/* Кадры анимаций — в точности повторяем идею бейджа X2 */
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
  isolation: isolate;          /* псевдо-элементы не вылезают наружу */
  overflow: hidden;            /* срезаем блик по радиусу */
  /* лёгкое тёплое свечение рамки */
  box-shadow:
    0 0 0 1px rgba(255,215,130,.16) inset,
    0 0 0 0 rgba(255,215,130,0),
    0 10px 24px -18px rgba(255,200,120,.25);
}

/* тонкая «золотая» кромка, переливающаяся по кругу (очень деликатно) */
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
    linear-gradient(#000 0 0); /* вычитаем внутренность — остаётся «рамка» */
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  padding:1px;                 /* толщина «рамки» */
  opacity:.6;
  animation: qshine-rotate 9s linear infinite;
}
 /* движущийся «солнечный зайчик» */
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
/* вариант: блик только на hover/focus — добавь класс .qshine-hover вместо .qshine */
.qshine-hover::after{ opacity:0; transform: translateX(-70%) rotate(8deg); }
.qshine-hover:hover::after,
.qshine-hover:focus-within::after{
  opacity:.8; animation: qshine-sweep 1.8s ease-out forwards;
}

/* анимации */
@keyframes qshine-rotate{
  from{ transform: rotate(0deg);   }
  to  { transform: rotate(360deg); }
}
@keyframes qshine-sweep{
  0%   { transform: translateX(-70%) rotate(8deg); }
  48%  { transform: translateX(70%)  rotate(8deg); }
  100% { transform: translateX(80%)  rotate(8deg); }
}

/* уважение к reduce-motion */
@media (prefers-reduced-motion: reduce){
  .qshine::before{ animation: none; }
  .qshine::after { animation: none; opacity:.12; }
}

/* если эффект хочется сделать чуть тише/ярче — вот ручки */
.qshine[data-intensity="soft"]::after{ opacity:.4 }
.qshine[data-intensity="hard"]{ box-shadow:0 0 0 1px rgba(255,215,130,.22) inset, 0 12px 28px -14px rgba(255,200,120,.35); }
.qshine[data-intensity="hard"]::after{ opacity:.85 }
 .tag.ok{ background:#16a34a; color:#fff; border-color:#15803d }
.tag.info{ background:#6366f1; color:#fff; border-color:#4f46e5 }
.tag.warn { background:#ef4444; color:#fff; border:1px solid #dc2626 } /* как было */

/* увеличенный крестик в превью VIP/MOZI */
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

/* размер превью VIP/MOZI в composer */
.emojiPreviewBig {
  width: 80px;
  height: 80px;
  display: inline-block;
  vertical-align: middle;
}

/* размер VIP/MOZI в постах */
.emojiPostBig {
  width: 64px;
  height: 64px;
  display: inline-block;
  vertical-align: middle;
}
/* обёртка под крупные эмодзи в карточке */
.emojiPostWrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0;
}

/* размер VIP/MOZI эмодзи в карточках */
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

/* при необходимости для MOZI можно задать свой размер */
.moziEmojiBig.emojiPostBig {
  width: 84px;
  height: 84px;
}
/* Абсолютно «чистая» картинка: ни фона, ни рамок, ни подсветки фокуса */
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
/* убираем мобильный tap-highlight, выделение и кольца фокуса */
  -webkit-tap-highlight-color: transparent;
  -webkit-focus-ring-color: rgba(0,0,0,0);
  -webkit-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* Выключенное состояние */
.questIconPure[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}

/* гасим визуальный «клик»/focus */
.questIconPure:active,
.questIconPure:focus,
.questIconPure:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* на всякий случай — убираем подсветку выделения пикчи при тапе/дабл-тапе */
.questIconPure::selection {
  background: transparent;
} 
`;

export default questStyles
