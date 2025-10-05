'use client'
 
import Forum from './Forum'

export default function ForumPage() {
  return (
    <>
      <style jsx global>{`
        /* Контейнер страницы: только форум */
        .forum-shell {
          width: 100%;
          margin: 0;
          padding-inline: 0;          /* на телефонах/узких — без отступов */
          padding-block: 0;
        }

        /* Ноута/шире: даём «полевые» отступы ~3–4 см эквивалентно */
        /* Физические cm в вебе не надёжны, поэтому используем адаптивный clamp */
        @media (min-width: 768px) {
          .forum-shell {
            /* ~48–160px: на типичных ноутбуках это визуально 3–4 см */
            padding-inline: clamp(48px, 6vw, 160px);
          }
        }

        /* Очень большие мониторы — чуть больше воздуха, но без фанатизма */
        @media (min-width: 1440px) {
          .forum-shell {
            padding-inline: clamp(96px, 8vw, 192px);
          }
        }
      `}</style>

      <div className="forum-shell">
        <Forum />
      </div>
    </>
  )
}
 