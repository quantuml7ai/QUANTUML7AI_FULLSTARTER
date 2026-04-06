'use client'

import React from 'react'
import Image from 'next/image'
import { cls } from '../../../shared/utils/classnames'
import { doubleQuestDecimal, resolveQuestTotalTasks } from '../utils/progress'

export default function QuestHub({
  t,
  quests,
  questProg,
  isCardClaimable: isCardClaimableProp,
  readEnv,
  vipActive,
  onOpenCard,
  onMarkDone,                  // (qid, tidString "1..N")
  selected,
  getTaskRemainMs,             // (qid, tidString) -> ms
  taskDelayMs = 15000,
}) {
  /* === scoped СЃС‚РёР»Рё В«Р·РµР»С‘РЅРѕР№ РіР°Р»РєРёВ» === */
  const tickStyles = (
    <style jsx>{`
      .qTickDraw{ display:inline-block; width:22px; height:22px; position:relative; }
      .qTickDraw::before{
        content:''; position:absolute; inset:0;
        -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7"/></svg>') center/contain no-repeat;
                mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7"/></svg>') center/contain no-repeat;
        background:#2ecc71; filter: drop-shadow(0 0 6px rgba(46,204,113,.55));
        animation: qTickStroke .7s ease-out forwards;
      }
    /* Р¤РѕР»Р±СЌРє РґР»СЏ Р±СЂР°СѓР·РµСЂРѕРІ Р±РµР· CSS mask */
    @supports not ((-webkit-mask: url("")) or (mask: url(""))) {
      .qTickDraw{ width:auto; height:auto; }
      .qTickDraw::before{
        content:"✓";
        position:static;
        -webkit-mask:none; mask:none;
        background:none;
        color:#2ecc71;
        text-shadow:0 0 6px rgba(46,204,113,.55);
        font-weight:800;
      }
    }
      @keyframes qTickStroke{
        from { clip-path: inset(0 100% 0 0); opacity:.6; transform:scale(.9) rotate(-6deg); }
        60%  { clip-path: inset(0 0 0 0); opacity:1; transform:scale(1.02) rotate(0deg); }
        to   { clip-path: inset(0 0 0 0); opacity:1; transform:scale(1); }
      }
    `}</style>
  )

  /* === РѕР±С‰РёР№ С‚РёРє СЂР°Р· РІ СЃРµРєСѓРЅРґСѓ, С…СѓРє вЂ” РІСЃРµРіРґР°, СЂР°Р±РѕС‚Р° С‚РѕР»СЊРєРѕ РїСЂРё РѕС‚РєСЂС‹С‚РѕР№ РєР°СЂС‚РѕС‡РєРµ === */
  const [__questTick, __setQuestTick] = React.useState(0)
  React.useEffect(() => {
    if (!selected) return undefined
    const id = setInterval(() => __setQuestTick((x) => (x + 1) & 1023), 1000)
    return () => clearInterval(id)
  }, [selected])

  /* === СѓС‚РёР»РёС‚С‹ === */
  const doubleDecimal = React.useCallback((s) => {
    return doubleQuestDecimal(s)
  }, [])

  // СЃРєРѕР»СЊРєРѕ Р·Р°РґР°С‡ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ Сѓ РєР°СЂС‚РѕС‡РєРё (ENV СЃ РїРѕРєР°СЂС‚РѕС‡РЅС‹Рј РѕРІРµСЂСЂР°Р№РґРѕРј)
  const getTotalTasks = React.useCallback((card) => {
    return resolveQuestTotalTasks(card, readEnv)
  }, [readEnv])

  const __questGetRemainMs = React.useCallback((qid, tid) => {
    try {
      if (typeof getTaskRemainMs === 'function') {
        const v = getTaskRemainMs(qid, tid)
        if (Number.isFinite(v) && v >= 0) return v
      }
    } catch {}
    return Math.max(0, Number(taskDelayMs) || 15000)
  }, [getTaskRemainMs, taskDelayMs])

  // Р»РѕРєР°Р»СЊРЅР°СЏ В«РјРѕР¶РЅРѕ РєР»РµР№РјРёС‚СЊ?В», РµСЃР»Рё СЃРІРµСЂС…Сѓ РЅРµ РґР°Р»Рё РїСЂРѕРї
  const claimDelayMsLocal = Math.max(0, Number(readEnv?.('NEXT_PUBLIC_QUEST_CLAIM_DELAY_MS', '0')) || 0)
  const isCardClaimableLocal = React.useCallback((qid) => {
    const card = questProg?.[qid]
    if (!card) return false
    const total = getTotalTasks((quests || []).find((x) => x?.id === qid) || {})
    const doneCount = Array.isArray(card.done) ? card.done.length : 0
    if (doneCount < total) return false
    const ts = Number(card.claimReadyTs || 0)
    return !!ts && (Date.now() - ts) >= claimDelayMsLocal
  }, [questProg, quests, claimDelayMsLocal, getTotalTasks])

  const canClaim = React.useCallback(
    (qid) => (typeof isCardClaimableProp === 'function'
      ? isCardClaimableProp(qid)
      : isCardClaimableLocal(qid)),
    [isCardClaimableProp, isCardClaimableLocal],
  )

  // ===== animated checkmark (no masks) =====
  function AnimatedCheckmark() {
    return (
      <>
        <style jsx>{`
          .cmrk {
            display:inline-flex; align-items:center; justify-content:center;
            width:42px; height:42px;
          }
          .cmrk svg { width:42px; height:42px; overflow:visible; }
          .cmrk .tick {
            fill:none; stroke:#2ecc71; stroke-width:3; stroke-linecap:round; stroke-linejoin:round;
            /* Р°РЅРёРјР°С†РёСЏ РїСЂРѕСЂРёСЃРѕРІРєРё */
            stroke-dasharray: 28;
            stroke-dashoffset: 28;
            animation: cmrk-draw .40s ease-out forwards;
            filter: drop-shadow(0 0 6px rgba(46,204,113,.55));
          }
          @keyframes cmrk-draw { to { stroke-dashoffset: 0; } }
          /* СѓРІР°Р¶РµРЅРёРµ reduce-motion */
          @media (prefers-reduced-motion: reduce) {
            .cmrk .tick { animation: none; stroke-dashoffset: 0; }
          }
        `}</style>
        <span className="cmrk" aria-label={t('quest_done')} title={t('quest_done')}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path className="tick" d="M5 12.5l5 5L20 7.5" />
          </svg>
        </span>
      </>
    )
  }

  /* ===== РЎРїРёСЃРѕРє РєР°СЂС‚РѕС‡РµРє ===== */
  if (!selected) {
    return (
      <div className="questList mt-2" suppressHydrationWarning>
        {tickStyles}

        {/* СЃС‚РёР»Рё РґР»СЏ РїСЂР°РІРѕРіРѕ Р±РµР№РґР¶Р° Р±РµР· absolute */}
        <style jsx>{`
          .qHeadRow{
            display:flex; align-items:center; gap:12px;
          }
          .qMid{
            flex: 1 1 auto; min-width:0;   /* РґР°С‘Рј СЃРµСЂРµРґРёРЅРµ СЃР¶РёРјР°С‚СЊСЃСЏ Рё РїРµСЂРµРЅРѕСЃРёС‚СЊ СЃС‚СЂРѕРєРё */
          }
          .qRight{
            flex: 0 0 auto; margin-left:auto;
            display:inline-flex; align-items:center; justify-content:center;
          }

          /* Р°РЅРёРјР°С†РёРё/СЃС‚РёР»Рё Р±РµР№РґР¶РµР№ */
          .tag.warn{
            color:#ff4d4f; background:rgba(255,77,79,.12);
            border:1px solid rgba(255,77,79,.45);
            font-weight:800; letter-spacing:.2px;
            animation:qWarnPulse 1.6s ease-in-out infinite;
          }
          @keyframes qWarnPulse{
            0%,100%{ transform:scale(1) }
            50%    { transform:scale(1.08) }
          }
          .tag.ok{
            color:#17d673; background:rgba(23, 214, 115, 0.18);
            border:1px solid rgba(23, 214, 115, 0.78);
            animation:qOkPop .6s ease-out both, qOkGlow 2s ease-in-out infinite alternate;
          }
          @keyframes qOkPop{
            0%{ transform:scale(.84) rotate(-6deg); opacity:.75 }
            60%{ transform:scale(1.05) rotate(0deg); opacity:1 }
            100%{ transform:scale(1) }
          }
          @keyframes qOkGlow{
            0%  { box-shadow:0 0 0 rgba(23,214,115,0), 0 0 8px rgba(6, 184, 255, 1) }
            100%{ box-shadow:0 0 16px rgba(23, 214, 115, 0.22), 0 0 22px rgba(23,214,115,.15) }
          }

          /* РЅР° СѓР·РєРёС… вЂ” РјРµС‚Сѓ РїРѕР·РІРѕР»СЏРµРј РїРµСЂРµРЅРѕСЃРёС‚СЊ СЃС‚СЂРѕРєРё, РїСЂР°РІС‹Р№ Р±РµР№РґР¶ РѕСЃС‚Р°С‘С‚СЃСЏ РЅР° РјРµСЃС‚Рµ */
          @media (max-width: 520px){
            .questMeta{ white-space:normal }
          }
        `}</style>

        {quests.map((q) => {
          const done = (questProg?.[q.id]?.done || []).length || 0
          const reward = readEnv?.(q.rewardKey, '') || ''
          const rewardShown = vipActive ? doubleDecimal(reward) : reward
          const totalTasks = getTotalTasks(q)
          const remain = Math.max(0, totalTasks - done)
          const isClaimed = !!questProg?.[q.id]?.claimed
          return (
            <button
              key={q.id}
              type="button"
              className="item qshine questItem hoverPop text-left"
              onClick={() => { if (!isClaimed) onOpenCard?.(q) }}
              aria-disabled={isClaimed}
              data-claimed={isClaimed ? '1' : '0'}
              title={t(q.i18nKey) || q.id}
            >
              <div className="questHead qHeadRow">
                {/* СЃР»РµРІР° вЂ” РѕР±Р»РѕР¶РєР° */}
                {q.cover ? (
                  q.coverType === 'mp4'
                    ? <video className="questThumb" src={q.cover} playsInline autoPlay muted loop preload="metadata" />
                    : <Image className="questThumb" src={q.cover} alt="" loading="lazy" unoptimized width={60} height={60} />
                ) : (<div className="avaMini">🗂️</div>)}

                {/* СЃРµСЂРµРґРёРЅР° вЂ” С‚СЏРЅРµС‚СЃСЏ/РїРµСЂРµРЅРѕСЃРёС‚СЃСЏ */}
                <div className="qMid min-w-0">
                  <div className="questTitle whitespace-normal break-words">
                    {t(q.i18nKey) || q.id}
                  </div>
                  <div className="questMeta">
                    {t('quest_tasks_done')}
                    {reward ? (
                      <>
                        {' • '}{t('quest_reward')}: <span className="goldReward big">{rewardShown}</span>
                        <span
                          className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
                          role="button"
                          tabIndex={0}
                          aria-label={t('forum_qcoin_x2_label')}
                          title={vipActive
                            ? t('forum_qcoin_x2_active')
                            : t('forum_qcoin_x2_get')}
                          onClick={() => { if (!vipActive) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                          onKeyDown={(e) => { if (!vipActive && (e.key === 'Enter' || e.key === ' ')) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                          suppressHydrationWarning
                          style={{ marginLeft: 8 }}
                        >×2</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* СЃРїСЂР°РІР° вЂ” Р±РµР№РґР¶/РіР°Р»РѕС‡РєР°, РЅРёРєРѕРіРґР° РЅРµ РїРµСЂРµРєСЂС‹РІР°РµС‚ РєРѕРЅС‚РµРЅС‚ */}
                <div className="qRight">
                  {questProg?.[q.id]?.claimed || canClaim(q.id) ? (
                    <span className="tag ok" title={t('quest_done')}>✓</span>
                    // РµСЃР»Рё С…РѕС‡РµС€СЊ вЂ” РјРѕР¶РЅРѕ Р·Р°РјРµРЅРёС‚СЊ РЅР° <AnimatedCheckmark />
                  ) : (
                    <span
                      className={cls('tag', 'warn')}
                      title={t('quest_tasks_left')}
                      aria-label="tasks-left"
                    >
                      {String(remain)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  /* ===== Р”РµС‚Р°Р»Рё РІС‹Р±СЂР°РЅРЅРѕР№ РєР°СЂС‚РѕС‡РєРё ===== */
  const q = selected
  const doneSet = new Set((questProg?.[q.id]?.done || []).map(String))
  const reward = readEnv?.(q.rewardKey, '') || ''
  const rewardShown = vipActive ? doubleDecimal(reward) : reward
  const totalTasks = getTotalTasks(q)
  const taskList = Array.isArray(q.tasks) ? q.tasks.slice(0, totalTasks) : []

  return (
    <div className="item qshine">
      {tickStyles}

      {/* СЃС‚РёР»Рё РёРјРµРЅРЅРѕ РґР»СЏ СЃРїРёСЃРєР° Р·Р°РґР°С‡ РІС‹Р±СЂР°РЅРЅРѕРіРѕ РєРІРµСЃС‚Р° */}
      <style jsx>{`
        .questTaskHead{
          display:flex;
          align-items:flex-start;
          gap:.6rem;
        }
        /* Р»РµРІР°СЏ РєРѕР»РѕРЅРєР°: С„РёРєСЃРёСЂСѓРµРј С€РёСЂРёРЅСѓ = С€РёСЂРёРЅРµ РёРєРѕРЅРєРё,
           С‡С‚РѕР±С‹ РјР°Р»РµРЅСЊРєРёР№ СЃС‡С‘С‚С‡РёРє РЅРµ РјРѕРі РµС‘ СѓР¶Р°С‚СЊ */
        .questTaskIconCol{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:4px;
          width:98px;
          min-width:98px;
          flex:0 0 98px;
        }
      `}</style>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          {q.cover ? (
            q.coverType === 'mp4'
              ? <video className="questThumb" src={q.cover} playsInline autoPlay muted loop preload="metadata" />
              : <Image className="questThumb" src={q.cover} alt="" loading="lazy" unoptimized width={60} height={60} />
          ) : (<div className="avaMini">🗂️</div>)}

          <div>
            <div className="title whitespace-normal break-words">
              {t(q.i18nKey) || q.id}
            </div>

            {reward && (
              <div className="meta">
                {t('quest_reward')}: <span className="goldReward">{rewardShown}</span>
                <span
                  className={cls('qcoinX2', vipActive ? 'vip' : 'needVip', 'hoverPop')}
                  role="button"
                  tabIndex={0}
                  aria-label={t('forum_qcoin_x2_label')}
                  title={vipActive
                    ? t('forum_qcoin_x2_active')
                    : t('forum_qcoin_x2_get')}
                  onClick={() => { if (!vipActive) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                  onKeyDown={(e) => { if (!vipActive && (e.key === 'Enter' || e.key === ' ')) { try { window.dispatchEvent(new Event('vip:open')) } catch {} } }}
                  suppressHydrationWarning
                  style={{ marginLeft: 8 }}
                >×2</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="questTaskList">
        {taskList.map((task, idx) => {
          const tid = String(idx + 1) // СѓРЅРёС„РёС†РёСЂРѕРІР°РЅРЅС‹Р№ id Р·Р°РґР°С‡Рё: "1..N"
          const url = readEnv?.(task.urlKey, '') || ''
          const isDone = doneSet.has(tid)

          return (
            <div key={task.id ?? `t:${idx}`} className="item qshine questTask" data-intensity="soft">
              <div className="questHead questTaskHead">
                {/* Р›Р•Р’РђРЇ РљРћР›РћРќРљРђ: РёРєРѕРЅРєР° + Start/С‚Р°Р№РјРµСЂ/РіР°Р»РєР° РџРћР” РЅРµР№, С„РёРєСЃРёСЂРѕРІР°РЅРЅРѕР№ С€РёСЂРёРЅС‹ */}
                <div className="questTaskIconCol">
                  {task.cover ? (
                    <Image
                      className="questThumb"
                      src={task.cover}
                      alt=""
                      unoptimized
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="avaMini">🏁</div>
                  )}

                  <div>
                    {isDone ? (
                      (() => {
                        const remain = Math.max(0, __questGetRemainMs(q.id, tid)) // СЃС‚СЂР°С…РѕРІРєР°
                        if (remain > 0) {
                          const sec = Math.ceil(remain / 1000)
                          return (
                            <span
                              className="tag warn"
                              data-tick={__questTick}
                              title={t('quest_timer')}
                            >
                              {sec}s
                            </span>
                          )
                        }
                        return <AnimatedCheckmark key={`done:${q.id}:${tid}`} />
                      })()
                    ) : (
                      url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nick-badge"
                          onClick={() => { setTimeout(() => onMarkDone?.(q.id, tid), 0) }}
                        >
                          {t('quest_do')}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="nick-badge"
                          onClick={() => { setTimeout(() => onMarkDone?.(q.id, tid), 0) }}
                        >
                          {t('quest_do')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* РџР РђР’РђРЇ Р§РђРЎРўР¬: С‚РµРєСЃС‚ Р·Р°РґР°С‡Рё */}
                <div className="min-w-0">
                  <div className="title whitespace-normal break-words">
                    {t(task.i18nKey) || `${q.id} • ${idx + 1}`}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}