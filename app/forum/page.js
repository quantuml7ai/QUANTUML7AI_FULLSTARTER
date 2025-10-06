'use client'

import Forum from './Forum'

export default function ForumPage() {
  return (
    <div className="iso-forum-page">
      <div className="iso-forum-shell">
        <Forum />
      </div>

      {/* ЛОКАЛЬНЫЕ стили: не затрагивают общий лейаут */}
      <style jsx>{`
        /* Оболочка страницы: тянется ровно до низа экрана */
        .iso-forum-page {
          min-height: 100dvh;   /* корректная высота вьюпорта на мобилках */
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Контейнер форума: без отступов сверху/снизу, прилипает к низу */
        .iso-forum-shell {
          flex: 1 1 auto;       /* растянуть до низа */
          min-height: 0;        /* важно для внутреннего скролла без «хвоста» */
          width: 100%;
          margin: 0;
          padding: 0;           /* по умолчанию — вообще без полей */
          border: 0;
          overflow: clip;       /* не даём внутренним теням создавать визуальные зазоры */
        }

        /* На ноутбуках/десктопах — только БОКОВЫЕ поля; снизу/сверху по-прежнему 0 */
        @media (min-width: 768px) {
          .iso-forum-shell {
            padding-left:  clamp(48px, 6vw, 160px);
            padding-right: clamp(48px, 6vw, 160px);
          }
        }
        @media (min-width: 1440px) {
          .iso-forum-shell {
            padding-left:  clamp(96px, 8vw, 192px);
            padding-right: clamp(96px, 8vw, 192px);
          }
        }

        /* Если корень форума сам задаёт нижние поля — схлопываем ТОЛЬКО внутри этой страницы */
        :global(.forum_root) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        /* На случай, если последний ребёнок форума добавляет «сантиметр» снизу */
        .iso-forum-shell > :global(*) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
      `}</style>
    </div>
  )
}
