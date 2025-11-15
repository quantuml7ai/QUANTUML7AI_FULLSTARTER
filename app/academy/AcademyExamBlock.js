// app/academy/AcademyExamBlock.js
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* ===================== AUTH / ACCOUNT ===================== */

// простейший парсер cookie без регэкспов
function ql7ReadCookie(name) {
  try {
    const cookies = document.cookie ? document.cookie.split(';') : []
    for (let i = 0; i < cookies.length; i += 1) {
      const part = cookies[i].trim()
      if (!part) continue
      const eq = part.indexOf('=')
      if (eq === -1) continue
      const key = decodeURIComponent(part.slice(0, eq))
      if (key === name) {
        return decodeURIComponent(part.slice(eq + 1))
      }
    }
    return null
  } catch (e) {
    return null
  }
}

// читаем accountId так же, как делает твой фронт / форум
function ql7ReadAccountId() {
  try {
    if (typeof window === 'undefined') return null

    if (window.__AUTH_ACCOUNT__) return String(window.__AUTH_ACCOUNT__)

    const ls = typeof localStorage !== 'undefined' ? localStorage : null

    const a1 = ls && (ls.getItem('asherId') || ls.getItem('ql7_uid'))
    const a2 =
      ls &&
      (ls.getItem('ql7_account') ||
        ls.getItem('account') ||
        ls.getItem('wallet'))
    const c1 = ql7ReadCookie('asherId')

    const val = a1 || a2 || c1
    return val ? String(val) : null
  } catch {
    return null
  }
}

// ensureAuthorized — open-auth + клик по кнопке + ожидание auth:ok/auth:success
async function ql7EnsureAuthorized() {
  if (typeof window === 'undefined') return null

  const getAcc = () =>
    window.__AUTH_ACCOUNT__ ||
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('wallet') ||
        localStorage.getItem('account') ||
        localStorage.getItem('ql7_account'))) ||
    null

  let acc = getAcc()
  if (acc) return acc

  try {
    window.dispatchEvent(new CustomEvent('open-auth'))
  } catch (e) {}

  try {
    const sels = [
      '[data-auth-open]',
      '.nav-auth-btn',
      '#nav-auth-btn',
      '[data-testid="auth-open"]',
    ]
    for (let i = 0; i < sels.length; i += 1) {
      const s = sels[i]
      const btn = document.querySelector(s)
      if (btn && typeof btn.click === 'function') {
        btn.click()
        break
      }
    }
  } catch (e) {}

  acc = await new Promise(function (resolve) {
    function done(e) {
      const id =
        (e && e.detail && e.detail.accountId) ||
        getAcc()
      if (id) resolve(id)
    }
    window.addEventListener('auth:ok', done, { once: true })
    window.addEventListener('auth:success', done, { once: true })

    setTimeout(function () {
      resolve(getAcc())
    }, 120000)
  })

  return acc || null
}

/* ===================== VIP / PAYMENTS ===================== */

async function ql7FetchVipStatus(accountId) {
  if (!accountId) return { isVip: false, untilISO: null }
  try {
    const r = await fetch('/api/subscription/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    const j = await r.json().catch(function () {
      return {}
    })
    return { isVip: !!(j && j.isVip), untilISO: (j && j.untilISO) || null }
  } catch (e) {
    return { isVip: false, untilISO: null }
  }
}

async function ql7CreateVipInvoice(accountId) {
  const r = await fetch('/api/pay/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  })
  const j = await r.json().catch(function () {
    return {}
  })
  if (!r.ok) throw new Error((j && j.error) || 'Create failed')
  if (j && j.url) return j.url
  throw new Error('No payment URL returned')
}

/* ===================== X2 BADGE (твои стили, префикс ql7) ===================== */

function QL7QCoinX2Badge({ vip, onClick }) {
  return (
    <>
      <span
        className={'ql7-qcoinX2 ' + (vip ? 'vip' : 'needVip')}
        onClick={vip ? undefined : onClick}
        role={vip ? 'status' : 'button'}
        tabIndex={vip ? -1 : 0}
        aria-label={vip ? 'VIP x2 active' : 'Get VIP x2'}
        onKeyDown={function (e) {
          if (!vip && (e.key === 'Enter' || e.key === ' ')) {
            if (onClick) onClick()
          }
        }}
      >
        ×2
      </span>

      <style jsx>{`
        .ql7-qcoinX2 {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          height: 28px;
          padding: 0 6px;
          border-radius: 999px;
          font: 700 16px/1.1 ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
            Roboto;
          letter-spacing: 0.5px;
          color: #1a1200;
          background: linear-gradient(180deg, #ffde6a, #ffbc3d);
          box-shadow:
            0 0 12px rgba(255, 210, 90, 0.45),
            inset 0 0 0 1px rgba(255, 255, 255, 0.25),
            0 1px 0 0 rgba(0, 0, 0, 0.35);
          text-shadow: 0 0 8px rgba(255, 220, 120, 0.65);
          position: relative;
          overflow: hidden;
          animation: ql7QcoinX2Pulse 1.6s ease-in-out infinite;
        }

        .ql7-qcoinX2.vip {
          background: linear-gradient(
            135deg,
            #7a5c00 0%,
            #ffd700 18%,
            #fff4b3 32%,
            #ffd700 46%,
            #ffea80 60%,
            #b38400 74%,
            #ffd700 88%,
            #7a5c00 100%
          );
          background-size: 200% 100%;
          color: #1a1000;
          border: 1px solid rgba(255, 215, 0, 0.45);
          box-shadow: 0 0 18px rgba(255, 215, 0, 0.25);
          animation: ql7QcoinShine 6s linear infinite,
            ql7QcoinGlow 2.8s ease-in-out infinite;
          cursor: default;
        }

        .ql7-qcoinX2.needVip {
          background: rgba(255, 70, 70, 0.18);
          color: #fff;
          border: 1px solid rgba(255, 120, 120, 0.6);
          box-shadow: 0 0 12px rgba(255, 70, 70, 0.35);
          animation: ql7BlinkPause 0.9s steps(1) infinite;
          cursor: pointer;
        }

        @keyframes ql7QcoinX2Pulse {
          0%,
          100% {
            filter: brightness(1);
            box-shadow:
              0 0 10px rgba(255, 210, 90, 0.3),
              inset 0 0 0 1px rgba(255, 255, 255, 0.22),
              0 1px 0 0 rgba(0, 0, 0, 0.35);
          }
          50% {
            filter: brightness(1.15);
            box-shadow:
              0 0 16px rgba(255, 210, 90, 0.7),
              inset 0 0 0 1px rgba(255, 255, 255, 0.35),
              0 1px 0 0 rgba(0, 0, 0, 0.35);
          }
        }

        @keyframes ql7QcoinShine {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        @keyframes ql7QcoinGlow {
          0%,
          100% {
            filter: brightness(1);
            box-shadow:
              0 0 10px rgba(255, 210, 90, 0.3),
              inset 0 0 0 1px rgba(255, 255, 255, 0.22),
              0 1px 0 0 rgba(0, 0, 0, 0.35);
          }
          50% {
            filter: brightness(1.15);
            box-shadow:
              0 0 18px rgba(255, 210, 90, 0.7),
              inset 0 0 0 1px rgba(255, 255, 255, 0.35);
          }
        }

        @keyframes ql7BlinkPause {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0.45;
          }
        }
      `}</style>
    </>
  )
}
function openPaymentWindow(url, accountId) {
  if (!url) return

  try {
    const ua =
      typeof navigator !== 'undefined'
        ? navigator.userAgent.toLowerCase()
        : ''

    const isIOS =
      ua.includes('iphone') ||
      ua.includes('ipad') ||
      ua.includes('ipod')

    const isTG =
      typeof window !== 'undefined' &&
      window.Telegram &&
      window.Telegram.WebApp &&
      typeof window.Telegram.WebApp.openLink === 'function'

    // 1) Внутри Telegram Mini App – как раньше, напрямую на NOWPayments
    if (isTG) {
      window.Telegram.WebApp.openLink(url)
      return
    }

    // 2) Любой iOS (Safari / Chrome / PWA / "домик")
    if (isIOS) {
      // Если знаем accountId → пусть сервер сам создаст invoice и сделает 302
      if (accountId) {
        window.location.href =
          `/api/pay/create?accountId=${encodeURIComponent(accountId)}`
      } else {
        // на всякий пожарный, если accountId не прокинули
        window.location.href = url
      }
      return
    }

    // 3) Обычные браузеры (десктоп / Android)
    const w = window.open(url, '_blank', 'noopener,noreferrer')

    // Если попап заблокировали – фоллбек в текущую вкладку
    if (!w) {
      window.location.href = url
    }
  } catch {
    try {
      window.location.href = url
    } catch {}
  }
}

/* ===================== ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ ===================== */

function formatReward(val) {
  const num = Number(val || 0)
  if (!Number.isFinite(num) || num <= 0) return '0'
  if (num >= 1) return num.toFixed(2).replace(/\.?0+$/, '')
  return num.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

// один генератор ключей: учитываем 3/4 знака (до 999 и после 1000)
function makeQaRange(prefix, start, count) {
  const out = []
  for (let i = 0; i < count; i += 1) {
    const num = start + i
    const width = num >= 1000 ? 4 : 3
    const n = String(num).padStart(width, '0')
    out.push(prefix + n)
  }
  return out
}

// ОДНА утилита: какие qa_* ключи относятся к блоку 1..29
function getQaKeysForBlock(blockId) {
  switch (blockId) {
    case 1:
      return makeQaRange('qa_defi_', 1, 50)
    case 2:
      return makeQaRange('qa_defi_', 51, 50)
    case 3:
      return makeQaRange('qa_chain_', 101, 50)
    case 4:
      return [
        ...makeQaRange('qa_web3_', 201, 30),
        ...makeQaRange('qa_sec_', 301, 20),
      ]
    case 5:
      return [
        ...makeQaRange('qa_sec_', 321, 30),
        ...makeQaRange('qa_trade_', 401, 20),
      ]
    case 6:
      return [
        ...makeQaRange('qa_trade_', 421, 30),
        ...makeQaRange('qa_nft_', 501, 20),
      ]
    case 7:
      return [
        ...makeQaRange('qa_nft_', 521, 10),
        ...makeQaRange('qa_reg_', 601, 20),
        ...makeQaRange('qa_ai_', 701, 20),
      ]
    case 8:
      return [
        ...makeQaRange('qa_dao_', 801, 20),
        ...makeQaRange('qa_meta_', 901, 30),
      ]
    case 9:
      return makeQaRange('qa_meta_', 931, 50)
    case 10:
      return [
        ...makeQaRange('qa_meta_', 981, 20),
        ...makeQaRange('qa_gamefi_', 1001, 30),
      ]
    case 11:
      return [
        ...makeQaRange('qa_gamefi_', 1031, 20),
        ...makeQaRange('qa_socialfi_', 1051, 30),
      ]
    case 12:
      return [
        ...makeQaRange('qa_socialfi_', 1081, 20),
        ...makeQaRange('qa_dev_', 1101, 30),
      ]
    case 13:
      return [
        ...makeQaRange('qa_dev_', 1131, 20),
        ...makeQaRange('qa_data_', 1151, 30),
      ]
    case 14:
      return [
        ...makeQaRange('qa_data_', 1181, 20),
        ...makeQaRange('qa_ai_', 1201, 30),
      ]
    case 15:
      return makeQaRange('qa_ai_', 1231, 50)
    case 16:
      return makeQaRange('qa_ai_', 1281, 50)
    case 17:
      return [
        ...makeQaRange('qa_ai_', 1331, 10),
        ...makeQaRange('qa_meta_', 1341, 40),
      ]
    case 18:
      return [
        ...makeQaRange('qa_meta_', 1381, 20),
        ...makeQaRange('qa_gamefi_', 1401, 10),
        ...makeQaRange('qa_socialfi_', 1411, 6),
        ...makeQaRange('qa_ops_', 1417, 4),
        ...makeQaRange('qa_data_', 1421, 5),
        ...makeQaRange('qa_meta_', 1426, 5),
      ]
    case 19:
      return [
        ...makeQaRange('qa_meta_', 1431, 30),
        ...makeQaRange('qa_ai_', 1461, 10),
        ...makeQaRange('qa_reg_', 1471, 10),
      ]
    case 20:
      return [
        ...makeQaRange('qa_rwa_', 1481, 10),
        ...makeQaRange('qa_gamefi_', 1491, 6),
        ...makeQaRange('qa_socialfi_', 1497, 4),
        ...makeQaRange('qa_ops_', 1501, 5),
        ...makeQaRange('qa_data_', 1506, 5),
        ...makeQaRange('qa_ethics_', 1511, 5),
        ...makeQaRange('qa_future_', 1516, 5),
        ...makeQaRange('qa_meta_', 1521, 10),
      ]
    case 21:
      return makeQaRange('qa_meta_', 1531, 50)
    case 22:
      return makeQaRange('qa_meta_', 1581, 50)
    case 23:
      return makeQaRange('qa_meta_', 1631, 50)
    case 24:
      return makeQaRange('qa_meta_', 1681, 50)
    case 25:
      return makeQaRange('qa_meta_', 1731, 50)
    case 26:
      return makeQaRange('qa_meta_', 1781, 50)
    case 27:
      return makeQaRange('qa_meta_', 1831, 50)
    case 28:
      return makeQaRange('qa_meta_', 1881, 50)
    case 29:
      return makeQaRange('qa_meta_', 1931, 70)
    default:
      return []
  }
}

// перемешивание массива
function shuffleArray(arr) {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

/* ===================== КОМПОНЕНТ ЭКЗАМЕНА ===================== */

export default function AcademyExamBlock({ blockId }) {
  const { t } = useI18n()

  const [accountId, setAccountId] = useState(null)
  const [vip, setVip] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [baseReward, setBaseReward] = useState(0)
  const [currentReward, setCurrentReward] = useState(0)
  const [nextReward, setNextReward] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [completed, setCompleted] = useState(false)

  const [lastAnswer, setLastAnswer] = useState(null) // { letter, correct, awarded }
  const [now, setNow] = useState(
    typeof Date !== 'undefined' ? Date.now() : 0
  )

  // FX для награды
  const [showAwardFx, setShowAwardFx] = useState(false)

  // ключи блока: qa_* для этого blockId
  const qaKeys = useMemo(
    function () {
      return getQaKeysForBlock(blockId)
    },
    [blockId]
  )

  // порядок вопросов в пределах блока (рандом)
  const [questionOrder, setQuestionOrder] = useState([])

  // текущий вопрос и варианты ответа
  const [questionText, setQuestionText] = useState('')
  const [answerOptions, setAnswerOptions] = useState([]) // {letter,text,correct}
  const [correctLetter, setCorrectLetter] = useState('A')

  // тикер для таймера
  useEffect(function () {
    const id = setInterval(function () {
      setNow(Date.now())
    }, 1000)
    return function () {
      clearInterval(id)
    }
  }, [])

  const cooldownMs = Math.max(0, cooldownUntil - now)
  const inCooldown = cooldownMs > 0

  /* ===== единая утилита загрузки состояния с сервера ===== */

  async function fetchExamState(blockIdArg, accId, isVipArg, options) {
    const silent = options && options.silent
    try {
      if (!silent) setLoading(true)
      setError(null)

      const headers = {}
      if (accId) headers['x-forum-user-id'] = String(accId)
      headers['x-forum-vip'] = isVipArg ? '1' : '0'

      const res = await fetch(
        '/api/academy/exam?blockId=' + encodeURIComponent(blockIdArg),
        {
          method: 'GET',
          headers: headers,
          cache: 'no-store',
        }
      )

      if (res.status === 401) {
        setDone(0)
        setTotal(0)
        setBaseReward(0)
        setCurrentReward(0)
        setNextReward(0)
        setCooldownUntil(0)
        setCompleted(false)
        return
      }

      const data = await res.json().catch(function () {
        return {}
      })
      if (!data || !data.ok) {
        throw new Error((data && data.error) || 'exam_error')
      }

      setDone(data.done || 0)
      setTotal(data.total || 0)
      setBaseReward(data.baseReward || 0)
      setCurrentReward(data.currentReward || data.baseReward || 0)
      setNextReward(data.nextReward || 0)
      setCooldownUntil(data.cooldownUntil || 0)
      setCompleted(!!data.completed)
    } catch (e) {
      if (!silent) {
        // eslint-disable-next-line no-console
        console.error(e)
        setError(String(e && e.message ? e.message : e))
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // первичная инициализация: читаем аккаунт + VIP + состояние экзамена
  useEffect(
    function () {
      let cancelled = false

      async function init() {
        try {
          setLoading(true)
          setError(null)

          const acc = ql7ReadAccountId()
          if (!cancelled) setAccountId(acc || null)

          let isVip = false
          if (acc) {
            const st = await ql7FetchVipStatus(acc)
            isVip = !!(st && st.isVip)
          }
          if (!cancelled) setVip(isVip)

          if (!cancelled) {
            await fetchExamState(blockId, acc || null, isVip, {
              silent: true,
            })
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      }

      init()

      return function () {
        cancelled = true
      }
    },
    [blockId]
  )

  // слушаем глобальные события авторизации (как на форуме)
  useEffect(
    function () {
      if (typeof window === 'undefined') return undefined

      function handleAuthEvent() {
        const acc = ql7ReadAccountId()
        if (!acc) return
        setAccountId(acc)
        ;(async function () {
          const st = await ql7FetchVipStatus(acc)
          const isVip = !!(st && st.isVip)
          setVip(isVip)
          await fetchExamState(blockId, acc, isVip, { silent: false })
        })()
      }

      window.addEventListener('auth:ok', handleAuthEvent)
      window.addEventListener('auth:success', handleAuthEvent)

      return function () {
        window.removeEventListener('auth:ok', handleAuthEvent)
        window.removeEventListener('auth:success', handleAuthEvent)
      }
    },
    [blockId]
  )

  // когда есть total и qaKeys — строим рандомный порядок вопросов
  useEffect(
    function () {
      if (!qaKeys.length) {
        setQuestionOrder([])
        return
      }
      const effectiveTotal = Math.min(
        total || qaKeys.length,
        qaKeys.length
      )
      if (!effectiveTotal) {
        setQuestionOrder([])
        return
      }
      const indices = []
      for (let i = 0; i < effectiveTotal; i += 1) {
        indices.push(i)
      }
      setQuestionOrder(shuffleArray(indices))
    },
    [qaKeys, total, blockId]
  )

  // строим текущий вопрос + 4 варианта (1 верный + 3 неверных)
  useEffect(
    function () {
      if (!qaKeys.length || !questionOrder.length) {
        setQuestionText('')
        setAnswerOptions([])
        setCorrectLetter('A')
        return
      }

      const effectiveTotal = questionOrder.length
      if (done >= effectiveTotal) {
        setQuestionText('')
        setAnswerOptions([])
        return
      }

      const questionIndex = questionOrder[done]
      const baseKey = qaKeys[questionIndex]
      if (!baseKey) {
        setQuestionText('')
        setAnswerOptions([])
        return
      }

      const qText = t(baseKey + '_q')
      const correctText = t(baseKey + '_a')

      // собираем индексы для неверных ответов
      const pool = []
      for (let i = 0; i < qaKeys.length; i += 1) {
        if (i !== questionIndex) pool.push(i)
      }

      let wrongIndices = []
      if (pool.length >= 3) {
        wrongIndices = shuffleArray(pool).slice(0, 3)
      } else if (pool.length > 0) {
        const sh = shuffleArray(pool)
        while (wrongIndices.length < 3) {
          wrongIndices.push(sh[wrongIndices.length % sh.length])
        }
      }

      const answers = [{ text: correctText, correct: true }]
      for (let i = 0; i < wrongIndices.length; i += 1) {
        const k = qaKeys[wrongIndices[i]]
        answers.push({ text: t(k + '_a'), correct: false })
      }
      while (answers.length < 4) {
        answers.push({ text: '', correct: false })
      }

      const letters = ['A', 'B', 'C', 'D']
      const order = shuffleArray([0, 1, 2, 3])
      const opts = order.map(function (idx, pos) {
        const a = answers[idx]
        return {
          letter: letters[pos],
          text: a ? a.text : '',
          correct: !!(a && a.correct),
        }
      })

      let corr = 'A'
      for (let i = 0; i < opts.length; i += 1) {
        if (opts[i].correct) {
          corr = opts[i].letter
          break
        }
      }

      setQuestionText(qText)
      setAnswerOptions(opts)
      setCorrectLetter(corr)
    },
    [qaKeys, questionOrder, done, t]
  )

  // обработчик клика по X2 — покупка VIP
  const handleVipClick = async function () {
    try {
      const acc = await ql7EnsureAuthorized()
      if (!acc) return
      setAccountId(acc)

      const url = await ql7CreateVipInvoice(acc)
      if (url) {
      openPaymentWindow(url, accountId)     
    }

      setTimeout(async function () {
        const st = await ql7FetchVipStatus(acc)
        const isVip = !!(st && st.isVip)
        setVip(isVip)
        await fetchExamState(blockId, acc, isVip, { silent: false })
      }, 5000)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      alert('Payment error: ' + (e && e.message ? e.message : e))
    }
  }

  // ответ на вопрос: A/B/C/D
  const handleAnswer = async function (letter) {
    if (loading || completed || inCooldown) return

    // если ещё не авторизован — запускаем авторизацию и не пускаем дальше
    if (!accountId) {
      const acc = await ql7EnsureAuthorized()
      if (!acc) return // отказался — ответа нет, монет нет
      setAccountId(acc)
      const st = await ql7FetchVipStatus(acc)
      const isVip = !!(st && st.isVip)
      setVip(isVip)
      await fetchExamState(blockId, acc, isVip, { silent: false })
      return
    }

    const isCorrect = letter === correctLetter

    try {
      setLoading(true)
      setError(null)

      const headers = { 'Content-Type': 'application/json' }
      headers['x-forum-user-id'] = String(accountId)
      headers['x-forum-vip'] = vip ? '1' : '0'

      const res = await fetch('/api/academy/exam', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          blockId: blockId,
          correct: !!isCorrect,
        }),
      })

      if (res.status === 401) {
        // сервер говорит "не авторизован" → чистим и при следующем клике снова запросим auth
        setAccountId(null)
        return
      }

      const data = await res.json().catch(function () {
        return {}
      })
      if (!data || !data.ok) {
        throw new Error((data && data.error) || 'exam_error')
      }

      const awarded = data.awarded || 0

      setDone(data.done || 0)
      setTotal(data.total || 0)
      setBaseReward(data.baseReward || 0)
      setCurrentReward(data.currentReward || data.baseReward || 0)
      setNextReward(data.nextReward || 0)
      setCooldownUntil(data.cooldownUntil || 0)
      setCompleted(!!data.completed)

      setLastAnswer({
        letter: letter,
        correct: isCorrect,
        awarded: awarded,
      })

      // FX: только если реально что-то начислилось
      if (isCorrect && awarded > 0) {
        setShowAwardFx(true)
        setTimeout(function () {
          setShowAwardFx(false)
        }, 2600)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      setError(String(e && e.message ? e.message : e))
    } finally {
      setLoading(false)
    }
  }

  const rewardDisplay = useMemo(
    function () {
      if (currentReward) return formatReward(currentReward)
      if (baseReward) {
        const base = vip ? baseReward * 2 : baseReward
        return formatReward(base)
      }
      return '0'
    },
    [currentReward, baseReward, vip]
  )

  const nextRewardDisplay = useMemo(
    function () {
      if (!nextReward) return null
      return formatReward(nextReward)
    },
    [nextReward]
  )

  const waitLabel = useMemo(
    function () {
      if (!inCooldown) return null
      const sec = Math.max(0, Math.round(cooldownMs / 1000))
      const mm = Math.floor(sec / 60)
      const ss = String(sec % 60).padStart(2, '0')
      const prefix = t('academy_exam_wait') || 'Ожидай'
      return prefix + ' ' + mm + ':' + ss
    },
    [t, inCooldown, cooldownMs]
  )

  const title = t('ACADEMY_EXAM_TITLE')
  const rewardLabel = t('academy_exam_reward_label')
  const authRequiredLabel = t('academy_exam_auth_required')

  const completedLabel = t('academy_exam_done_label') || 'Экзамен пройден'
  const completedHint =
    t('academy_exam_done_hint') || 'Переходи к следующему блоку Академии.'

  const congratsLabel =
    t('academy_exam_congrats') || 'Congratulations!'

  const isAuthed = !!accountId

  return (
    <section className="QL7-exam">
{/* FX оверлей при начислении награды — как на форуме, full-screen */}
{showAwardFx && lastAnswer && lastAnswer.awarded > 0 && (
  <div className="QL7-coinBurstOverlay" aria-hidden="true">
    <div className="QL7-coinBurstBox">
      <div className="QL7-coinSum">
        +{formatReward(lastAnswer.awarded)} QCoin
      </div>
      <div className="QL7-coinCongrats">{congratsLabel}</div>
    </div>

    {Array.from({ length: 60 }).map(function (_, i) {
      const lane = i % 20
      return (
        <div
          key={i}
          className="QL7-coinPiece"
          style={{
            left: `${5 + lane * 4.5}%`,
            animationDuration: `${1.6 + (i % 5) * 0.2}s`,
            animationDelay: `${(i % 20) * 0.05}s`,
          }}
        />
      )
    })}
  </div>
)}


      <div className="QL7-exam-header">
        <div className="QL7-exam-title">{title}</div>

        <div className="QL7-exam-reward">
          <span className="QL7-exam-reward-label">{rewardLabel}</span>
          <span className="QL7-exam-reward-value">
            {rewardDisplay} QCoin
          </span>
          <QL7QCoinX2Badge vip={vip} onClick={handleVipClick} />
        </div>
      </div>

      {/* верхний разделитель — как в QASection */}
      <div className="QL7-divider">
        <span className="QL7-divider-line" />
        <span className="QL7-divider-pulse" />
        <span className="QL7-divider-line" />
      </div>

      {completed ? (
        <div className="QL7-exam-completed">
          <div className="QL7-completed-title">{completedLabel}</div>
          <div className="QL7-completed-sub">{completedHint}</div>
        </div>
      ) : (
        <>
          {!isAuthed && (
            <div className="QL7-exam-auth-hint">
              <div className="QL7-auth-text">{authRequiredLabel}</div>
            </div>
          )}

          {/* карточка вопроса */}
          <div className="QL7-question-card">
            <div className="QL7-question-meta">
              {total ? (
                <span>
                  {Math.min(done + 1, total)}/{total}
                </span>
              ) : (
                <span />
              )}
              {nextRewardDisplay && (
                <span className="QL7-next-reward">
                  {t('academy_exam_next_reward') || 'Следующая награда'}:{' '}
                  <span className="gold">
                    +{nextRewardDisplay}
                  </span>
                </span>
              )}
            </div>

            <div className="QL7-question-text">{questionText}</div>

            <div className="QL7-answers-grid">
              {answerOptions.map(function (opt) {
                const letter = opt.letter
                const text = opt.text
                const isLast =
                  lastAnswer && lastAnswer.letter === letter
                const lastCorrect =
                  lastAnswer && lastAnswer.correct

                const classes = ['QL7-answer']
                if (inCooldown) classes.push('cooldown')
                if (isLast && lastCorrect) classes.push('correct')
                if (isLast && lastCorrect === false)
                  classes.push('wrong')

                return (
                  <button
                    key={letter}
                    type="button"
                    className={classes.join(' ')}
                    disabled={inCooldown || loading || completed}
                    onClick={function () {
                      handleAnswer(letter)
                    }}
                  >
                    <span className="QL7-answer-letter">
                      {letter}
                    </span>
                    <span className="QL7-answer-text">{text}</span>
                  </button>
                )
              })}
            </div>

            <div className="QL7-status-row">
              {waitLabel && (
                <div className="QL7-wait-label">⏳ {waitLabel}</div>
              )}

              {lastAnswer && (
                <div
                  className={
                    'QL7-last-answer ' +
                    (lastAnswer.correct ? 'ok' : 'fail')
                  }
                >
                  {lastAnswer.correct
                    ? t('academy_exam_answer_ok') || 'Правильно!'
                    : t('academy_exam_answer_fail') ||
                      'Неправильно'}
                  {lastAnswer.awarded
                    ? ' +' + formatReward(lastAnswer.awarded)
                    : ''}
                </div>
              )}

              {error && (
                <div className="QL7-last-answer fail">
                  {t('academy_exam_error') || 'Ошибка'}:{' '}
                  {error}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* нижний разделитель — такой же */}
      <div className="QL7-divider QL7-divider-bottom">
        <span className="QL7-divider-line" />
        <span className="QL7-divider-pulse" />
        <span className="QL7-divider-line" />
      </div>

      <style jsx>{`
        .QL7-exam {
          position: relative;
          margin-top: 12px;
          margin-bottom: 12px;
          padding: 12px 14px 14px;
          border-radius: 14px;
          background: radial-gradient(
              circle at 0% 0%,
              rgba(0, 255, 255, 0.22),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(56, 189, 248, 0.2),
              transparent 55%
            ),
            rgba(2, 6, 23, 0.92);
          border: 1px solid rgba(148, 163, 253, 0.35);
          box-shadow:
            0 0 34px rgba(15, 23, 42, 0.88),
            0 0 0 1px rgba(15, 23, 42, 0.95) inset;
          overflow: hidden;
        }
        /* FX оверлей зачисления с дождём монет — под 4 секунды */
        .QL7-award-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }

        .QL7-award-pulse {
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(250, 204, 21, 0.9),
            transparent 65%
          );
          filter: blur(1px);
          /* было ~2.4s → делаем 4s */
          animation: QL7awardPulse 4s ease-out forwards;
        }

        .QL7-award-main {
          position: relative;
          padding: 14px 18px;
          border-radius: 18px;
          background: radial-gradient(
              circle at 0% 0%,
              rgba(250, 250, 250, 0.2),
              transparent 55%
            ),
            rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(250, 204, 21, 0.9);
          box-shadow:
            0 0 32px rgba(250, 204, 21, 0.95),
            0 0 0 1px rgba(15, 23, 42, 0.95);
          text-align: center;
          /* поп-анимка оставляем быстрой (вылет), а fade растягиваем до 4s */
          animation: QL7awardPop 0.22s cubic-bezier(0.16, 1, 0.3, 1),
            QL7awardFade 4s ease-out forwards;
        }

        .QL7-award-title {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fefce8;
          text-shadow:
            0 0 12px rgba(250, 250, 210, 1),
            0 0 22px rgba(250, 204, 21, 0.9);
          white-space: nowrap;
        }

        .QL7-award-sub {
          margin-top: 4px;
          font-size: 14px;
          font-weight: 600;
          color: #e5f3ff;
          opacity: 0.96;
        }

        .QL7-award-rain {
          position: absolute;
          inset: -40px 0 0 0;
          overflow: visible;
        }

        .QL7-coin {
          position: absolute;
          top: -40px;
          font-size: 20px;
          pointer-events: none;
          opacity: 0;
          color: #facc15;
          text-shadow:
            0 0 6px rgba(250, 204, 21, 0.8),
            0 0 14px rgba(250, 250, 210, 0.9);
        }

/* === FX: Coin Burst как на форуме, но под QCoin === */
.QL7-coinBurstOverlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

.QL7-coinBurstBox {
  background: radial-gradient(ellipse at center, #1d1d1d 0%, #0e0e0e 60%, #000 100%);
  border: 1px solid rgba(255, 215, 0, 0.25);
  box-shadow:
    0 0 40px rgba(255, 215, 0, 0.25),
    inset 0 0 40px rgba(255, 215, 0, 0.08);
  border-radius: 18px;
  padding: 24px 22px;
  width: min(520px, 92vw);
  text-align: center;
  color: #ffd700;
  animation: ql7CoinPop 0.35s ease-out;
}

.QL7-coinSum {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-shadow: 0 0 18px rgba(255, 215, 0, 0.55);
  margin: 6px 0 14px;
}

.QL7-coinCongrats {
  font-size: 18px;
  color: #ffeaa7;
  opacity: 0.95;
}

/* Одна монетка QCoin — берём реальный спрайт */
.QL7-coinPiece {
  position: fixed;
  top: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-image: url('/qcoin-32.png'); /* поменяй путь, если файл в другом месте */
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 14px rgba(255, 215, 0, 0.75);
  animation-name: ql7CoinFall;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* попап коробки */
@keyframes ql7CoinPop {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  60% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* падение монет, как на форуме: из -120vh в +120vh с вращением */
@keyframes ql7CoinFall {
  0% {
    transform: translateY(-120vh) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translateY(120vh) rotate(720deg);
    opacity: 0;
  }
}


        .QL7-exam-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .QL7-exam-title {
          font-size: 16px; /* заголовок оставляем как просил */
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #e0f2fe;
          text-shadow:
            0 0 12px rgba(56, 189, 248, 0.9),
            0 0 24px rgba(56, 189, 248, 0.7);
        }

        .QL7-exam-reward {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px; /* было 13 — чуть больше */
        }

        .QL7-exam-reward-label {
          opacity: 0.9;
          color: #9ca3af;
        }

        .QL7-exam-reward-value {
          padding: 4px 10px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 0%,
            rgba(253, 224, 71, 0.95),
            rgba(245, 158, 11, 0.98)
          );
          background-size: 220% 100%;
          color: #1a1200;
          font-weight: 800;
          box-shadow:
            0 0 18px rgba(252, 211, 77, 0.75),
            0 0 0 1px rgba(253, 224, 71, 0.95);
          text-shadow: 0 0 8px rgba(255, 237, 170, 0.9);
          animation: QL7rewardShine 6s linear infinite,
            QL7rewardGlow 2.6s ease-in-out infinite;
        }

        /* разделитель — как в QASection */
        .QL7-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 10px auto 18px;
          position: relative;
          z-index: 1;
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
          animation: QL7dividerPulse 1.6s ease-in-out infinite;
        }

        .QL7-divider-bottom {
          margin-top: 12px;
          margin-bottom: 4px;
        }

        .QL7-exam-auth-hint {
          margin: 6px 0 10px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px dashed rgba(251, 146, 60, 0.8);
          background: rgba(30, 64, 175, 0.35);
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .QL7-auth-text {
          font-size: 14px; /* было 13 */
          color: #fed7aa;
        }

        .QL7-question-card {
          margin-top: 4px;
          border-radius: 14px;
          padding: 10px 10px 8px;
          background: radial-gradient(
              circle at 50% -20%,
              rgba(59, 130, 246, 0.9),
              transparent 60%
            ),
            radial-gradient(
              circle at 0% 120%,
              rgba(22, 163, 74, 0.8),
              transparent 55%
            ),
            radial-gradient(
              circle at 100% 130%,
              rgba(239, 68, 68, 0.9),
              transparent 55%
            ),
            rgba(15, 23, 42, 0.98);
          box-shadow:
            0 0 40px rgba(15, 23, 42, 0.9),
            0 0 0 1px rgba(15, 23, 42, 0.95) inset;
          position: relative;
          z-index: 1;
        }

        .QL7-question-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px; /* было 12 */
          margin-bottom: 4px;
          color: #bfdbfe;
        }

        .QL7-next-reward .gold {
          color: #facc15;
          text-shadow: 0 0 8px rgba(250, 204, 21, 0.8);
        }

        .QL7-question-text {
          border-radius: 999px;
          padding: 9px 13px;
          background: radial-gradient(
            circle at 50% 0%,
            rgba(30, 64, 175, 0.9),
            rgba(15, 23, 42, 0.98)
          );
          border: 1px solid rgba(191, 219, 254, 0.5);
          font-weight: 700;
          color: #eff6ff;
          text-align: center;
          margin-bottom: 8px;
          font-size: 15px; /* было 14 */
        }

        .QL7-answers-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .QL7-answer {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 253, 0.4);
          background: radial-gradient(
            circle at 50% 0%,
            rgba(30, 64, 175, 0.7),
            rgba(15, 23, 42, 0.98)
          );
          color: #e5e7eb;
          font-size: 14px; /* было 13 */
          cursor: pointer;
          box-shadow: 0 0 16px rgba(15, 23, 42, 0.9);
          transition:
            background 0.15s ease,
            transform 0.12s ease,
            box-shadow 0.12s ease,
            border-color 0.15s ease;
        }

        .QL7-answer:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 0 22px rgba(56, 189, 248, 0.55),
            0 0 0 1px rgba(56, 189, 248, 0.35);
        }

        .QL7-answer:disabled {
          cursor: default;
          opacity: 0.85;
        }

        .QL7-answer.cooldown {
          opacity: 0.45;
        }

        .QL7-answer-letter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 13px; /* было 12 */
          background: radial-gradient(
            circle at 30% 30%,
            rgba(248, 250, 252, 0.95),
            rgba(191, 219, 254, 1)
          );
          color: #1e293b;
          box-shadow:
            0 0 12px rgba(148, 163, 253, 0.95),
            0 0 0 1px rgba(30, 64, 175, 0.95);
        }

        .QL7-answer-text {
          flex: 1;
          text-align: left;
        }

        .QL7-answer.correct {
          border-color: rgba(34, 197, 94, 0.96);
          background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 1),
            rgba(22, 163, 74, 0.98)
          );
          color: #022c22;
          box-shadow:
            0 0 26px rgba(22, 163, 74, 0.9),
            0 0 0 1px rgba(34, 197, 94, 0.9);
        }

        .QL7-answer.wrong {
          border-color: rgba(239, 68, 68, 0.96);
          background: linear-gradient(
            135deg,
            rgba(248, 113, 113, 1),
            rgba(185, 28, 28, 0.98)
          );
          color: #fef2f2;
          box-shadow:
            0 0 26px rgba(248, 113, 113, 0.9),
            0 0 0 1px rgba(239, 68, 68, 0.9);
          animation: QL7shake 0.22s ease-in-out; /* шейк на неправильный ответ */
        }

        @keyframes QL7shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-3px);
          }
          40% {
            transform: translateX(3px);
          }
          60% {
            transform: translateX(-3px);
          }
          80% {
            transform: translateX(3px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .QL7-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 7px;
          gap: 8px;
          min-height: 20px;
        }

        .QL7-wait-label {
          font-size: 13px; /* было 12 */
          color: #bfdbfe;
          opacity: 0.9;
        }

        .QL7-last-answer {
          font-size: 13px; /* было 12 */
          font-weight: 700;
          text-align: right;
        }

        .QL7-last-answer.ok {
          color: #bbf7d0;
        }

        .QL7-last-answer.fail {
          color: #fecaca;
        }

        .QL7-exam-completed {
          margin-top: 6px;
          padding: 16px 12px;
          border-radius: 14px;
          border: 1px solid rgba(250, 204, 21, 0.85);
          background: radial-gradient(
            circle at 20% 0%,
            rgba(250, 204, 21, 1),
            rgba(37, 99, 235, 0.9)
          );
          color: #111827;
          text-align: center;
          box-shadow:
            0 0 32px rgba(250, 204, 21, 0.9),
            0 0 0 1px rgba(30, 64, 175, 0.8);
          animation: QL7completedGlow 2.6s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }

        .QL7-completed-title {
          font-size: 18px; /* заголовок — не трогаем */
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .QL7-completed-sub {
          margin-top: 6px;
          font-size: 15px; /* было 14 */
          opacity: 0.95;
        }

        @keyframes QL7dividerPulse {
          0% {
            transform: scale(1);
            box-shadow:
              0 0 10px #00ffd0,
              0 0 26px #00b4ff;
          }
          50% {
            transform: scale(1.25);
            box-shadow:
              0 0 18px #b4ff4d,
              0 0 32px #00b4ff;
          }
          100% {
            transform: scale(1);
            box-shadow:
              0 0 10px #00ffd0,
              0 0 26px #00b4ff;
          }
        }

        @keyframes QL7rewardShine {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        @keyframes QL7rewardGlow {
          0%,
          100% {
            box-shadow:
              0 0 18px rgba(252, 211, 77, 0.75),
              0 0 0 1px rgba(253, 224, 71, 0.95);
          }
          50% {
            box-shadow:
              0 0 26px rgba(255, 243, 176, 1),
              0 0 0 1px rgba(255, 249, 197, 1);
          }
        }

        @keyframes QL7completedGlow {
          0%,
          100% {
            box-shadow:
              0 0 24px rgba(250, 204, 21, 0.9),
              0 0 48px rgba(56, 189, 248, 0.6);
          }
          50% {
            box-shadow:
              0 0 34px rgba(250, 250, 21, 1),
              0 0 64px rgba(59, 130, 246, 0.9);
          }
        }

        @media (max-width: 640px) {
          .QL7-answers-grid {
            grid-template-columns: 1fr;
          }

          .QL7-exam-header {
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  )
}
