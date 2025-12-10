// app/academy/page.js
'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Children,
  isValidElement,
  Fragment
} from 'react'


import Image from 'next/image'
import Link from 'next/link'
import { useI18n } from '../../components/i18n'
import HomeBetweenBlocksAd from '../ads'
import AcademyExamBlock from './AcademyExamBlock'

/**
 * Блок с Q&A.
 * Внешний лейаут: .panel из глобальных стилей.
 * Весь визуал внутри — только через QL7-* и локальный <style jsx>.
 */
function QASection({ imageSrc, imageAlt, titleKey, qaKeys }) {
  const { t } = useI18n()

  return (
    <section className="panel">
      {/* Баннер */}
      <div className="QL7-banner-wrap">
        <Image
          src={imageSrc}
          alt={imageAlt}
          className="QL7-banner-img"
          width={1920}
          height={480}
          sizes="100vw"
          priority={false}
        />
      </div>

      {/* Заголовок по центру */}
      <h1 className="QL7-title">
        {t(titleKey)}
      </h1>

      {/* Разделитель */}
      <div className="QL7-divider">
        <span className="QL7-divider-line" />
        <span className="QL7-divider-pulse" />
        <span className="QL7-divider-line" />
      </div>

      {/* Q&A */}
      <div className="QL7-qa-list">
        {qaKeys.map((baseKey) => (
          <div key={baseKey} className="QL7-qa-item">
            <div className="QL7-qa-row QL7-qa-row-q">
              <span className="QL7-qa-label QL7-qa-label-q">❓</span>
              <span className="QL7-qa-dash QL7-qa-dash-q">⇒</span>
              <span className="QL7-qa-text QL7-qa-text-q">
                {t(`${baseKey}_q`)}
              </span>
            </div>
            <div className="QL7-qa-row QL7-qa-row-a">
              <span className="QL7-qa-label QL7-qa-label-a">⚡</span>
              <span className="QL7-qa-dash QL7-qa-dash-a">⇒</span>
              <span className="QL7-qa-text QL7-qa-text-a">
                {t(`${baseKey}_a`)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Локальные стили ТОЛЬКО для этого блока */}
      <style jsx>{`
        .QL7-banner-wrap {
          width: 100%;
          margin-bottom: 18px;
          border-radius: 18px;
          overflow: hidden;
        }

        .QL7-banner-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .QL7-title {
          margin: 0 0 10px;
          font-size: 1.6rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #e5f7ff;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.35);
        }

        .QL7-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 10px auto 18px;
        }

        .QL7-divider-line {
          flex: 1;
          max-width: 220px;
          height: 2px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(0, 255, 200, 0.8),
            transparent
          );
          opacity: 0.9;
        }

        .QL7-divider-pulse {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #00ffd0;
          box-shadow:
            0 0 10px #00ffd0,
            0 0 26px #00b4ff;
          animation: QL7-divider-pulse 1.6s ease-in-out infinite;
        }

        .QL7-qa-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .QL7-qa-item {
          padding: 10px 12px;
          border-radius: 16px;
          background:
            radial-gradient(circle at top left, rgba(255, 0, 120, 0.14), transparent),
            radial-gradient(circle at bottom right, rgba(0, 255, 160, 0.16), transparent),
            rgba(2, 6, 16, 0.96);
          border: 1px solid rgba(0, 255, 200, 0.16);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7);
        }

        .QL7-qa-row {
          display: flex;
          align-items: flex-start;
          gap: 4px;
        }

        .QL7-qa-row-q {
          margin-bottom: 4px;
        }

        .QL7-qa-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 800;
          background: #02050a;
        }

        /* Вопросительный знак — красный неон + анимация */
        .QL7-qa-label-q {
          color: #ff2f4f;
          border: 1px solid #ff2f4f;
          text-shadow:
            0 0 6px #ff2f4f,
            0 0 14px #ff004f;
          box-shadow:
            0 0 10px #ff2f4f,
            0 0 24px #ff004f;
          animation: QL7-q-glow 0.8s ease-in-out infinite alternate;
        }

        /* Восклицательный знак — зелёный неон + анимация */
        .QL7-qa-label-a {
          color: #22e58a;
          border: 1px solid #22e58a;
          text-shadow:
            0 0 6px #22e58a,
            0 0 14px #00ff9c;
          box-shadow:
            0 0 10px #22e58a,
            0 0 24px #00ff9c;
          animation: QL7-a-glow 0.8s ease-in-out infinite alternate;
        }

        .QL7-qa-dash {
          display: inline-block;
          font-weight: 600;
          margin-top: 2px;
        }

        .QL7-qa-dash-q {
          color: #ffb3c0;
        }

        .QL7-qa-dash-a {
          color: #b4ffdf;
        }

        .QL7-qa-text {
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Вопрос — красный */
        .QL7-qa-text-q {
          color: #ff4d4f;
        }

        /* Ответ — зелёный */
        .QL7-qa-text-a {
          color: #28c76f;
        }

        @keyframes QL7-divider-pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
        }

        @keyframes QL7-q-glow {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.25);
          }
        }

        @keyframes QL7-a-glow {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.25);
          }
        }

        @media (min-width: 720px) {
          .QL7-title {
            font-size: 1.8rem;
          }
          .QL7-qa-text {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </section>
  )
}
/**
 * AcademyPaginator (v2)
 *
 * Страница = QASection + все элементы до следующего QASection (включая рекламу).
 * Показываем ОДНУ страницу за раз.
 *
 * Навигация снизу:
 *   [« В начало] [‹ Назад] [ ● N ● ] [Вперёд ›] [В конец »]
 */
function AcademyPaginator({ children }) {
  const all = Children.toArray(children)

  // Группируем потомков в страницы
  const pages = useMemo(() => {
    const res = []
    let current = null

    for (const child of all) {
      if (!isValidElement(child)) continue
      const isQA = child.type === QASection

      if (isQA) {
        if (current && current.length) res.push(current)
        current = [child]
      } else if (current) {
        current.push(child)
      }
    }

    if (current && current.length) res.push(current)
    return res
  }, [all])

  const [page, setPage] = useState(0)

  // если что-то не так — рендерим всё как есть
  if (!pages.length) return <>{children}</>

  const pageCount = pages.length
  const safePage = Math.min(Math.max(page, 0), pageCount - 1)

  const goTo = (p) => {
    if (p < 0) p = 0
    if (p > pageCount - 1) p = pageCount - 1
    if (p === safePage) return

    setPage(p)

    // плавный скролл к началу контента Академии
    try {
      const root =
        document.querySelector('.page-content') ||
        document.scrollingElement ||
        document.documentElement

      root.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isFirst = safePage === 0
  const isLast = safePage === pageCount - 1

  return (
    <>
      {/* текущая страница */}
      {pages[safePage].map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}

      {/* компактная навигация снизу */}
      <div className="academy-pagination">
        {/* В начало */}
        <button
          className="nav-pill edge"
          onClick={() => goTo(0)}
          disabled={isFirst}
        >
          ⫷
        </button>

        {/* Назад */}
        <button
          className="nav-pill"
          onClick={() => goTo(safePage - 1)}
          disabled={isFirst}
        >
          ⧏
        </button>

        {/* Текущая страница — круглый неоновый индикатор */}
        <div className="page-indicator-wrap">
          <div className="page-indicator">
            {safePage + 1}
          </div>
          <div className="page-indicator-label">
            / {pageCount}
          </div>
        </div>

        {/* Вперёд */}
        <button
          className="nav-pill"
          onClick={() => goTo(safePage + 1)}
          disabled={isLast}
        >
          ⧐
        </button>

        {/* В конец */}
        <button
          className="nav-pill edge"
          onClick={() => goTo(pageCount - 1)}
          disabled={isLast}
        >
          ⫸
        </button>
      </div>

      <style jsx>{`
        .academy-pagination{
          margin:18px 0 10px;
          padding:6px 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          flex-wrap:wrap;
        }

        /* Овальные кнопки стрелок */
        .nav-pill{
          padding:12px 30px;
          min-width:42px;
          border-radius:999px;
          border:1px solid rgba(0, 229, 255, 0.58);
          background:
            radial-gradient(circle at 0 0, rgba(255, 208, 0, 0.73), transparent 70%),
            rgba(2,8,18,.98);
          color:#7fe9ff;
          font-size:11px;
          font-weight:700;
          letter-spacing:.06em;
          text-transform:uppercase;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:4px;
          cursor:pointer;
          box-shadow:
            0 0 10px rgba(255, 242, 0, 1),
            0 8px 18px rgba(0,0,0,.85),
            inset 0 0 6px rgba(0,229,255,.14);
          transition:
            background .16s ease,
            color .16s ease,
            transform .12s ease,
            box-shadow .16s ease,
            opacity .16s ease;
        }

        .nav-pill.edge{
          font-size:12px;
        }

        .nav-pill:hover:not(:disabled){
          background:
            radial-gradient(circle at 30% 0, rgba(56,189,248,.35), transparent 75%),
            rgba(3,10,20,1);
          color:#e9fdff;
          transform:translateY(-1px);
          box-shadow:
            0 0 18px rgba(56,189,248,.6),
            0 12px 26px rgba(0,0,0,.95),
            inset 0 0 10px rgba(0,229,255,.26);
        }

        .nav-pill:active:not(:disabled){
          transform:translateY(0) scale(.96);
          box-shadow:
            0 0 10px rgba(0,229,255,.3),
            0 6px 16px rgba(0,0,0,.9),
            inset 0 0 12px rgba(0,229,255,.32);
        }

        .nav-pill:disabled{
          opacity:.26;
          cursor:default;
          box-shadow:none;
        }

        /* Центр: круглый индикатор текущей страницы */
        .page-indicator-wrap{
          display:flex;
          align-items:center;
          gap:6px;
        }

        .page-indicator{
          width:60px;
          height:40px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:800;
          color:#020817;
          background:
            radial-gradient(circle at 30% 0, #fdcc06ae, #f7f8f9ff),
            linear-gradient(135deg,#00e5ff,#38bdf8);
          box-shadow:
            0 0 18px rgba(248, 213, 56, 1),
            0 0 40px rgba(255, 225, 0, 1);
          position:relative;
          animation:pagePulse 1.8s ease-in-out infinite;
        }

        .page-indicator::after{
          content:'';
          position:absolute;
          inset:-4px;
          border-radius:inherit;
          border:1px solid rgba(125,244,255,.14);
          box-shadow:0 0 12px rgba(0,229,255,.35);
          opacity:.7;
        }

        .page-indicator-label{
          font-size:10px;
          color:#8fb9ff;
          opacity:.85;
        }

        @keyframes pagePulse{
          0%{
            transform:scale(1);
            box-shadow:
              0 0 16px rgba(246, 221, 0, 1),
              0 0 26px rgba(255, 221, 0, 1);
          }
          50%{
            transform:scale(1.06);
            box-shadow:
              0 0 26px rgba(56,189,248,1),
              0 0 42px rgba(0,229,255,.8);
          }
          100%{
            transform:scale(1);
            box-shadow:
              0 0 16px rgba(56,189,248,.7),
              0 0 26px rgba(0,229,255,.4);
          }
        }

        @media (max-width:640px){
          .academy-pagination{
            margin:14px 0 8px;
            gap:8px;
            padding:4px 8px;
          }
          .nav-pill{
            padding:4px 10px;
            min-width:34px;
            font-size:9px;
          }
          .nav-pill.edge{
            font-size:10px;
          }
          .page-indicator{
            width:24px;
            height:24px;
            font-size:11px;
          }
          .page-indicator-label{
            font-size:9px;
          }
        }
      `}</style>
    </>
  )
}


function AcademyContent() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.innerHTML += marqueeRef.current.innerHTML
    }
  }, [])

  const defiKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 1).toString().padStart(3, '0')
        return `qa_defi_${n}`
      }),
    []
  )

  const defiKeys2 = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 51).toString().padStart(3, '0')
        return `qa_defi_${n}`
      }),
    []
  )
 

  const chainKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 101).toString().padStart(3, '0')
        return `qa_chain_${n}`
      }),
    []
  ) 

  const web3SecKeys = useMemo(
    () => [
      // qa_web3_201–230 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 201).toString().padStart(3, '0')
        return `qa_web3_${n}`
      }),
      // qa_sec_301–320 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 301).toString().padStart(3, '0')
        return `qa_sec_${n}`
      }),
    ],
    []
  )

  const secTradeKeys = useMemo(
    () => [
      // qa_sec_321–350 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 321).toString().padStart(3, '0')
        return `qa_sec_${n}`
      }),
      // qa_trade_401–420 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 401).toString().padStart(3, '0')
        return `qa_trade_${n}`
      }),
    ],
    []
  )

  const tradeNftKeys = useMemo(
    () => [
      // qa_trade_421–450 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 421).toString().padStart(3, '0')
        return `qa_trade_${n}`
      }),
      // qa_nft_501–520 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 501).toString().padStart(3, '0')
        return `qa_nft_${n}`
      }),
    ],
    []
  )

  const nftRegAiKeys = useMemo(
    () => [
      // qa_nft_521–530 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (i + 521).toString().padStart(3, '0')
        return `qa_nft_${n}`
      }),
      // qa_reg_601–620 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 601).toString().padStart(3, '0')
        return `qa_reg_${n}`
      }),
      // qa_ai_701–720 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 701).toString().padStart(3, '0')
        return `qa_ai_${n}`
      }),
    ],
    []
  )

  const daoMetaKeys = useMemo(
    () => [
      // qa_dao_801–820 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 801).toString().padStart(3, '0')
        return `qa_dao_${n}`
      }),
      // qa_meta_901–930 (30 пар)
     ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 901).toString().padStart(3, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )


  const metaTailKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 931).toString().padStart(3, '0')
        return `qa_meta_${n}`
      }),
    []
  )


  const metaGamefiKeys = useMemo(
    () => [
      // qa_meta_981–1000 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 981).toString().padStart(3, '0')
        return `qa_meta_${n}`
      }),
      // qa_gamefi_1001–1030 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1001).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
    ],
    []
  )


  const gamefiSocialfiKeys = useMemo(
    () => [
      // qa_gamefi_1031–1050 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 1031).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
      // qa_socialfi_1051–1080 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1051).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
    ],
   []
  ) 

  const socialfiDevKeys = useMemo(
    () => [
      // qa_socialfi_1081–1100 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 1081).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
      // qa_dev_1101–1130 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1101).toString().padStart(4, '0')
        return `qa_dev_${n}`
      }),
    ],
    []
  )  

  const devDataKeys = useMemo(
    () => [
      // qa_dev_1131–1150 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
       const n = (i + 1131).toString().padStart(4, '0')
        return `qa_dev_${n}`
      }),
      // qa_data_1151–1180 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1151).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
    ],
    []
  )

  const dataAiKeys = useMemo(
    () => [
      // qa_data_1181–1200 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (i + 1181).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
      // qa_ai_1201–1230 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (i + 1201).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
    ],
    []
  )

  const aiDeepKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 1231).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
    []
  )

  const aiNextKeys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (i + 1281).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
    []
  )

  const aiMetaKeys = useMemo(
    () => [
      // qa_ai_1331–1340 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (i + 1331).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
      // qa_meta_1341–1380 (40 пар)
      ...Array.from({ length: 40 }, (_, i) => {
        const n = (i + 1341).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )

  const metaMix18Keys = useMemo(
    () => [
      // qa_meta_1381–1400 (20 пар)
      ...Array.from({ length: 20 }, (_, i) => {
        const n = (1381 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
      // qa_gamefi_1401–1410 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1401 + i).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
      // qa_socialfi_1411–1416 (6 пар)
      ...Array.from({ length: 6 }, (_, i) => {
        const n = (1411 + i).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
      // qa_ops_1417–1420 (4 пар)
      ...Array.from({ length: 4 }, (_, i) => {
        const n = (1417 + i).toString().padStart(4, '0')
        return `qa_ops_${n}`
      }),
      // qa_data_1421–1425 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1421 + i).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
      // qa_meta_1426–1430 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1426 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )

  const metaAiReg19Keys = useMemo(
    () => [
      // qa_meta_1431–1460 (30 пар)
      ...Array.from({ length: 30 }, (_, i) => {
        const n = (1431 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
      // qa_ai_1461–1470 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1461 + i).toString().padStart(4, '0')
        return `qa_ai_${n}`
      }),
      // qa_reg_1471–1480 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1471 + i).toString().padStart(4, '0')
        return `qa_reg_${n}`
      }),
    ],
    []
  )

  const rwaGamefiMix20Keys = useMemo(
    () => [
      // qa_rwa_1481–1490 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1481 + i).toString().padStart(4, '0')
        return `qa_rwa_${n}`
      }),
      // qa_gamefi_1491–1496 (6 пар)
      ...Array.from({ length: 6 }, (_, i) => {
        const n = (1491 + i).toString().padStart(4, '0')
        return `qa_gamefi_${n}`
      }),
      // qa_socialfi_1497–1500 (4 пар)
      ...Array.from({ length: 4 }, (_, i) => {
        const n = (1497 + i).toString().padStart(4, '0')
        return `qa_socialfi_${n}`
      }),
      // qa_ops_1501–1505 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1501 + i).toString().padStart(4, '0')
        return `qa_ops_${n}`
      }),
      // qa_data_1506–1510 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1506 + i).toString().padStart(4, '0')
        return `qa_data_${n}`
      }),
      // qa_ethics_1511–1515 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1511 + i).toString().padStart(4, '0')
        return `qa_ethics_${n}`
      }),
      // qa_future_1516–1520 (5 пар)
      ...Array.from({ length: 5 }, (_, i) => {
        const n = (1516 + i).toString().padStart(4, '0')
        return `qa_future_${n}`
      }),
      // qa_meta_1521–1530 (10 пар)
      ...Array.from({ length: 10 }, (_, i) => {
        const n = (1521 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    ],
    []
  )

  const meta21Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1531 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta22Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1581 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta23Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
       const n = (1631 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta24Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1681 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta25Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1731 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta26Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1781 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta27Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1831 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
   []
  )

  const meta28Keys = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => {
        const n = (1881 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  const meta29Keys = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const n = (1931 + i).toString().padStart(4, '0')
        return `qa_meta_${n}`
      }),
    []
  )

  return (
     <div className="page-content">
      <AcademyPaginator>
      <QASection
        imageSrc="/academy/defi_block_01.png"
        imageAlt="QL7 Academy — DeFi Module"
        titleKey="qa_ru_title_main"
        qaKeys={defiKeys}
      />
      <AcademyExamBlock blockId={1} />
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Второй блок: DeFi 051–100 */}
      <QASection
        imageSrc="/academy/defi_block_02.png" // положи баннер 2 в /public/academy
        imageAlt="QL7 Academy — DeFi Module 2"        
        qaKeys={defiKeys2}
        titleKey="qa_ru_title_main"
      />
     <AcademyExamBlock blockId={2} />
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Третий блок: Chain 101–150 */}
      <QASection
       imageSrc="/academy/chain_block_03.png" // баннер для цепочек в /public/academy
        imageAlt="QL7 Academy — Chain Module"      
        qaKeys={chainKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={3} />
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Четвёртый блок: Web3 201–230 + Security 301–320 */}
      <QASection
        imageSrc="/academy/web3_sec_block_04.png" // баннер для Web3/Security в /public/academy
        imageAlt="QL7 Academy — Web3 & Security Module"       
        qaKeys={web3SecKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={4} />
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Пятый блок: Security 321–350 + Trading 401–420 */}
      <QASection
        imageSrc="/academy/sec_trade_block_05.png" // баннер для Security/Trading в /public/academy
        imageAlt="QL7 Academy — Security & Trading Module"
        qaKeys={secTradeKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={5} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Шестой блок: Trading 421–450 + NFT 501–520 */}
      <QASection
        imageSrc="/academy/trade_nft_block_06.png" // баннер для Trading/NFT
        imageAlt="QL7 Academy — Trading & NFT Module"
        qaKeys={tradeNftKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={6} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Седьмой блок: NFT 521–530 + Reg 601–620 + AI 701–720 */}
      <QASection
        imageSrc="/academy/nft_reg_ai_block_07.png" // баннер для NFT/Reg/AI
        imageAlt="QL7 Academy — NFT, Regulation & AI Module"
        qaKeys={nftRegAiKeys}
        titleKey="qa_ru_title_main"
      />
       <AcademyExamBlock blockId={7} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Восьмой блок: DAO 801–820 + Meta 901–930 */}
      <QASection
        imageSrc="/academy/dao_meta_block_08.png"
        imageAlt="QL7 Academy — DAO & Metaverse Module"
        qaKeys={daoMetaKeys}
        titleKey="qa_ru_title_main"
      />   
       <AcademyExamBlock blockId={8} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Девятый блок: Meta 931–980 */}
      <QASection
        imageSrc="/academy/meta_block_09.png" // баннер для финального Meta-блока
        imageAlt="QL7 Academy — Metaverse Advanced Module"
        qaKeys={metaTailKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={9} />
 
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Десятый блок: Meta 981–1000 + GameFi 1001–1030 */}
      <QASection
        imageSrc="/academy/meta_gamefi_block_10.png" // баннер для Meta/GameFi
        imageAlt="QL7 Academy — Meta & GameFi Module"
        qaKeys={metaGamefiKeys}
        titleKey="qa_ru_title_main"
      />
       <AcademyExamBlock blockId={10} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Одиннадцатый блок: GameFi 1031–1050 + SocialFi 1051–1080 */}
      <QASection
        imageSrc="/academy/gamefi_socialfi_block_11.png" // баннер для GameFi/SocialFi
        imageAlt="QL7 Academy — GameFi & SocialFi Module"
        qaKeys={gamefiSocialfiKeys}
        titleKey="qa_ru_title_main"
      />
     <AcademyExamBlock blockId={11} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двенадцатый блок: SocialFi 1081–1100 + Dev 1101–1130 */}
      <QASection
        imageSrc="/academy/socialfi_dev_block_12.png" // баннер для SocialFi/Dev
        imageAlt="QL7 Academy — SocialFi & Dev Module"
        qaKeys={socialfiDevKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={12} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Тринадцатый блок: Dev 1131–1150 + Data 1151–1180 */}
      <QASection
        imageSrc="/academy/dev_data_block_13.png" // баннер для Dev/Data
        imageAlt="QL7 Academy — Dev & Data Module"
        qaKeys={devDataKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={13} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Четырнадцатый блок: Data 1181–1200 + AI 1201–1230 */}
      <QASection
        imageSrc="/academy/data_ai_block_14.png" // баннер для Data/AI
        imageAlt="QL7 Academy — Data & AI Module"
        qaKeys={dataAiKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={14} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Пятнадцатый блок: AI 1231–1280 */}
      <QASection
        imageSrc="/academy/ai_block_15.png" // баннер для продвинутого AI-модуля
        imageAlt="QL7 Academy — Advanced AI Module"
        qaKeys={aiDeepKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={15} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Шестнадцатый блок: AI 1281–1330 */}
      <QASection
        imageSrc="/academy/ai_block_16.png" // баннер для следующего AI-модуля
        imageAlt="QL7 Academy — AI Module II"
        qaKeys={aiNextKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={16} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Семнадцатый блок: AI 1331–1340 + Meta 1341–1380 */}
      <QASection
        imageSrc="/academy/ai_meta_block_17.png" // баннер для AI+Metaverse финального блока
        imageAlt="QL7 Academy — AI & Metaverse Module"
        qaKeys={aiMetaKeys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={17} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Восемнадцатый блок: Meta 1381–1400 + GameFi 1401–1410 + SocialFi 1411–1416 + Ops 1417–1420 + Data 1421–1425 + Meta 1426–1430 */}
      <QASection
        imageSrc="/academy/meta_mix_block_18.png"
        imageAlt="QL7 Academy — Meta/GameFi/SocialFi/Ops/Data Mix Module"
        qaKeys={metaMix18Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={18} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Девятнадцатый блок: Meta 1431–1460 + AI 1461–1470 + Reg 1471–1480 */}
      <QASection
        imageSrc="/academy/meta_ai_reg_block_19.png"
        imageAlt="QL7 Academy — Meta, AI & Regulations Module"
        qaKeys={metaAiReg19Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={19} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцатый блок:
          RWA 1481–1490 + GameFi 1491–1496 + SocialFi 1497–1500 +
          Ops 1501–1505 + Data 1506–1510 + Ethics 1511–1515 +
          Future 1516–1520 + Meta 1521–1530 */}
      <QASection
        imageSrc="/academy/rwa_gamefi_mix_block_20.png"
        imageAlt="QL7 Academy — RWA, GameFi, SocialFi, Ops, Data, Ethics, Future & Meta Module"
        qaKeys={rwaGamefiMix20Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={20} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать первый блок: Meta 1531–1580 */}
      <QASection
        imageSrc="/academy/meta_block_21.png"
        imageAlt="QL7 Academy — Metaverse Advanced Module"
        qaKeys={meta21Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={21} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать второй блок: Meta 1581–1630 */}
      <QASection
        imageSrc="/academy/meta_block_22.png"
        imageAlt="QL7 Academy — Metaverse Expert Module"
        qaKeys={meta22Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={22} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать третий блок: Meta 1631–1680 */}
      <QASection
       imageSrc="/academy/meta_block_23.png"
        imageAlt="QL7 Academy — Metaverse Ultra Module"
        qaKeys={meta23Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={23} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать четвертый блок: Meta 1681–1730 */}
      <QASection
        imageSrc="/academy/meta_block_24.png"
        imageAlt="QL7 Academy — Metaverse Infinity Module"
        qaKeys={meta24Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={24} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать пятый блок: Meta 1731–1780 */}
      <QASection
        imageSrc="/academy/meta_block_25.png"
        imageAlt="QL7 Academy — Metaverse Legend Module"
        qaKeys={meta25Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={25} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать шестой блок: Meta 1781–1830 */}
      <QASection
        imageSrc="/academy/meta_block_26.png"
        imageAlt="QL7 Academy — Metaverse Oracle Module"
        qaKeys={meta26Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={26} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
     {/* Двадцать седьмой блок: Meta 1831–1880 */}
      <QASection
        imageSrc="/academy/meta_block_27.png"
        imageAlt="QL7 Academy — Metaverse Infinity Module"
        qaKeys={meta27Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={27} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать восьмой блок: Meta 1881–1930 */}
      <QASection
        imageSrc="/academy/meta_block_28.png"
        imageAlt="QL7 Academy — Metaverse Deep Space Module"
        qaKeys={meta28Keys}
        titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={28} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
      {/* Двадцать девятый блок: Meta 1931–2000 (финальный) */}
      <QASection
        imageSrc="/academy/meta_block_29.png"
        imageAlt="QL7 Academy — Metaverse Final Frontier Module"
       qaKeys={meta29Keys}
       titleKey="qa_ru_title_main"
      />
      <AcademyExamBlock blockId={29} />

     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="academy_after_exam_1_2_3"
       slotKind="academy_after"
     />
     </AcademyPaginator>
      {/* Маркиза: использует глобальные стили из layout/home */}
      <section className="marquee-wrap no-gutters" aria-hidden="true">
        <div className="marquee" ref={marqueeRef}>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
          <span>{t('marquee')}</span>
        </div>
      </section>

      {/* Иконки снизу: те же, что на главной */}
      <div className="ql7-icons-row">
        <Link
          href="/privacy"
          className="ql7-icon-link"
          aria-label="Privacy / Политика"
          style={{ '--size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/policy.png"
            alt="Privacy"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>

        <Link
          href="/contact"
          className="ql7-icon-link"
          aria-label="Support / Поддержка"
          style={{ '--size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/support.png"
            alt="Support"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>
      </div>
    </div>
  )
}

export default function AcademyPage() {
  return <AcademyContent />
}
