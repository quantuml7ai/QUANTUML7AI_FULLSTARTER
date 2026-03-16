import React, { useEffect } from 'react'
import { isBrowser } from '../../../shared/utils/browser'
import { resolveForumUserId } from '../utils/account'

const INC_PER_SEC = 1 / (365 * 24 * 60 * 60)
const GRACE_MS = 4 * 60 * 60 * 1000
const SYNC_MS = 10 * 60 * 1000

// === Q COIN: client-side live ticker with rare sync (AUTH-ONLY) ===
export default function useQCoinLive(userKey, isVip){
  // uid берём через helper и мягко санитизируем под серверную схему
  const rawUid = resolveForumUserId(userKey);
  let uid = typeof rawUid === 'string' ? rawUid.trim() : '';
  if (uid && !/^[A-Za-z0-9_\-:.]{1,64}$/.test(uid)) uid = '';

  // стабильный client-id для alive (один на вкладку/браузер)
  const cidRef = React.useRef('');
  if (!cidRef.current) {
    try {
      const ls = typeof localStorage!=='undefined' ? localStorage : null;
      const fromLS = ls ? ls.getItem('forum_client_id') : '';
      const fresh  = 'cid_' + (typeof crypto!=='undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36)));
      const val    = (fromLS && /^[A-Za-z0-9_\-:.]{1,64}$/.test(fromLS)) ? fromLS : fresh;
      cidRef.current = val;
      if (ls) ls.setItem('forum_client_id', val);
    } catch {
      cidRef.current = 'cid_' + Date.now().toString(36);
    }
  } 

  // Серверные значения (последний снимок)
  const [server, setServer] = React.useState({
    startedAt: Date.now(),
    lastActiveAt: Date.now(),
    lastConfirmAt: 0,
    seconds: 0,
    balance: 0,
    paused: !uid,                 // без UID сразу пауза
    loading: !!uid,               // грузимся только если есть UID
    modal: false,
    incPerSec: uid ? INC_PER_SEC : 0, // без UID инкремент 0
    graceMs: GRACE_MS,
  });

  // Локальные маркеры активности
  const lastUiRef       = React.useRef(0);
  const lastSyncRef     = React.useRef(0);
  const becameActiveRef = React.useRef(true);
  const displayRef      = React.useRef(server.balance);

  // Защиты для heartbeat
  const heartbeatInFlight = React.useRef(false);
  const syncErrors        = React.useRef(0); // для мягкого backoff

  const markUi = React.useCallback(function(){
    lastUiRef.current = Date.now();
    becameActiveRef.current = true;
  }, []);
  // === Next-up video warmup (preload the next video while current plays) ===
  useEffect(() => { 
    if (!isBrowser()) return;

    const selector = 'video[data-forum-video="post"]';
    let warmed = null;
    const warmedOnce = new WeakSet();
    let warmIdleId = null;

    const idle = (fn) => {
      try {
        if ('requestIdleCallback' in window) {
          return window.requestIdleCallback(fn, { timeout: 1200 });
        }
      } catch {}
      return setTimeout(fn, 120);
    };
    const cancelIdle = (id) => {
      try {
        if ('cancelIdleCallback' in window) return window.cancelIdleCallback(id);
      } catch {}
      clearTimeout(id);
    };

    const isSlowNetwork = () => {
      try {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const type = String(conn?.effectiveType || '');
        return !!conn?.saveData || /(^|-)2g/.test(type);
      } catch {
        return false;
      }
    };

    const clearWarm = () => {
      if (!(warmed instanceof HTMLVideoElement)) { warmed = null; return; }
      try {
        if (warmIdleId != null) { try { cancelIdle(warmIdleId); } catch {} warmIdleId = null; }
       
        const slow = isSlowNetwork();
        warmed.preload = slow ? 'metadata' : 'auto'; 

        // НЕ дергаем load() на каждом play (это и даёт дерганье/CPU).
        // Подогреваем мягко и ОДИН раз на видео, в idle, только если совсем "холодное".
        if (!warmedOnce.has(warmed)) {
          warmedOnce.add(warmed);
          warmIdleId = idle(() => {
            warmIdleId = null;
            try {
              const cold = (warmed.readyState === 0 || !warmed.currentSrc);
              const safe = cold && warmed.paused && (warmed.currentTime === 0);
              if (safe) warmed.load?.();
            } catch {}
          });
        }
      } catch {}
      warmed = null;
    };

    const warmNext = (current) => {
      if (!(current instanceof HTMLVideoElement)) return;
      const list = Array.from(document.querySelectorAll(selector));
      const idx = list.indexOf(current);
      if (idx < 0) return;
      const next = list[idx + 1];
      if (!next || next === warmed) return;
      clearWarm();
      warmed = next;
      const slow = isSlowNetwork();
      try {
        warmed.preload = slow ? 'metadata' : 'auto';
        warmed.setAttribute('data-forum-warm', '1');
        warmed.load();
      } catch {}
    };

    const onPlay = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLVideoElement)) return;
      if (target.getAttribute('data-forum-video') !== 'post') return;
      warmNext(target);
    };

    const onStop = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLVideoElement)) return;
      if (target.getAttribute('data-forum-video') !== 'post') return;
      clearWarm();
    };

    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);

    return () => {
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
      clearWarm();
    };
  }, []);
  // Считаем открытие страницы «активностью», чтобы тикер сразу начал тикать
  React.useEffect(function(){
    lastUiRef.current = Date.now();
    becameActiveRef.current = true;
  }, []);

  // Сброс при смене UID (логин/логаут)
  React.useEffect(function(){
    setServer(s => ({
      ...s,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      lastConfirmAt: 0,
      seconds: 0,
      balance: 0,
      paused: !uid,                   // логаут -> пауза
      loading: !!uid,                 // логин -> загрузка
      incPerSec: uid ? INC_PER_SEC : 0,
    }));
    displayRef.current = 0;
    lastSyncRef.current = 0;
    becameActiveRef.current = !!uid;
  }, [uid]);

  // Стартовый GET (с timeout и санитайзингом чисел) — ТОЛЬКО если есть UID
  React.useEffect(function(){
    if (!uid) return; // не авторизован — ничего не грузим

    let dead = false;

    async function load(){
      try{
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 8000);

        const r = await fetch('/api/qcoin/get', {
          headers:{
            'x-forum-user-id': uid,   // сервер: requireUserId
            'x-forum-vip': isVip ? '1' : '0',
          },
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        let j = null;
        try { j = await r.json(); } catch(e){ j = null; }

        if (!dead && j && j.ok){
          const inc0     = (j.incPerSec ?? INC_PER_SEC);
          const grace0   = (j.graceMs   ?? GRACE_MS);

          const safeInc0   = Math.max(0, Number(inc0));
          const safeGrace0 = Math.max(60000, Number(grace0));
          const clampedInc = Math.min(safeInc0,  INC_PER_SEC * 100);
          const clampedGr  = Math.min(safeGrace0,24*60*60*1000);

          setServer(s => ({
            ...s,
            startedAt:     (j.startedAt    ?? s.startedAt),
            lastActiveAt:  (j.lastActiveAt ?? s.lastActiveAt),
            lastConfirmAt: (j.lastConfirmAt?? 0),
            seconds: Number(j.seconds ?? 0),
            balance: Number(j.balance ?? 0),
            paused: !!j.paused,
            loading: false,
            incPerSec: clampedInc,
            graceMs: clampedGr,
          }));

          displayRef.current   = Number(j.balance ?? 0);
          lastSyncRef.current  = Date.now();
          lastUiRef.current    = Date.now();
          becameActiveRef.current = false;
        } else if (!dead){
          setServer(s => ({ ...s, loading:false, paused:true, incPerSec:0 }));
          displayRef.current = 0;
        }
      } catch(e){
        if (!dead){
          setServer(s => ({ ...s, loading:false, paused:true, incPerSec:0 }));
          displayRef.current = 0;
        }
      }
    }

    load();
    return () => { dead = true; };
  }, [uid, isVip]);

  // Локальные события активности (любое действие в форуме)
  React.useEffect(function(){
    if (typeof window==='undefined') return;
    const root = document.querySelector('.forum_root') || document.body;
    const onAny = () => { if (uid) markUi(); };
    const onVis = () => { if (uid && document.visibilityState === 'visible') markUi(); };

    ['click','keydown'].forEach((e)=>{
      root.addEventListener(e, onAny, {passive:true});
    });
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onAny);

    return function(){
      ['click','keydown'].forEach((e)=>{
        root.removeEventListener(e, onAny);
      });
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onAny);
    };
  }, [markUi, uid]);

  // Локальный «живой» тикер — каждую секунду дорисовываем баланс
  const [displayBalance, setDisplayBalance] = React.useState(0);
  React.useEffect(function(){
    setDisplayBalance(server.balance);
    displayRef.current = server.balance;
  }, [server.balance]);

  // Интервальный тик + heartbeat
  React.useEffect(function(){
    if (!uid) return; // нет UID — не тикаем вообще

    const id = setInterval(async function(){
      const now = Date.now();

      const graceMs = (server.graceMs ?? GRACE_MS);
      const lastC   = server.lastConfirmAt || 0;
      const lastUi  = lastUiRef.current || 0;

      const effectiveLast = (lastC > lastUi) ? lastC : lastUi;
      const withinGrace   = (now - effectiveLast) < graceMs;

      const incPerSec = (server.incPerSec ?? INC_PER_SEC);
      if (withinGrace && !server.paused){
        displayRef.current += incPerSec;
        setDisplayBalance(displayRef.current);
      }

      const needPeriodicSync  = (now - (lastSyncRef.current || 0)) >= SYNC_MS;
      const needImmediateSync = becameActiveRef.current;
      const backoffDelayMs    = Math.min(5, syncErrors.current) * 2000;

      if ((needPeriodicSync || needImmediateSync) && uid && !heartbeatInFlight.current){
        if (now - (lastSyncRef.current || 0) < backoffDelayMs) return;

        becameActiveRef.current = false;
        lastSyncRef.current = now;
        heartbeatInFlight.current = true;

        // active: были ли действия в последнюю минуту — чтобы сервер обновил lastConfirmAt
        const active = (now - (lastUiRef.current || 0)) < 60000;

        try{
          const controller = new AbortController();
          const timeoutId  = setTimeout(() => controller.abort(), 8000);

          const res = await fetch('/api/qcoin/heartbeat', {
            method:'POST',
            headers:{
              'content-type':'application/json',
              'x-forum-user-id': uid,               // сервер: requireUserId
              'x-forum-client-id': cidRef.current,  // для alive-ключей
              'x-forum-vip': isVip ? '1' : '0',     // ← VIP-множитель (Х2)
            },
            body: JSON.stringify({ active: !!active, now }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          let j = null;
          try { j = await res.json(); } catch(e){ j = null; }

          if (j && j.ok){
            const incFromSrv   = (j.incPerSec ?? incPerSec);
            const graceFromSrv = (j.graceMs   ?? graceMs);

            const safeInc       = Math.max(0, Number(incFromSrv));
            const safeGrace     = Math.max(60000, Number(graceFromSrv));
            const clampedInc    = Math.min(safeInc,   INC_PER_SEC * 100);
            const clampedGrace  = Math.min(safeGrace, 24 * 60 * 60 * 1000);

            setServer(s => ({
              ...s,
              startedAt:     (j.startedAt     ?? s.startedAt),
              lastActiveAt:  (j.lastActiveAt  ?? s.lastActiveAt),
              lastConfirmAt: (j.lastConfirmAt ?? s.lastConfirmAt),
              seconds: Number(j.seconds ?? s.seconds),
              balance: Number(j.balance ?? s.balance),
              paused: !!j.paused,
              incPerSec: clampedInc,
              graceMs: clampedGrace,
            }));

            displayRef.current = Number(j.balance ?? displayRef.current);
            setDisplayBalance(displayRef.current);
            syncErrors.current = 0;
          } else {
            syncErrors.current = Math.min(10, syncErrors.current + 1);
          }
        } catch(e){
          syncErrors.current = Math.min(10, syncErrors.current + 1);
        } finally {
          heartbeatInFlight.current = false;
        }
      }
    }, 1000);

    return function(){ clearInterval(id); };
 }, [uid, isVip, server.paused, server.incPerSec, server.graceMs, server.lastConfirmAt]);

  return {
    ...server,
    balanceDisplay: uid ? displayBalance : 0,  // без UID всегда показываем 0
    open:  function(){ setServer(s => ({ ...s, modal:true  })); },
    close: function(){ setServer(s => ({ ...s, modal:false })); },
  };
}
