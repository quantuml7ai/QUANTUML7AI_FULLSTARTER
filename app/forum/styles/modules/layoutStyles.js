const layoutStyles = String.raw`/* === Forum Topic Title Controls === */
:root{
  --forum-topic-title-font: var(--font-forum-title), system-ui, -apple-system, "Segoe UI", sans-serif;
  --forum-topic-title-size: 25px;
  --forum-topic-title-color: #fec301ff;
}

/* Единый стиль заголовков тем в форуме */
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

  /* лёгкий «крипто-неон» спецэффект */
  text-shadow:
    0 0 6px rgba(0, 200, 255, 0.55),
    0 0 14px rgba(0, 0, 0, 0.85);
}
/* общий липкий док внизу окна — держит композер и FAB на месте */
.composeDock{
  position: sticky;
  bottom: 0;
  z-index: 40;          /* поверх контента со скроллом */
  pointer-events: none; /* сам док клики не перехватывает */
}
/* его дети кликабельны */
.composeDock > *{ pointer-events: auto; }

/* прячем композер, когда он выключен — если у тебя это уже есть, оставь своё */
.composer:not([data-active="true"]){
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
  transition: transform .18s ease, opacity .12s ease;
}

/* FAB внутри дока: позиционируем к правому нижнему углу дока */
.fabCompose{
  --fab-size: 50px;
  --fab-right: 16px;   /* можно менять позицию */
  --fab-bottom: 36px;  /* можно менять позицию */

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

/* прячем FAB, когда композер активен */
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

`;

export default layoutStyles
