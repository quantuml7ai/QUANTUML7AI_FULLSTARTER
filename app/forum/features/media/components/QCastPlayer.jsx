 'use client'
import React from 'react'
import Image from 'next/image'
import { formatMediaTime } from '../utils/formatMediaTime'
import { buildQCastControlBars } from '../utils/qcastBars'
import {
  QCastIconPlay,
  QCastIconPause,
  QCastIconBack10,
  QCastIconFwd10,
  QCastIconVolume,
  QCastIconGear,
} from './qcast/QCastIcons'

export default function QCastPlayer({
  src,
  onRemove,
  preview = false,
  readMutedPrefFromStorage,
  writeMutedPref,
  mutedEventName = 'forum:media-mute',
  rearmPooledFxNode,
}) {
  const desiredMuted = React.useCallback((pref) => (
    pref == null ? true : !!pref
  ), []) 
  const readMutedPref = React.useCallback(() => {
    try {
      return typeof readMutedPrefFromStorage === 'function' ? readMutedPrefFromStorage() : null;
    } catch {
      return null;
    }
  }, [readMutedPrefFromStorage]);
  const writeMuted = React.useCallback((nextMuted) => {
    try {
      if (typeof writeMutedPref === 'function') writeMutedPref(!!nextMuted);
    } catch {}
  }, [writeMutedPref]);
  const readQcastMutedPref = React.useCallback(() => readMutedPref(), [readMutedPref]);
  const writeQcastMutedPref = React.useCallback((nextMuted) => {
    writeMuted(nextMuted);
  }, [writeMuted]);
  const rearmPooledFx = React.useCallback((el) => {
    try {
      return typeof rearmPooledFxNode === 'function' ? !!rearmPooledFxNode(el) : false;
    } catch {
      return false;
    }
  }, [rearmPooledFxNode]);
  const audioRef = React.useRef(null);
  const hostRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const playerIdRef = React.useRef(`qcast_${Math.random().toString(36).slice(2)}`);
 
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [rate, setRate] = React.useState(1);
  const [showControls, setShowControls] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [showSettings, setShowSettings] = React.useState(false);
  const [preset, setPreset] = React.useState('custom'); // custom | rock | pop | classic
  const [surround, setSurround] = React.useState(false);

  const dir =
    (typeof document !== 'undefined' && (document.documentElement?.dir === 'rtl' || getComputedStyle(document.documentElement).direction === 'rtl'))
      ? 'rtl'
      : 'ltr';
  const qcastFxProfile = React.useMemo(() => {
    if (typeof window === 'undefined') return { viz: false, boom: false, burst: 2, pool: 0 };
    try {
      const ua = String(navigator?.userAgent || '');
      const isIOS = /iP(hone|ad|od)/i.test(ua);
      const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
      const reduced = !!window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const lowMem = Number(navigator?.deviceMemory || 0) > 0 && Number(navigator?.deviceMemory || 0) <= 3;
      const mobileLean = !!isIOS || !!coarse || !!lowMem;
      const burst = mobileLean ? 3 : 5;
      const fullscreenFx = !!isIOS || !!coarse;
      return {
        viz: !reduced && !mobileLean,
        // Boom ring was causing visual flashes and extra compositor load.
        boom: false,
        burst,
        // Mobile can keep a smaller pool; zero pool disables FX entirely.
        pool: mobileLean ? 14 : 24,
        fullscreen: fullscreenFx,
      };
    } catch {
      return { viz: false, boom: false, burst: 2, pool: 14, fullscreen: true };
    }
  }, []);

  const openControls = React.useCallback(() => setShowControls(true), []);
  const toggleControls = React.useCallback(() => setShowControls((v) => !v), []);

// ❤️‍🔥 LOVE / HYPE / RESPECT — “контент зашёл”
const GOOD_SET = React.useMemo(() => ([
  // ЛЮБОВЬ (прямо “мне очень нравится”)
  '❤️','🩷','🧡','💛','💚','💙','💜','🤍','💖','💗','💓','💞','💕','💘','💝','❣️','❤️‍🔥','💟',
  '😍','🥰','😘','😚','😙','😗','😻','😽','🫶','💋','🌹','🌷','🌸','🌺','💐',

  // ВАУ / ХАЙП / ВОСТОРГ
  '🔥','✨','🌟','💫','⚡','🚀','🎇','🎆','🎉','🎊','🤩','🥳','😎','😁','😄','😆','😂','🤣',
  '😲','😮','😯','🤯','🙀','😺','😸','😹',

  // УВАЖЕНИЕ / “КРАСАВЧИК” / ПОДДЕРЖКА
  '👍','👏','🙌','👌','🤝','🫡','🙏','💪','🦾','🧠','💡','🏆','🥇','🥈','🥉','👑','💎','💯','✅','☑️',
  '🎯','📈','🏅','🎖️',

  // ВАЙБ / КРЕАТИВ / “ЭТО СТИЛЬНО”
  '🎨','🎭','🎬','🎧','🎶','🎵','🎼','🪩','🕺','💃','🪄','🔮','🌈','☀️','🌞','🌍','🛰️','🧬','🧩','🏄'
]), []);


// 😡 RAGE / HATE / CRINGE — “контент не зашёл”
const BAD_SET = React.useMemo(() => ([
  // ЗЛОСТЬ / ХЕЙТ / АГРО
  '👎','😠','😡','🤬','👿','💢','🗯️','💥','🧨','⚔️','🔪','🪓','🛑','🚫','⛔','🚷','⚠️','📛','☠️','💀',

  // ОТВРАЩЕНИЕ / “ФУ” / ЖЕСТКИЙ ДИЗРЕСПЕКТ
  '🤢','🤮','🤧','😷','🤒','🤕','🦠','🤨','😤','😒','🙄','😑','😬','🫤','😐','😏','😪','😮‍💨','💩','🤦‍♂️',

  // КРИНЖ / “ЧТО ЭТО БЫЛО?” / СТЫДНО-СМЕШНО
  '🤦‍♀️','🤷‍♂️','🤷‍♀️','🫠','🫣','😵','😵‍💫','🙈','🙉','🙊','👀','🫥','🫢','😶','🤡','🎪',

  // БОЛЬ / РАЗОЧАРОВАНИЕ / “ОЖИДАЛ ЛУЧШЕ”
  '😕','🙁','😟','😞','😔','😢','😭','😿','💔','🖤','🥀','⛈️','🌪️','🌧️','😣','😖','😫','😩',

  // СТРАХ / НАПРЯГ / “НЕ НРАВИТСЯ ЭТО”
  '😨','😰','😱','🫨','😧','😦','😮','😲','🕳️','🧯',

  // “СТОП-ЭТО-ПЕРЕБОР”
  '🚨','🔇','❌','🧱','⛓️','🪤','🪦','🧟','🧛','🦂'
]), []);


  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [goodEmoji, setGoodEmoji] = React.useState(() => pick(GOOD_SET));
  const [badEmoji, setBadEmoji] = React.useState(() => pick(BAD_SET));
// ===== QCast emoji FX (INSANE, fast): DOM pool + burst + random presets =====
// ВАЖНО: без setState на каждую частицу => нет лагов от React-рендеров.
const FX_POOL = Math.max(0, Number(qcastFxProfile?.pool || 0));
const FX_BURST_BASE = Number(qcastFxProfile?.burst || 4);
const BOOM_POOL = qcastFxProfile.boom ? 12 : 0;
const fxNodesRef = React.useRef([]);
const fxCursorRef = React.useRef(0);
const boomNodesRef = React.useRef([]);
const boomCursorRef = React.useRef(0);
const fxBurstRef = React.useRef(FX_BURST_BASE);
const FX_VARIANTS = React.useMemo(() => ([
  'float','spiral','rocket','zigzag','bounce','snap','wave','drift'
]), []);

const setFxNodeRef = React.useCallback((el, idx) => {
  fxNodesRef.current[idx] = el || null;
}, []);
const setBoomNodeRef = React.useCallback((el, idx) => {
  boomNodesRef.current[idx] = el || null;
}, []);
// Keep a static budget to avoid per-instance scroll/RAF overhead.

const spawnBoom = React.useCallback((kind, origin) => {
  if (!qcastFxProfile.boom || BOOM_POOL <= 0) return;
  let nodes = boomNodesRef.current.filter((n) => n && n.isConnected);
  if (!nodes.length) {
    try {
      nodes = Array.from(hostRef.current?.querySelectorAll?.('.qcastBoom') || []);
      if (nodes.length) boomNodesRef.current = nodes;
    } catch {}
  }
  if (!nodes.length) return;
  const el = nodes[boomCursorRef.current++ % nodes.length];
  if (!el) return;

  const host = hostRef.current;
  const r = host?.getBoundingClientRect?.();
  const rect = r && r.width > 20 && r.height > 20 ? r : null;
  const fullscreenFx = !!qcastFxProfile?.fullscreen;
  const viewportW = Number(window?.innerWidth || 0) || 0;
  const viewportH = Number(window?.innerHeight || 0) || 0;
  const ox = Number(origin?.x);
  const oy = Number(origin?.y);
  const x = fullscreenFx
    ? (Number.isFinite(ox) ? ox : (viewportW > 0 ? (viewportW * 0.5) : (rect ? (rect.left + rect.width * 0.5) : 0)))
    : (
      rect
        ? (Number.isFinite(ox) ? (ox - rect.left) : (rect.width * 0.5))
        : (Number.isFinite(ox) ? ox : 0)
    );
  const y = fullscreenFx
    ? (Number.isFinite(oy) ? oy : (viewportH > 0 ? (viewportH * 0.5) : (rect ? (rect.top + rect.height * 0.5) : 0)))
    : (
      rect
        ? (Number.isFinite(oy) ? (oy - rect.top) : (rect.height * 0.5))
        : (Number.isFinite(oy) ? oy : 0)
    );

  const hue = Math.round((Math.random() - 0.5) * 40);
  const glow = (1.0 + Math.random() * 1.2).toFixed(2);
  const dur = Math.round(420 + Math.random() * 260);

  el.className = `qcastBoom qcastBoom--${kind}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--bHue', `${hue}deg`);
  el.style.setProperty('--bGlow', glow);
  el.style.setProperty('--bDur', `${dur}ms`);

  // IMPORTANT: animation only when explicitly armed.
  rearmPooledFx(el);
}, [qcastFxProfile.boom, qcastFxProfile.fullscreen, BOOM_POOL, rearmPooledFx]);

const spawnFx = React.useCallback((kind, origin) => {
    const set = kind === 'good' ? GOOD_SET : BAD_SET;

  // Разброс по локальной области плеера (без fullscreen fixed-слоя).
  const host = hostRef.current;
  const r = host?.getBoundingClientRect?.();
  const rect = r && r.width > 20 && r.height > 20 ? r : null;
  const fullscreenFx = !!qcastFxProfile?.fullscreen;
  const viewportW = Number(window?.innerWidth || 0) || 0;
  const viewportH = Number(window?.innerHeight || 0) || 0;
  const hostW = fullscreenFx ? (viewportW || (rect?.width || 260)) : (rect?.width || 260);
  const hostH = fullscreenFx ? (viewportH || (rect?.height || 320)) : (rect?.height || 320);

  let nodes = [];
  try {
    nodes = Array.from(hostRef.current?.querySelectorAll?.('.qcastFx') || []).filter((n) => n && n.isConnected);
    if (nodes.length) fxNodesRef.current = nodes;
  } catch {}
  if (!nodes.length) {
    nodes = fxNodesRef.current.filter((n) => n && n.isConnected);
  }
  if (!nodes.length) return;

  const trails = ['✦','✧','✨','⋆','⟡','•','✴','✺','✹','✵'];

  const burst = Math.max(0, fxBurstRef.current || FX_BURST_BASE);

    for (let i = 0; i < burst; i++) {
    const idx = fxCursorRef.current++ % nodes.length;
    const el = nodes[idx];
    if (!el) continue;

    const emoji = set[(Math.random() * set.length) | 0];
    const variant = FX_VARIANTS[(Math.random() * FX_VARIANTS.length) | 0];

    const oxAbs = Number(origin?.x);
    const oyAbs = Number(origin?.y);
    const ox = fullscreenFx
      ? (Number.isFinite(oxAbs) ? oxAbs : null)
      : (rect && Number.isFinite(oxAbs) ? (oxAbs - rect.left) : null);
    const oy = fullscreenFx
      ? (Number.isFinite(oyAbs) ? oyAbs : null)
      : (rect && Number.isFinite(oyAbs) ? (oyAbs - rect.top) : null);
    const preferOrigin = (ox != null && oy != null && Math.random() < 0.30);

    const left = preferOrigin
      ? (ox + (Math.random() - 0.5) * 120)
      : (Math.random() * hostW);
    const top  = preferOrigin
      ? (oy + (Math.random() - 0.5) * 140)
      : (Math.random() * hostH);

    // INSANE motion profile (GPU: transform/opacity)
    const dx = Math.round((Math.random() - 0.5) * 360);     // px
    const dy = -Math.round(260 + Math.random() * 520);      // px вверх
    const rot = Math.round((Math.random() - 0.5) * 260);    // deg
    const sc0 = (0.42 + Math.random() * 0.22).toFixed(2);
    const sc1 = (1.45 + Math.random() * 1.05).toFixed(2);
    const dur = Math.round(1100 + Math.random() * 900);     // ms
    const delay = Math.round(i * (10 + Math.random() * 18)); // ms

    // cheap premium vibe
    const hue = Math.round((Math.random() - 0.5) * 44);     // deg
    const glow = (0.95 + Math.random() * 1.25).toFixed(2);
    const trail = trails[(Math.random() * trails.length) | 0];

    el.textContent = emoji;
    el.className = `qcastFx qcastFx--${kind} qcastFx--${variant}`;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);
    el.style.setProperty('--rot', `${rot}deg`);
    el.style.setProperty('--sc0', sc0);
    el.style.setProperty('--sc1', sc1);
    el.style.setProperty('--dur', `${dur}ms`);
    el.style.setProperty('--delay', `${delay}ms`);
    el.style.setProperty('--hue', `${hue}deg`);
    el.style.setProperty('--glow', glow);
    el.style.setProperty('--trail', `"${trail}"`);

    // IMPORTANT: animation only when explicitly armed.
    rearmPooledFx(el);
  }

  // кнопки реакций тоже постоянно меняем
  if (kind === 'good') setGoodEmoji(pick(GOOD_SET));
  else setBadEmoji(pick(BAD_SET));
}, [GOOD_SET, BAD_SET, FX_VARIANTS, setGoodEmoji, setBadEmoji, FX_BURST_BASE, qcastFxProfile.fullscreen, rearmPooledFx]);

  const ctrlBars = React.useMemo(() => buildQCastControlBars(src), [src]);

  const waRef = React.useRef({
    ctx: null, analyser: null, srcNode: null, gain: null, filters: null, panner: null,
    data: null, raf: 0, ro: null, ctx2d: null, w: 0, h: 0, dpr: 1,
    particles: [], t: 0, active: false, lastTs: 0, lastPaint: 0,
  });
  const syncMasterGain = React.useCallback(() => {
    try {
      const audio = audioRef.current;
      const st = waRef.current;
      if (!audio || !st?.master) return;
      const nextGain = !!audio.muted ? 0 : Math.min(1, Math.max(0, Number(audio.volume ?? 1)));
      st.master.gain.value = nextGain;
    } catch {}
  }, []);

  const applyPreset = React.useCallback((st, nextPreset) => {
    const filters = st?.filters;
    if (!filters || !Array.isArray(filters)) return;
    const setG = (i, v) => { try { if (filters[i]) filters[i].gain.value = v; } catch {} };
    if (nextPreset === 'rock') {
      setG(0, 5.0); setG(1, 3.0); setG(2, -1.0); setG(3, 1.5); setG(4, 4.0); setG(5, 4.5);
    } else if (nextPreset === 'pop') {
      setG(0, 3.0); setG(1, 1.5); setG(2, -0.5); setG(3, 2.5); setG(4, 3.0); setG(5, 2.0);
    } else if (nextPreset === 'classic') {
      setG(0, -1.0); setG(1, 0.5); setG(2, 2.0); setG(3, 1.0); setG(4, 0.5); setG(5, 1.5);
    }
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const st = waRef.current;

    const initialMuted = readQcastMutedPref();
    audio.muted = desiredMuted(initialMuted);
    try {
      const globalHoldUntil = Number(window?.__forumQcastUnmuteHoldUntil || 0);
      if (globalHoldUntil > Date.now()) {
        audio.muted = false;
        audio.defaultMuted = false;
        audio.removeAttribute?.('muted');
        audio.dataset.__userUnmuteHoldUntil = String(globalHoldUntil);
        audio.dataset.__qcastManualUnmute = '1';
        if (hostRef.current?.dataset) hostRef.current.dataset.__userUnmuteHoldUntil = String(globalHoldUntil);
        if (hostRef.current?.dataset) hostRef.current.dataset.__qcastManualUnmute = '1';
      }
    } catch {}
    setMuted(!!audio.muted);

    try {
      const v = Number(audio.volume);
      if (Number.isFinite(v)) setVolume(Math.min(1, Math.max(0, v)));
    } catch {}

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => {
      setIsPlaying(true);
      setShowControls(true);
      syncMasterGain();
    };
    const onPause = () => setIsPlaying(false);
    const onCanPlay = () => {
      syncMasterGain();
    };
    let gainWatchId = 0;
    const startGainWatch = () => {
      if (gainWatchId) return;
      gainWatchId = window.setInterval(() => {
        try {
          if (!audio.paused) {
            syncMasterGain();
          }
        } catch {}
      }, 1600);
    };
    const stopGainWatch = () => {
      if (!gainWatchId) return;
      try { clearInterval(gainWatchId); } catch {}
      gainWatchId = 0;
    };
    const onPlayWithWatch = () => {
      onPlay();
      startGainWatch();
    };
    const onPauseWithWatch = () => {
      onPause();
      stopGainWatch();
    };

    const onVolume = () => {
      const now = Date.now();
      try {
        setMuted(!!audio.muted);
        const v = Number(audio.volume);
        if (Number.isFinite(v)) setVolume(Math.min(1, Math.max(0, v)));
        syncMasterGain();
        const persistUntil = Math.max(
          Number(audio?.dataset?.__persistMuteUntil || 0),
          Number(hostRef.current?.dataset?.__persistMuteUntil || 0),
        );
        const skipPersistUntil = Math.max(
          Number(audio?.dataset?.__skipMutePersistUntil || 0),
          Number(hostRef.current?.dataset?.__skipMutePersistUntil || 0),
        );
        if (skipPersistUntil <= now && persistUntil > now) {
          writeQcastMutedPref(!!audio.muted);
        }
      } catch {}
      try { 
        const persistUntil = Math.max(
          Number(audio?.dataset?.__persistMuteUntil || 0),
          Number(hostRef.current?.dataset?.__persistMuteUntil || 0),
        );
        const skipPersistUntil = Math.max(
          Number(audio?.dataset?.__skipMutePersistUntil || 0),
          Number(hostRef.current?.dataset?.__skipMutePersistUntil || 0),
        );
        if (skipPersistUntil > now || persistUntil <= now) return;
      } catch {}
      try { 
        window.dispatchEvent(new CustomEvent(mutedEventName, {
          detail: { muted: !!audio.muted, source: 'qcast', id: playerIdRef.current }
        }));
      } catch {}
    };

    const ensureAudioGraph = async () => {
      if (typeof window === 'undefined') return;
      if (!audioRef.current) return;
      if (!st.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try {
          st.ctx = new Ctx();
          const mk = (freq) => {
            const f = st.ctx.createBiquadFilter();
            f.type = 'peaking';
            f.frequency.value = freq;
            f.Q.value = 1.05;
            f.gain.value = 0;
            return f;
          };
          st.filters = [mk(60), mk(170), mk(350), mk(1000), mk(3500), mk(10000)];
          st.analyser = st.ctx.createAnalyser();
          st.analyser.fftSize = 1024;
          st.analyser.smoothingTimeConstant = 0.78;
          st.data = new Uint8Array(st.analyser.frequencyBinCount);
          // master output
          st.master = st.ctx.createGain();
          st.master.gain.value = Math.min(1, Math.max(0, Number(audioRef.current.volume ?? 1)));

          // dry/wet mix: DRY всегда даёт звук (страховка от “тишины”)
          st.dryGain = st.ctx.createGain();
          st.wetGain = st.ctx.createGain();
          st.dryGain.gain.value = 1.0;
          st.wetGain.gain.value = 0.0; // FX выключены по умолчанию

          st.panner = (typeof st.ctx.createStereoPanner === 'function') ? st.ctx.createStereoPanner() : null;
          if (st.panner) st.panner.pan.value = 0;

          st.srcNode = st.ctx.createMediaElementSource(audioRef.current);

          // DRY: source -> dryGain -> master
          st.srcNode.connect(st.dryGain);
          st.dryGain.connect(st.master);

          // WET: source -> filters -> analyser -> wetGain -> master
          let node = st.srcNode;
          for (const f of st.filters) { node.connect(f); node = f; }
          node.connect(st.analyser);
          st.analyser.connect(st.wetGain);
          st.wetGain.connect(st.master);

          // master -> (optional panner) -> destination
          if (st.panner) { st.master.connect(st.panner); st.panner.connect(st.ctx.destination); }
          else { st.master.connect(st.ctx.destination); }

        } catch {
          try { st.ctx?.close?.(); } catch {}
         st.ctx = null; st.analyser = null; st.srcNode = null;
          st.master = null; st.dryGain = null; st.wetGain = null;
          st.filters = null; st.panner = null; st.data = null;
          return;
        }
      }
      try { if (st.ctx?.state === 'suspended') await st.ctx.resume(); } catch {}
    };
    st.__ensure = ensureAudioGraph;

    // ... (визуализация у тебя остаётся, я её не ломал — тут только фиксы и добавления)
    // ВНИМАНИЕ: в твоём файле этот блок уже полностью есть в патче выше (чтобы применилось ровно 1-в-1).

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlayWithWatch);
    audio.addEventListener('pause', onPauseWithWatch);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('volumechange', onVolume);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlayWithWatch);
      audio.removeEventListener('pause', onPauseWithWatch);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('volumechange', onVolume);
      stopGainWatch();
      // Hard cleanup: release WebAudio graph/GPU resources on unmount.
      try { if (st.raf) cancelAnimationFrame(st.raf); } catch {}
      st.raf = 0;
      try { st.ro?.disconnect?.(); } catch {}
      st.ro = null;
      try { st.srcNode?.disconnect?.(); } catch {}
      try { st.analyser?.disconnect?.(); } catch {}
      try { st.master?.disconnect?.(); } catch {}
      try { st.dryGain?.disconnect?.(); } catch {}
      try { st.wetGain?.disconnect?.(); } catch {}
      try { st.panner?.disconnect?.(); } catch {}
      try { if (Array.isArray(st.filters)) st.filters.forEach((f) => f?.disconnect?.()); } catch {}
      const ctx = st.ctx;
      st.ctx = null;
      st.analyser = null;
      st.srcNode = null;
      st.master = null;
      st.dryGain = null;
      st.wetGain = null;
      st.filters = null;
      st.panner = null;
      st.data = null;
      try { ctx?.close?.(); } catch {}
    }; 
  }, [applyPreset, desiredMuted, mutedEventName, readQcastMutedPref, syncMasterGain, writeQcastMutedPref]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined') return undefined;

    const onMutedSync = (e) => {
      try {
        const d = e?.detail || {};
        if (d?.id && d.id === playerIdRef.current) return;
        if (typeof d?.muted !== 'boolean') return;
        const next = !!d.muted;
        const source = String(d?.source || '');
        const persistedPref = readQcastMutedPref();
        const userUnmuteHoldUntil = Math.max(
          Number(audio?.dataset?.__userUnmuteHoldUntil || 0),
          Number(hostRef.current?.dataset?.__userUnmuteHoldUntil || 0),
        );
        const hasManualUnmute =
          String(audio?.dataset?.__qcastManualUnmute || '') === '1' ||
          String(hostRef.current?.dataset?.__qcastManualUnmute || '') === '1';
        if (source !== 'qcast' && next && hasManualUnmute) {
          return;
        }
        if (source !== 'qcast' && next && userUnmuteHoldUntil > Date.now()) {
          return;
        }
        if (source !== 'qcast' && next && persistedPref === false) {
          return;
        }
        const manualLeaseUntil = Math.max(
          Number(audio?.dataset?.__manualLeaseUntil || 0),
          Number(hostRef.current?.dataset?.__manualLeaseUntil || 0),
        );
        if (
          source !== 'qcast' &&
          next &&
          !audio.paused &&
          !audio.muted &&
          manualLeaseUntil > Date.now()
        ) {
          return;
        }
        if (audio.muted !== next) audio.muted = next;
        setMuted(next);
        syncMasterGain();
      } catch {}
    };

    const onVisibilityRecover = () => {
      try {
        if (document.visibilityState !== 'visible') return;
      } catch {}
      try {
        const ctx = waRef.current?.ctx;
        if (ctx?.state === 'suspended' && typeof ctx.resume === 'function') {
          Promise.resolve(ctx.resume()).catch(() => {});
        }
        syncMasterGain();
      } catch {}
    };

    window.addEventListener(mutedEventName, onMutedSync);
    document.addEventListener('visibilitychange', onVisibilityRecover);
    window.addEventListener('pageshow', onVisibilityRecover);
    window.addEventListener('focus', onVisibilityRecover, true);

    return () => {
      window.removeEventListener(mutedEventName, onMutedSync);
      document.removeEventListener('visibilitychange', onVisibilityRecover);
      window.removeEventListener('pageshow', onVisibilityRecover);
      window.removeEventListener('focus', onVisibilityRecover, true);
    };
  }, [mutedEventName, readQcastMutedPref, syncMasterGain]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
  }, [rate]);

  React.useEffect(() => {
    if (!showControls && !showSettings) return undefined;
    const onDoc = (e) => {
      const host = hostRef.current;
      if (!host) return;
      if (host.contains(e.target)) return;
      setShowControls(false);
      setShowSettings(false);
    };
    document.addEventListener('pointerdown', onDoc, { passive: true });
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [showControls, showSettings]);

  const unlockAudio = async () => { try { await waRef.current.__ensure?.(); } catch {} };
  const needsAudioGraph = React.useCallback(() => {
    try {
      return !!waRef.current?.ctx || surround || preset !== 'custom';
    } catch {
      return false;
    }
  }, [preset, surround]);
  const maybeUnlockAudioGraph = React.useCallback(async () => {
    if (!needsAudioGraph()) return;
    try { await unlockAudio(); } catch {}
  }, [needsAudioGraph]);

  const togglePlay = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    openControls();
    const audio = audioRef.current;
    const host = hostRef.current;
    if (!audio) return;
    const unlockPromise = maybeUnlockAudioGraph();
    if (audio.paused) {
      const gestureUntil = String(Date.now() + 1800);
      const leaseUntil = String(Date.now() + 7200);
      try {
        delete audio.dataset.__autoplayFallbackMuted;
        delete audio.dataset.__skipMutePersistUntil;
        delete audio.dataset.__userPaused;
        delete audio.dataset.__userPausedAt;
        delete audio.dataset.__suppressedPlayUntil;
        audio.dataset.__userGestureUntil = gestureUntil;
        audio.dataset.__manualLeaseUntil = leaseUntil;
        try { audio.preload = 'auto'; } catch {}
        if ((audio.networkState === HTMLMediaElement.NETWORK_EMPTY) || !audio.currentSrc) {
          try { audio.load?.(); } catch {}
        }
        if (host?.dataset) {
          delete host.dataset.__autoplayFallbackMuted;
          delete host.dataset.__skipMutePersistUntil;
          delete host.dataset.__suppressedPlayUntil;
          host.dataset.__userGestureUntil = gestureUntil;
        }
        delete host?.dataset?.__userPaused;
        delete host?.dataset?.__userPausedAt;
        if (host?.dataset) host.dataset.__manualLeaseUntil = leaseUntil;
      } catch {}
      try { 
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            void unlockPromise;
            try {
              window.dispatchEvent(new CustomEvent('site-media-play', {
                detail: { source: 'qcast', element: host || null, manual: true, id: playerIdRef.current }
              }));
            } catch {}
          }).catch(() => {
            Promise.resolve(unlockPromise).then(() => {
              try {
                if (audio.paused) {
                  const retry = audio.play?.();
                  if (retry && typeof retry.then === 'function') {
                    retry.then(() => {
                      try {
                        window.dispatchEvent(new CustomEvent('site-media-play', {
                          detail: { source: 'qcast', element: host || null, manual: true, id: playerIdRef.current }
                        }));
                      } catch {}
                    }).catch(() => {});
                  }
                }
              } catch {}
            }).catch(() => {});
          });
        }
      } catch {}
    }
    else {
      try {
        audio.dataset.__userPaused = '1';
        audio.dataset.__userPausedAt = String(Date.now());
        audio.dataset.__suppressedPlayUntil = String(Date.now() + 4200);
        delete audio.dataset.__autoplayFallbackMuted;
        delete audio.dataset.__skipMutePersistUntil;
        delete audio.dataset.__userGestureUntil;
        delete audio.dataset.__manualLeaseUntil;
        if (host?.dataset) {
          host.dataset.__userPaused = '1';
          host.dataset.__userPausedAt = String(Date.now());
          host.dataset.__suppressedPlayUntil = String(Date.now() + 4200);
          delete host.dataset.__autoplayFallbackMuted;
          delete host.dataset.__skipMutePersistUntil;
          delete host.dataset.__userGestureUntil;
          delete host.dataset.__manualLeaseUntil;
        }
      } catch {}
      try { audio.pause(); } catch {}
      try { await unlockPromise; } catch {}
    }
  };

  const toggleMute = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    openControls(); await maybeUnlockAudioGraph();
    const audio = audioRef.current;
    const host = hostRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    audio.defaultMuted = !!audio.muted;
    if (audio.muted) audio.setAttribute?.('muted', '');
    else audio.removeAttribute?.('muted');
    const persistMuteUntil = String(Date.now() + 2600);
    writeQcastMutedPref(!!audio.muted);
    try {
      audio.dataset.__persistMuteUntil = persistMuteUntil;
      if (host?.dataset) host.dataset.__persistMuteUntil = persistMuteUntil;
      if (!audio.muted) {
        const gestureUntil = String(Date.now() + 1800);
        const leaseUntil = String(Date.now() + 90_000);
        const unmuteHoldUntil = String(Date.now() + (8 * 60 * 60 * 1000));
        if (Number(audio.volume || 0) <= 0.01) {
          try { audio.volume = 1; } catch {}
        }
        try { window.__forumQcastUnmuteHoldUntil = Number(unmuteHoldUntil); } catch {}
        audio.dataset.__userGestureUntil = gestureUntil;
        audio.dataset.__manualLeaseUntil = leaseUntil;
        audio.dataset.__userUnmuteHoldUntil = unmuteHoldUntil;
        audio.dataset.__qcastManualUnmute = '1';
        delete audio.dataset.__userPaused;
        delete audio.dataset.__userPausedAt;
        if (host?.dataset) {
          host.dataset.__userGestureUntil = gestureUntil;
          host.dataset.__manualLeaseUntil = leaseUntil;
          host.dataset.__userUnmuteHoldUntil = unmuteHoldUntil;
          host.dataset.__qcastManualUnmute = '1';
          delete host.dataset.__userPaused;
          delete host.dataset.__userPausedAt;
        }
      } else {
        try { delete window.__forumQcastUnmuteHoldUntil; } catch {}
        delete audio.dataset.__userUnmuteHoldUntil;
        delete audio.dataset.__qcastManualUnmute;
        if (host?.dataset) delete host.dataset.__userUnmuteHoldUntil;
        if (host?.dataset) delete host.dataset.__qcastManualUnmute;
      }
    } catch {}
    setMuted(!!audio.muted);
    try {
      const v = Number(audio.volume);
      if (Number.isFinite(v)) setVolume(Math.min(1, Math.max(0, v)));
    } catch {}
    syncMasterGain();
    try {
      requestAnimationFrame(() => {
        try { syncMasterGain(); } catch {}
      });
    } catch {}
    try { writeMuted(!!audio.muted); } catch {}
    try { window.dispatchEvent(new CustomEvent(mutedEventName,{ detail:{ muted: audio.muted, source:'qcast', id: playerIdRef.current } })); } catch {}
    try {
      if (!audio.muted && !audio.paused) {
        window.dispatchEvent(new CustomEvent('site-media-play', {
          detail: { source: 'qcast', element: host || null, manual: true, id: playerIdRef.current }
        }));
      }
    } catch {}
  };

  const setVol = async (v) => {
    const audio = audioRef.current;
    const host = hostRef.current;
    if (!audio) return;
    openControls(); await maybeUnlockAudioGraph();
    const next = Math.min(1, Math.max(0, Number(v)));
    try { audio.volume = next; } catch {}
    try {
      if (next > 0 && !audio.muted) {
        const leaseUntil = String(Date.now() + 90_000);
        audio.dataset.__manualLeaseUntil = leaseUntil;
        if (host?.dataset) host.dataset.__manualLeaseUntil = leaseUntil;
      }
    } catch {}
    setVolume(next);
    syncMasterGain();
  };

  const setPresetSafe = async (nextPreset) => {
    openControls(); await unlockAudio();
    setPreset(nextPreset);
    applyPreset(waRef.current, nextPreset);
    // как только пользователь выбрал пресет — включаем FX тракт
    setFxMix(nextPreset !== 'custom' || surround);    
  };
  const setFxMix = React.useCallback((on) => {
    const st = waRef.current;
    try {
      if (st.dryGain && st.wetGain) {
        // лёгкая подмешка dry оставляет атаку/чёткость, wet даёт “эффект”
        st.dryGain.gain.value = on ? 0.22 : 1.0;
        st.wetGain.gain.value = on ? 1.0 : 0.0;
      }
    } catch {}
  }, []);

  const toggleSurround = async () => {
    openControls(); await unlockAudio();
    setSurround((v) => {
      const next = !v;
      // surround = FX тракт
      setFxMix(next || preset !== 'custom');
      return next;
    });
    try { if (waRef.current.panner) waRef.current.panner.pan.value = (!surround) ? 0.18 : 0; } catch {}
  };
  // ===== Seek + Skip (FIX: были использованы в JSX, но не объявлены) =====
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const skipBy = React.useCallback((delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    openControls();
    const d = Number(duration || audio.duration || 0) || 0;
    const now = Number(audio.currentTime || 0) || 0;
    const next = clamp(now + Number(delta || 0), 0, d || now + Math.abs(delta || 0));
    try { audio.currentTime = next; } catch {}
    setCurrentTime(next);
  }, [duration, openControls]);

  const onSeek = React.useCallback(async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    openControls();
    await maybeUnlockAudioGraph();
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e?.target?.value || 0) || 0;
    try { audio.currentTime = t; } catch {}
    setCurrentTime(t);
  }, [maybeUnlockAudioGraph, openControls]);

// ===== Speed helpers (mobile uses single-cycle button) =====
const speedSteps = React.useMemo(() => [0.5, 0.75, 1, 1.25, 1.5, 2], []);
const cycleRate = React.useCallback((e) => {
  e?.preventDefault?.(); e?.stopPropagation?.();
  openControls();
  const i = Math.max(0, speedSteps.indexOf(rate));
  const next = speedSteps[(i + 1) % speedSteps.length];
  setRate(next);
}, [openControls, rate, speedSteps]);

// ===== Double tap on video = GOOD burst from tap point (TikTok/YouTube vibes) =====
const tapRef = React.useRef({ t: 0, x: 0, y: 0, timer: 0 });
const onPlayerPointerDown = React.useCallback((e) => {
  if (e?.button != null && e.button !== 0) return;

  const tEl = e?.target;
  try { if (tEl?.closest?.('.qcastControls')) return; } catch {}
  try { if (tEl?.closest?.('button, input, a, textarea, select')) return; } catch {}

  const x = e.clientX ?? 0;
  const y = e.clientY ?? 0;
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  const prev = tapRef.current;
  const dt = now - (prev.t || 0);
  const dx = x - (prev.x || 0);
  const dy = y - (prev.y || 0);
  const near = (dx * dx + dy * dy) <= (36 * 36);

  if (dt > 0 && dt < 280 && near) {
    if (prev.timer) { clearTimeout(prev.timer); prev.timer = 0; }
    tapRef.current = { t: 0, x: 0, y: 0, timer: 0 };
    try { spawnBoom('good', { x, y }); } catch {}
    try { spawnFx('good', { x, y }); } catch {}
    try { navigator?.vibrate?.(10); } catch {}
    return;
  }

  if (prev.timer) clearTimeout(prev.timer);
  const timer = setTimeout(() => {
    try { toggleControls(); } catch {}
    tapRef.current.timer = 0;
  }, 280);

  tapRef.current = { t: now, x, y, timer };
}, [spawnBoom, spawnFx, toggleControls]);

React.useEffect(() => {
  return () => {
    const tid = Number(tapRef.current?.timer || 0);
    if (tid) {
      try { clearTimeout(tid); } catch {}
    }
  };
}, []);

  return (
    <div className="qcastPlayer" ref={hostRef} onPointerDown={onPlayerPointerDown}
      data-preview={preview ? '1' : '0'} data-forum-media="qcast" data-qcast="1" data-viz={qcastFxProfile.viz ? '1' : '0'} dir={dir}>
      <Image className="qcastCover" src="/audio/Q-Cast.png" alt="Q-Cast" width={720} height={1280} unoptimized />
      {qcastFxProfile.viz ? ( 
        <canvas ref={canvasRef} className="qcastViz" data-on={isPlaying ? '1' : '0'} aria-hidden="true" />
      ) : null}
     <audio ref={audioRef} src={src} preload="metadata" playsInline crossOrigin="anonymous" referrerPolicy="no-referrer" data-qcast-audio="1" className="qcastAudio" />

      {FX_POOL > 0 ? (
        <div className="qcastFxLayer" data-scope={qcastFxProfile.fullscreen ? 'viewport' : 'card'} aria-hidden="true">
{Array.from({ length: FX_POOL }).map((_, i) => (
  <div key={i} ref={(el) => setFxNodeRef(el, i)} className="qcastFx" />
))}
{qcastFxProfile.boom && BOOM_POOL > 0 ? Array.from({ length: BOOM_POOL }).map((_, i) => (
  <div key={`b_${i}`} ref={(el) => setBoomNodeRef(el, i)} className="qcastBoom" />
)) : null}

        </div>
      ) : null}

<div
  className="qcastControls"
  data-visible={showControls ? '1' : '0'}
  onClick={(e) => e.stopPropagation()}
>
  <div className="qcastHudTop" aria-hidden="true">
    <div className="qcastCtrlEQ" data-on={isPlaying ? '1' : '0'}>
      <div className="qcastCtrlRail" />
      <div className="qcastCtrlBars">
        {ctrlBars.map((h, idx) => (
          <span
            key={idx}
            className="qcastCtrlBar"
            style={{ '--h': h, '--d': `${idx * 27}ms` }}
          />
        ))}
      </div>
      <div className="qcastCtrlShimmer" />
    </div>
  </div>

  {/* Mobile/Tablet: вертикальный правый рейл (как YouTube/TikTok) */}
  <div className="qcastSideRail">
    <button
      type="button"
      className="qcastReact qcastReact--good"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const point = { x: Number(e?.clientX), y: Number(e?.clientY) };
        spawnBoom('good', point);
        spawnFx('good', point);
      }}
      aria-label="Good reaction"
    >
      <span className="qcastReactEmoji">{goodEmoji}</span>
    </button>

    <button
      type="button"
      className="qcastReact qcastReact--bad"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const point = { x: Number(e?.clientX), y: Number(e?.clientY) };
        spawnBoom('bad', point);
        spawnFx('bad', point);
      }}
      aria-label="Bad reaction"
    >
      <span className="qcastReactEmoji">{badEmoji}</span>
    </button>

    <button
      type="button"
      className={`qcastBtn qcastBtn--rail ${muted ? 'isOn' : ''}`}
      onClick={toggleMute}
      aria-label="Mute"
    >
      <QCastIconVolume off={muted} />
    </button>

    <button
      type="button"
      className={`qcastBtn qcastBtn--rail ${showSettings ? 'isOn' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openControls(); setShowSettings((v) => !v); }}
      aria-label="Sound settings"
    >
      <QCastIconGear />
    </button>

    <button
      type="button"
      className="qcastSpeedPill"
      onClick={cycleRate}
      aria-label="Change speed"
    >
      {rate}x
    </button>
  </div>

  {/* Desktop: всё красиво снизу; Mobile/Tablet: снизу только transport + timeline */}
  <div className="qcastBottomBar">
    <div className="qcastBottomLeft">

            <button type="button" className="qcastBtn qcastBtn--main" onClick={togglePlay} aria-label="Play/Pause">
              {isPlaying ? <QCastIconPause /> : <QCastIconPlay />}
            </button>
            <button type="button" className="qcastBtn" onClick={() => skipBy(-10)} aria-label="Back 10 seconds"><QCastIconBack10 /></button>
            <button type="button" className="qcastBtn" onClick={() => skipBy(10)} aria-label="Forward 10 seconds"><QCastIconFwd10 /></button>
          </div>

          <div className="qcastBottomCenter">
            <span className="qcastTime">{formatMediaTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} step="0.1"
              value={Math.min(currentTime, duration || 0)} onChange={onSeek} className="qcastRange" aria-label="Seek" />
            <span className="qcastTime">{formatMediaTime(duration)}</span>
          </div>

<div className="qcastBottomRight qcastDesktopOnly">
  <button
    type="button"
    className="qcastReact qcastReact--good"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      const point = { x: Number(e?.clientX), y: Number(e?.clientY) };
      spawnBoom('good', point);
      spawnFx('good', point);
    }}
    aria-label="Good reaction"
  >
    <span className="qcastReactEmoji">{goodEmoji}</span>
  </button>

  <button
    type="button"
    className="qcastReact qcastReact--bad"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      const point = { x: Number(e?.clientX), y: Number(e?.clientY) };
      spawnBoom('bad', point);
      spawnFx('bad', point);
    }}
    aria-label="Bad reaction"
  >
    <span className="qcastReactEmoji">{badEmoji}</span>
  </button>

            <button type="button" className={`qcastBtn ${muted ? 'isOn' : ''}`} onClick={toggleMute} aria-label="Mute">
              <QCastIconVolume off={muted} />
            </button> 

<button
  type="button"
  className={`qcastBtn ${showSettings ? 'isOn' : ''}`}
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openControls(); setShowSettings((v) => !v); }}
  aria-label="Sound settings"
>
  <QCastIconGear />
</button>

            {preview && typeof onRemove === 'function' && (
              <button type="button" className="qcastBtn qcastBtn--danger" onClick={onRemove} title="Remove" aria-label="Remove">✕</button>
            )}
          </div>

        </div>

        <div className="qcastSettings qcastSettings--floating" data-open={showSettings ? '1' : '0'} onClick={(e) => e.stopPropagation()}>
          <div className="qcastSettingsHdr">
            <div className="qcastSettingsTitle">Sound</div>
            <button type="button" className="qcastSettingsClose"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSettings(false); }} aria-label="Close">✕</button>
          </div> 
          <div className="qcastSettingsBody">
            <div className="qcastSettingRow">
              <div className="qcastSettingLabel">Volume</div>
              <input type="range" min="0" max="1" step="0.01" value={volume}
                onChange={(e) => setVol(e.target.value)} className="qcastRange qcastRange--vol" aria-label="Volume" />
              <div className="qcastSettingVal">{Math.round(volume * 100)}%</div>
            </div>
            <div className="qcastSettingRow">
 <div className="qcastSettingRow">
   <div className="qcastSettingLabel">Speed</div>
   <div className="qcastPresetChips" role="group" aria-label="Playback speed">
     {speedSteps.map((val) => (
       <button
         key={val}
         type="button"
         className={`qcastChip ${rate === val ? 'active' : ''}`}
         onClick={(e) => { e.preventDefault(); e.stopPropagation(); openControls(); setRate(val); }}
       >
         {val}x
       </button>
     ))}
   </div>
 </div>   
              <div className="qcastSettingLabel">Preset</div>
              <div className="qcastPresetChips" role="group" aria-label="EQ Preset">
                {['custom','rock','pop','classic'].map((p) => (
                  <button key={p} type="button" className={`qcastChip ${preset === p ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPresetSafe(p); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div> 
            <div className="qcastSettingRow">
              <div className="qcastSettingLabel">Surround</div>
              <button type="button" className={`qcastToggle ${surround ? 'on' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSurround(); }} aria-label="Surround toggle">
                <span className="qcastToggleDot" />
                <span className="qcastToggleText">{surround ? 'On' : 'Off'}</span>
              </button>
            </div>
            <div className="qcastSettingsHint">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

