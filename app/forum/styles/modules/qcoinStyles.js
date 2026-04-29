const qcoinStyles = String.raw`/* === Q COIN (инлайн + модалка) === */
.qcoinRow{
  display:inline-flex; align-items:center; gap:10px; margin-left:10px;
}

/* Золотая надпись с переливом и свечением */
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
  50%{ text-shadow:0 0 .9рем rgba(255,215,0,.55), 0 0 .25rem rgba(255,255,190,.55) }
  100%{ text-shadow:0 0 .3rem rgba(255,215,0,.35), 0 0 .1rem rgba(255,255,180,.35) }
}

/* Само число — крупнее, с «стеклянной» подложкой */
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

/* модалка — скроллим подложку, карточка растягивается по контенту */
.qcoinModal{
  position:fixed; inset:0; z-index:3200;
  display:grid; align-items:start; justify-items:center; /* вместо place-items:center */
  overflow:auto;                     /* скролл у подложки */
  padding:16px 10px;                 /* запас от краёв экрана */
  background:rgba(8,12,22,.8);
}
.qcoinCard{
  width:min(520px, 88vw);            /* ширину НЕ трогаем */
  height:auto !important;
  max-height:none !important;        /* убираем ограничение по высоте */
  overflow:visible !important;       /* без внутреннего скролла */
  border:1px solid rgba(255,255,255,.14); border-radius:14px;
  background:rgba(10,14,20,.96); padding:14px;
  box-shadow:0 10px 30px rgba(0,0,0,.45);
}
.qcoinCardHdr{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px }

/* гиф/аватар — одна версия (убраны дубли) */
.qcoinMini{
  width:  clamp(108px, 12.6vw, 144px);
  height: clamp(108px, 12.6vw, 144px);
  border-radius:10px;
  object-fit:cover;
  border:1px solid rgba(255,215,0,.4);
  flex:0 0 auto;
  background:#000;                   /* на случай загрузки метаданных */
  box-shadow:0 4px 12px rgba(50,80,160,.25);
}

.qcoinPopBody{
  max-height:none !important;        /* снимаем второй лимит */
  overflow:visible !important;       /* скролл не здесь */
}
.qcoinCardHdr img, .qcoinPopBody img{ max-width:100%; height:auto }

/* кнопки (старые) */
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

/* НЕОНОВАЯ «Биржа» в модалке */
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

/* анимации off при reduced motion */
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

/* карточки можно переиспользовать из левой/правой колонок без изменений */

/* === Thread view: фикс обрезаний справа и стопроцентная адаптивность === */
.forum_root, .forum_root * { box-sizing: border-box; }

/* Ключевое: позволяем детям в grid/flex сжиматься, убираем «невидимую» половину */
.forum_root .body,
.forum_root .head,
.forum_root .title,
.forum_root .composer { max-width: 100%; min-width: 0; }

/* Список постов внутри .body может быть grid/flex — тоже даём сжиматься */
.forum_root .body > .grid,
.forum_root .body > .flex { min-width: 0; }

/* На всякий — если используется двухколоночная сетка .grid2 */
.grid2 > * { min-width: 0; }

/* Вертикальный скролл, а по X — не режем (контент сам сожмётся) */
.forum_root .body { overflow-y: auto; overflow-x: visible; }

/* Липкий композер растягиваем по ширине контейнера-скролла */
.forum_root .composer { left: 0; right: 0; width: auto; }

/* === FIX: кнопки действий в карточках постов всегда в один ряд и сжимаются === */

/* 1) Страхуем контейнеры карточек от обрезания контента */
[id^="post_"],
[id^="post_"] > div,
.postCard {
  min-width: 0;         /* позволяет flex-детям сжиматься */
  overflow: visible;    /* исключает внутреннее «подрезание» */
}

/* 2) Ряд с кнопками действий поста: запрещаем перенос, даём сжатие */
[id^="post_"] .actions,
.postCard .actions,
.post .actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;    /* никогда не переносить на вторую строку */
  min-width: 0;
  overflow: visible;
  white-space: nowrap;  /* тексты на кнопках в одну строку */
}
/* [ACTIONS-SHRINK-EXTRA] ещё сильнее разрешаем сжатие на сверхузких */
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

/* 3) Сами кнопки: разрешаем сжиматься, уменьшаем паддинги и шрифт по мере сужения */
[id^="post_"] .actions .btn,
[id^="post_"] .actions .iconBtn,
.postCard .actions .btn,
.postCard .actions .iconBtn,
.post .actions .btn,
.post .actions .iconBtn {
  flex: 0 1 auto;                    /* можно сжиматься */
  min-width: 0;                      /* чтобы не держали ширину */
  height: clamp(26px, 4.2vw, 32px);  /* ниже — уже неудобно нажимать */
  padding-inline: clamp(6px, 1.4vw, 12px);
  padding-block: 4px;
  font-size: clamp(11px, 1.6vw, 14px);
  line-height: 1;                    /* компактнее строка */
}

/* 4) Если в кнопке есть текстовый сын — пусть он ужимается с троеточием */
[id^="post_"] .actions .btn > span,
.postCard .actions .btn > span,
.post .actions .btn > span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 5) На сверхузких — чуть уменьшаем зазоры, но всё ещё в один ряд */
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
/* === FIX: перенос длинных title/description в карточках тем === */

/* страхуем контейнеры карточек тем от «расталкивания» соседей */
[id^="topic_"],
.topicCard {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden; /* не даём горизонтальный скролл из-за длинных слов */
}

/* заголовок темы */
[id^="topic_"] .title,
.topicCard .title,
[id^="topic_"] h2,
.topicCard h2,
[id^="topic_"] h3,
.topicCard h3 {
  white-space: normal !important;   /* разрешаем перенос строк */
  overflow-wrap: anywhere;          /* переносим даже «слитки» символов */
  word-break: break-word;           /* классический перенос длинных слов */
  hyphens: auto;                    /* расставляем мягкие переносы там, где можно */
  min-width: 0;
  max-width: 100%;
}

/* описание темы (подзаголовок/превью) */
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

/* если внутри попадаются длинные URL — не ломаем раскладку, но переносим */
[id^="topic_"] .title a,
[id^="topic_"] .desc  a,
.topicCard .title a,
.topicCard .desc  a {
  word-break: break-all;    /* адрес можно рубить в любом месте */
  overflow-wrap: anywhere;
  text-decoration: inherit;
}

/* на сверхузких — слегка уменьшаем межстрочные/отступы, чтобы текст «умещался красиво» */
@media (max-width: 360px) {
  [id^="topic_"] .title,
  .topicCard .title { line-height: 1.15; }
  [id^="topic_"] .desc,
  .topicCard .desc  { line-height: 1.2; }
}
/* === HARD FIX: темы не вылезают, любые длинные строки переносятся === */

/* 0) Страхуем карточку темы и всех её детей: можно сжиматься, нельзя распихивать */
[id^="topic_"],
.topicCard {
  max-width: 100% !important;
  min-width: 0 !important;
  overflow-x: hidden !important;
}
[id^="topic_"] * ,
.topicCard * {
  min-width: 0 !important;            /* ключ к нормальному сжатию во flex/grid */
}

/* 1) Сам заголовок темы — ломаем даже «оооооооо» и длинные URL/слитки */
[id^="topic_"] .title,
.topicCard .title,
[id^="topic_"] h1, [id^="topic_"] h2, [id^="topic_"] h3,
.topicCard h1, .topicCard h2, .topicCard h3 {
  display: block;
  white-space: normal !important;
  overflow-wrap: anywhere !important;  /* главный герой */
  word-break: break-word !important;   /* классика */

  hyphens: auto;
  max-width: 100%;

} 


/* Текстовые узлы внутри заголовка (span/a/strong и т.п.) — тоже ломаем */
[id^="topic_"] .title *, .topicCard .title * {
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  line-break: anywhere !important;
}

/* 2) Описание темы — те же правила */
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

/* Любые ссылки внутри title/desc — позволяем рубить в любом месте */
[id^="topic_"] .title a,
[id^="topic_"] .desc a,
.topicCard .title a,
.topicCard .desc a {
  word-break: break-all !important;
  overflow-wrap: anywhere !important;
}

/* 3) Если шапка карточки — flex/grid: контентная колонка должна иметь min-width:0 */
[id^="topic_"] .header,
.topicCard .header,
[id^="topic_"] .content,
.topicCard .content {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden;                   /* на всякий, чтобы не появлялся горизонтальный скролл */
}

/* 4) Бейджи/аватар не тянут ширину: не растягиваются и не ломают строку */
[id^="topic_"] .avatar,
.topicCard .avatar,
[id^="topic_"] .badge,
.topicCard .badge {
  flex: 0 0 auto;
}

/* 5) На сверхузких — уменьшаем межстрочные, чтобы визуально аккуратно умещалось */
@media (max-width: 360px) {
  [id^="topic_"] .title,
  .topicCard .title { line-height: 1.15; }
  [id^="topic_"] .desc,
  .topicCard .desc  { line-height: 1.2; }
}
/* === FORCE WRAP for topic title/desc (перекрываем старые правила) === */
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

/* OWNER kebab/menu — общий для тем и постов */
.ownerKebab { 
  position: absolute; 
   right: 8px; 
   top: 8px; 
   z-index: 80;              /* выше кликабельных оверлеев карточки */
   pointer-events: auto;     /* на случай если родитель/оверлей вмешивается */
 }
.kebabBtn{
  width:38px; height:38px; border:0; border-radius:8px;
  background:rgba(255,255,255,.06); color:#eaf4ff; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:16px; line-height:1;
  pointer-events: auto;
  touch-action: manipulation; /* быстрее/чище клик на мобиле */  
}
.kebabBtn:hover{ filter:brightness(1.1); }
.ownerMenu{
position:absolute; right:40px; top:0px; display:flex; flex-direction:column; gap:8px; 
padding:11px; background:rgba(12,18,34,.96); border:1px solid rgba(170,200,255,.14);
  border-radius:13px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:20; visibility:hidden;
 pointer-events: auto;
  }
 /* RTL: зеркалим позиционирование ⋮ и выпадающего меню */
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

 /* owner menu: обычные кнопки (например ✏️) — без серого фона */
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
  background: rgba(0,0,0,0); /* прозрачная ловушка кликов */
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
/* [FOCUS_TOOLS_STYLES:BEGIN] — панель инструментов композера по фокусу */
.composer .tools{
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height .2s ease, opacity .2s ease;
}
.composer[data-active="true"] .tools{
  max-height: 480px; /* достаточно для 2-3 рядов */
  opacity: 1;
  pointer-events: auto;
}
/* [FOCUS_TOOLS_STYLES:END] */
/* === sticky bottom fix === */
.forum_root[data-view="topics"] .body { padding-bottom: 0 !important; margin-bottom: 0 !important; }
.forum_root[data-view="thread"] .body { padding-bottom: 96px !important; } /* высота композера + чуть воздуха */
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
/* [STICKY-HEADER] верхний блок всегда прилипает к верху окна прокрутки форума */
.forum_root .head {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--glass, rgba(8,13,20,.94));
  backdrop-filter: saturate(140%) blur(8px);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid rgba(255,255,255,.06);
}
/* [BACK-TO-TOP] плавающая кнопка наверх (над композером) */
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
/* === PostCard: перевод текста === */
.translateToggleBtn {
  position: relative;
  display: flex;                 /* растягиваем контент по ширине */
  align-items: center;
  justify-content: center;       /* текст и иконки по центру */

  width: 100%;                   /* ВСЯ ширина карточки */
  box-sizing: border-box;
  margin-top: 8px;               /* отступ от даты */
  margin-left: 0;                /* больше не нужен смещающий left */

  gap: 8px;                      /* у тебя было 70x — опечатка */
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

/* текст внутри — под обрез, чтобы на маленьких экранах не ломало разметку */
.translateToggleText {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* адаптив: чуть меньше шрифт и паддинги на узких экранах */
@media (max-width: 640px) {
  .translateToggleBtn {
    padding: 8px 10px;
    font-size: 13px;
  }
}

/* компактнее, чем .btnSm — под иконки/счётчики */
.btnXs{
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1;
  height: 26px;            /* удобный минимум */
  border-radius: 10px;
}
@media (max-width:360px){
  .btnXs{ padding: 2px 5px; font-size: 10px; height: 24px; }
}
  /* Полоса действий поста: кнопки занимают доступную ширину и сжимаются без скролла */
  .actionBar > * { min-width: 0; }                /* детям разрешаем сжиматься */
  .actionBar .btnXs { flex: 1 1 0; min-width: 0; }/* сами маленькие кнопки — гибкие */
.actionBar .tag  { min-width: 0; }              /* счётчики тоже не фиксируем */

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
  --trail: "✦";

  opacity:0;
  will-change: transform, opacity;
  backface-visibility:hidden;

  /* IMPORTANT: не анимируемся на маунте (иначе вспышки в (0,0) при скролле) */
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

/* Анимация включается ТОЛЬКО когда мы явно зажигаем ноду */
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
  /* IMPORTANT: trail тоже не должен жить на маунте */
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
  /* IMPORTANT: не анимировать на маунте */
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
  z-index: 1; /* ниже поповеров/тостов */
}

/* прячем док, когда композер не активен */
.composer:not([data-active="true"]) .voiceDock{
  opacity: 0; pointer-events: none;
  transform: translateY(4px) scale(.98);
  transition: opacity .12s ease, transform .12s ease;
}
.composer[data-active="true"] .voiceDock{
  opacity: 1; pointer-events: auto;
  transition: opacity .12s ease, transform .12s ease;
}

/* кнопка микрофона */
.voiceBtn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  width:var(--voice-size); height:var(--voice-size);
  border-radius:50%; border:0; background:transparent;
  color:#cfe0ff; cursor:pointer;
  transition: transform .12s ease, filter .18s ease;
}
.voiceBtn:hover{ filter:brightness(1.08) saturate(1.1); }
.voiceBtn:active{ transform:translateY(1px) scale(.98); }

/* запись */
.voiceBtn.rec{

  box-shadow:0 0 0 2px rgba(255,90,90,.9), 0 0 14px 2px rgba(255,90,90,.25);
  color:#ffd1d1;
}
.voiceBtn .recDot{
  position:absolute; top:6px; right:6px; width:7px; height:7px; border-radius:50%;
  background:#ff5959; box-shadow:0 0 6px rgba(255,0,0,.75);
}

/* авто-масштаб иконки под размер кнопки */
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
/* бейдж-замок: по умолчанию скрыт */
.voiceBtn .lockBadge{
  position:absolute; top:-4px; right:-4px;
  display:none; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%;
  font-size:11px; line-height:1;
  background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.18);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.6));
  pointer-events:none; z-index:2; /* поверх svg */
}
/* показать замок, когда нет VIP — ровно как у скрепки */
.voiceBtn[data-locked="true"] .lockBadge{
  display:inline-flex;
}
/* таймер-пилюля над кнопкой */
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

/* ---- AUDIO card (превью + пост) ---- */
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
/* убираем серую плашку у Chromium */
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
  /* больше НЕ absolute: контейнер сам задаёт высоту по контенту (до max-height) */
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
  /* подложка QCast всегда целиком, без кропа */
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
  --trail: "✦";

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

 /* ===== EQ над контролами: rail + bars (берёт энергию из CSS vars --q-all/--q-high) ===== */
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
/* --- avatar + nick (ник всегда под аватаром) --- */
.avaNick{
  display:inline-flex;
  align-items:center; justify-content:center;
  margin-top:14px;
  width:84px; 
   width:120px;                  /* = ширина твоего .avaBig; если другая — подставь её */
  text-align:center;
  max-width:clamp;
  padding:2 88px;
  white-space:nowrap;          /* не переносим ник */
  overflow:hidden; text-overflow:ellipsis;
}

/* --- правая полоса с Q COIN --- */
.qRowRight{
  /* контейнер QCoin занимает всю правую часть и по высоте ровно аватар */
  flex:1 1 auto; min-width:0; width:100%;
  align-self:center;                      /* центр по колонке аватара */
  height:var(--ava-size);
  display:flex; align-items:center; justify-content:flex-end; /* прижимаем контент вправо */
  /* тонкая вертикальная подстройка от середины аватара (можно крутить инлайном) */
  --qcoin-y: 0px;
  transform: translateY(var(--qcoin-y));
  transform-origin:left center;
}

/* сам блок QCoin растягивается на всю доступную ширину,
   но не переносится и не вылазит */
.qRowRight > *{
  flex:1 1 auto; min-width:0; width:100%;
  display:inline-flex; align-items:center; justify-content:flex-end;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  text-align:right;
  font-size:clamp(12px, 2.8vw, 24px);     /* адаптивный размер шрифта */
  max-width:100%;
}

/* --- Поповер QCoin контейнер --- */
.qcoinPop{
  /* если у тебя уже стоит position/left/top/width — оставь их */
  max-width: 520px;
  z-index: 3200;
}

/* Карточка: делаем колоночный лэйаут с прокручиваемым body */
.qcoinCard{
  display:flex; flex-direction:column;
  max-height: min(72vh, 1060px);   /* ограничим высоту поповера */
  overflow:hidden;                /* скролл только в body */
}

/* Шапка фикс сверху */
.qcoinCardHdr{
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; padding:10px 12px;
  border-bottom:1px solid rgba(160,180,255,.15);
}

/* Тело: именно оно скроллится */
.qcoinPopBody{
  padding:12px; overflow:auto;
  overscroll-behavior: contain;
  max-height: 100%;
}

/* --- Полоса действий: всегда один ряд, адаптивно сжимается --- */
.qcActions{
  display:flex; flex-wrap:nowrap; gap:10px;
  align-items:center; justify-content:space-between;
  padding:10px 12px; border-top:1px solid rgba(160,180,255,.15);
}

.qcBtn{
  flex:1 1 0;                    /* равные доли, сжиматься можно */
  min-width:0;                   /* позволяем ужиматься реально */
  white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;
  font-size: clamp(12px, 2.6vw, 14px);
  line-height: 1.15;
  padding: 10px 12px;
}

/* Спецэффект на "Биржа" — лёгкий шимер + неоновый ховер */
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

/* "Вывод" — золотая, когда доступно; серая, когда disabled */
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

/* На очень узких экранах — жмём плотнее */
@media (max-width: 360px){
  .qcBtn{ font-size: clamp(11px, 3.2vw, 13px); padding:8px 10px; }
}
.topicTitle{ font-size: clamp(16px, 2.2vw, 18px); line-height: 1.25; }
.topicDesc { line-height: 1.35; }

/* --- TopicItem: аватар слева, ник справа В ОДНУ СТРОКУ --- */
.item .topicUserRow{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:nowrap;   /* запрещаем перенос ника вниз */
  min-width:0;        /* разрешаем реальное сжатие строки */
}
.item .topicUserRow .avaMini{
  flex:0 0 auto;      /* аватар фиксированный */
}
 .item .topicUserRow .nick-badge{
   display:inline-flex;
   align-items:center;
   flex:0 1 auto;        /* ← больше НЕ растягиваемся */
   min-width:0;
   width:auto;
   max-width:clamp(96px, 40vw, 240px);  /* аккуратный предел для обрезки */
 }
 .item .topicUserRow .nick-badge .nick-text{
   display:block;
   white-space:nowrap;
   overflow:hidden;
   text-overflow:ellipsis;
   max-width:100%;
 }
 /* PostCard: аватар слева, ник справа — одна строка, без растяжения */
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
  flex:0 1 auto;      /* не растягиваемся на всю ширину */
  min-width:0;
  width:auto;
  max-width:clamp(96px, 40vw, 260px);  /* аккуратный предел под ellipsis */
}
.item .postUserRow .nick-badge .nick-text{
  display:block;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:100%;
}
`;

export default qcoinStyles
