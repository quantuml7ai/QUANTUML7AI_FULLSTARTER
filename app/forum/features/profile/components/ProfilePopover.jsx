'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useEvent } from '../../../shared/hooks/useEvent'
import { cls } from '../../../shared/utils/classnames'
import { formatCount } from '../../../shared/utils/counts'
import FollowersCounterInline from '../../subscriptions/components/FollowersCounterInline'
import { resolveForumUserId } from '../../qcoin/utils/account'
import {
  resolveProfileAccountId,
  safeReadProfile,
  writeProfileAlias,
  mergeProfileCache,
} from '../utils/profileCache'
export default function ProfilePopover({
  anchorRef,
  open,
  onClose,
  t,
  auth,
  vipActive,
  onSaved,

  viewerId,
  myFollowersCount,
  myFollowersLoading,

  // 👇 deps from Forum scope (moderation + toasts)
  moderateImageFiles,
  toastI18n,
  reasonKey,
  reasonFallbackEN,
  icons = [],
  vipAvatars = [],
}) {
  void reasonFallbackEN


  // нормализуем UID через общий хелпер, чтобы TG и веб совпадали
  const baseAuth = auth || {};
  const base = baseAuth.asherId || baseAuth.accountId || '';
  const resolved = resolveForumUserId(base);
  const uid = resolveProfileAccountId(resolved);

  const readLocal = React.useCallback(() => {
    if (!uid || typeof window === 'undefined') return null;
    return safeReadProfile(uid) || null;
  }, [uid]);

  const initialLocal = readLocal() || {};
  const [nick, setNick] = useState(initialLocal.nickname || '');
  const [icon, setIcon] = useState(initialLocal.icon || icons[0] || '👦');
 
  // ===== Upload Avatar (custom photo) =====
  // ВАЖНО: превью и сохранение используют ОДИН И ТОТ ЖЕ canvas-рендер -> идеальное совпадение.
  const fileRef = useRef(null);
  const avaBoxRef = useRef(null);


  const [uploadFile, setUploadFile] = useState(null);      // File выбранный пользователем
  const [imgInfo, setImgInfo] = useState({ w: 0, h: 0 });  // натуральные размеры
  // crop:
  //  - x/y: относительный сдвиг (доля от стороны квадрата превью), чтобы одинаково смотрелось на desktop/mobile
  //  - z: zoom (mult)
  const [crop, setCrop] = useState({ x: 0, y: 0, z: 1 });  const [uploadBusy, setUploadBusy] = useState(false);
  const [finalAvatarBlob, setFinalAvatarBlob] = useState(null);
  const [finalAvatarUrl, setFinalAvatarUrl] = useState('');
  const finalAvatarUrlRef = useRef('');
  // ✅ мгновенное превью сразу после выбора файла (до canvas-crop)
  const [rawAvatarUrl, setRawAvatarUrl] = useState('');
  const rawAvatarUrlRef = useRef('');
  const pickTokenRef = useRef(0); // защита от гонок при быстром выборе файлов

  // ✅ защита от setState после unmount (save может продолжаться после onClose)
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const dragRef = useRef({ on: false, moved: false, canDrag: false, x: 0, y: 0, sx: 0, sy: 0, sz: 1 });
 
  const bmpRef = useRef(null); // ImageBitmap
  const boxSizeRef = useRef(0);

  // ===== Avatar preview (canvas) =====
  // WHY: <img> + object-fit:cover обрезает картинку в квадрат сразу после выбора.
  // Canvas-рендер рисует ПОЛНОЕ изображение и режет только при Save.
  const previewCanvasRef = useRef(null);
  const rafRef = useRef(0);
  const drawPendingRef = useRef(false);
  const dprRef = useRef(1);
  const cropLiveRef = useRef({ x: 0, y: 0, z: 1 });
  // x/y храним как долю от стороны квадрата (относительно),
  // чтобы превью не плавало между desktop/mobile и точно совпадало с сохранением.
  const relToPx = (rel, size) => (Number(rel) || 0) * (Number(size) || 0);
  const pxToRel = (px, size) => {
    const s = Number(size) || 0;
    if (!s) return 0;
    return (Number(px) || 0) / s;
  };

  const getDpr = () => {
    try {
      const v = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      // clamp: 1..2 (retina, но без лишней нагрузки)
      return Math.max(1, Math.min(2, Number(v) || 1));
    } catch {     
   return 1;
    }
  };

  const ensurePreviewCanvasSize = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const size = boxSizeRef.current || 0;
    if (!canvas || !size) return;

    const dpr = getDpr();
    dprRef.current = dpr;

    const w = Math.max(1, Math.round(size * dpr));
    const h = Math.max(1, Math.round(size * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    // css size — в CSS-пикселях
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }, []);

  const drawAvatarPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const bmp = bmpRef.current;
    const size = boxSizeRef.current || 0;
    if (!canvas || !bmp || !size) return;

    ensurePreviewCanvasSize();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current || 1;
    // рисуем в CSS-пикселях, масштаб задаём transform-ом
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const iw = bmp.width || 1;
    const ih = bmp.height || 1;
    const base = Math.max(size / iw, size / ih);

    const c = cropLiveRef.current || { x: 0, y: 0, z: 1 };
    const z = Math.max(1, Number(c.z || 1));
    const scale = base * z;

    const dw = iw * scale;
    const dh = ih * scale;
      const cx = size / 2 + relToPx(c.x, size);
      const cy = size / 2 + relToPx(c.y, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }, [ensurePreviewCanvasSize]);

  const requestPreviewDraw = useCallback(() => {
    if (drawPendingRef.current) return;
    drawPendingRef.current = true;
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } catch {}
    rafRef.current = requestAnimationFrame(() => {
      drawPendingRef.current = false;
      drawAvatarPreview();
    });
  }, [drawAvatarPreview]);
  const clampCropRef = useRef((next) => next);
  const ensurePreviewCanvasSizeRef = useRef(() => {});
  const requestPreviewDrawRef = useRef(() => {});

  // держим live-crop в ref (drag обновляет ref без лишних re-render)
  useEffect(() => {
    cropLiveRef.current = crop;
    requestPreviewDraw();
  }, [crop, requestPreviewDraw]);
  const shouldKeepObjectUrl = React.useCallback((url) => {
    if (!url || typeof window === 'undefined' || !uid) return false;
    try {
      const prof = safeReadProfile(uid);
      return prof?.icon === url;
    } catch {
      return false;
    }
  }, [uid]);
  const revokeObjectUrlIfSafe = React.useCallback((url) => {
    if (!url || shouldKeepObjectUrl(url)) return false;
    try {
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }, [shouldKeepObjectUrl]);
  const revokeObjectUrlIfSafeEvent = useEvent(revokeObjectUrlIfSafe)
  const cleanupObjectUrlsIfStale = () => {
    if (finalAvatarUrlRef.current && revokeObjectUrlIfSafeEvent(finalAvatarUrlRef.current)) {
      finalAvatarUrlRef.current = '';
    }
    if (rawAvatarUrlRef.current && revokeObjectUrlIfSafeEvent(rawAvatarUrlRef.current)) {
      rawAvatarUrlRef.current = '';
    }
  };
  // финальная уборка (на размонтирование)
  useEffect(() => {
    return () => {
      try { bmpRef.current?.close?.(); } catch {}
      bmpRef.current = null;
      if (finalAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafeEvent(finalAvatarUrlRef.current)) {
          finalAvatarUrlRef.current = '';
        }          
       }
      if (rawAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafeEvent(rawAvatarUrlRef.current)) {
          rawAvatarUrlRef.current = '';
        }
      }   
      };
  }, [revokeObjectUrlIfSafeEvent]);
  // когда поповер открывается — сбрасываем превью (чтобы не "тащилось" по страницам)
  useEffect(() => {
    if (!open) return;
    // не трогаем icon/nick (они уже выставляются ниже)
    // сбрасываем только upload-панель
    setUploadFile(null);
    setImgInfo({ w: 0, h: 0 });
    setCrop({ x: 0, y: 0, z: 1 });
    setUploadBusy(false);
    setFinalAvatarBlob(null);
    setFinalAvatarUrl('');
    if (finalAvatarUrlRef.current) {
      if (revokeObjectUrlIfSafeEvent(finalAvatarUrlRef.current)) {
        finalAvatarUrlRef.current = '';
      }
    }  

    setRawAvatarUrl('');
    if (rawAvatarUrlRef.current) {
      if (revokeObjectUrlIfSafeEvent(rawAvatarUrlRef.current)) {
        rawAvatarUrlRef.current = '';
      }
    }      
    try { bmpRef.current?.close?.(); } catch {}
    bmpRef.current = null;
  }, [open, revokeObjectUrlIfSafeEvent]);

  // resize: держим превью-канвас = размеру квадрата (адаптив)
  useEffect(() => {
    if (!open) return;
    const el = avaBoxRef.current;
    if (!el) return;

    const applySize = () => {
      const r = el.getBoundingClientRect();
      const sz = Math.max(1, Math.round(Math.min(r.width, r.height)));
      boxSizeRef.current = sz;
      // если квадрат по размеру поменялся (desktop<->mobile/ресайз),
      // кроп мог оказаться вне границ -> клэмпим лайв сразу.
      try {
        const cur = cropLiveRef.current || { x: 0, y: 0, z: 1 };
        const clamped = clampCropRef.current(cur);
        cropLiveRef.current = clamped;
        // синхронизируем state только если не тащим прямо сейчас
        if (!dragRef.current?.on) {
          if (clamped.x !== cur.x || clamped.y !== cur.y || clamped.z !== cur.z) {
            setCrop(clamped);
          }
        }
      } catch {}      
      try { ensurePreviewCanvasSizeRef.current(); } catch {}
      try { requestPreviewDrawRef.current(); } catch {}
    };

    applySize();
    const ro = new ResizeObserver(() => applySize());
    ro.observe(el);
    window.addEventListener('resize', applySize, { passive: true });
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener('resize', applySize);
    };
  }, [open]);

  const clampCrop = React.useCallback((next) => {
    const bmp = bmpRef.current;
    const size = boxSizeRef.current || 0;
    if (!bmp || !size) return next;
    const iw = bmp.width || 1;
    const ih = bmp.height || 1;
    const base = Math.max(size / iw, size / ih);
    const scale = base * Math.max(1, Number(next?.z || 1));
    const drawW = iw * scale;
    const drawH = ih * scale;
    const maxX = Math.max(0, (drawW - size) / 2);
    const maxY = Math.max(0, (drawH - size) / 2);
    // x/y тут в относительных единицах (1.0 = ширинаквадрата)
    const maxXRel = maxX / size;
    const maxYRel = maxY / size;
    const x = Math.min(maxXRel, Math.max(-maxXRel, Number(next?.x || 0)));
    const y = Math.min(maxYRel, Math.max(-maxYRel, Number(next?.y || 0)));
    return { x, y, z: Math.max(1, Number(next?.z || 1)) };
  }, []);
  useEffect(() => { clampCropRef.current = clampCrop; }, [clampCrop]);
  useEffect(() => { ensurePreviewCanvasSizeRef.current = ensurePreviewCanvasSize; }, [ensurePreviewCanvasSize]);
  useEffect(() => { requestPreviewDrawRef.current = requestPreviewDraw; }, [requestPreviewDraw]);

 
  const openFilePicker = () => fileRef.current?.click?.();

  const onPickFile = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    // 1) мгновенно показываем выбранное изображение (без "PROCESSING")
    const token = ++pickTokenRef.current;  
    try {
      if (finalAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafe(finalAvatarUrlRef.current)) {
          finalAvatarUrlRef.current = '';
        }
      }      
      if (rawAvatarUrlRef.current) {
        if (revokeObjectUrlIfSafe(rawAvatarUrlRef.current)) {
          rawAvatarUrlRef.current = '';
        }
      }
      const url = URL.createObjectURL(f);
      rawAvatarUrlRef.current = url;
      setRawAvatarUrl(url);
      setFinalAvatarUrl('');
      finalAvatarUrlRef.current = ''; } catch {}

    // 2) базовые стейты
    setUploadFile(f);
    setFinalAvatarBlob(null);    
    setCrop({ x: 0, y: 0, z: 1 });
    setImgInfo({ w: 0, h: 0 });
    // 3) декод в bitmap + натуральные размеры (асинхронно)
    (async () => {
      try {
        try { bmpRef.current?.close?.(); } catch {}
        let bmp = null;
        if (typeof createImageBitmap === 'function') {
          try { bmp = await createImageBitmap(f); } catch {}
        }
        if (!bmp) {
          const localUrl = URL.createObjectURL(f);
          bmp = await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.decoding = 'async';
            img.onload = () => {
              try {
                img.close = () => { try { URL.revokeObjectURL(localUrl); } catch {} };
              } catch {}
              resolve(img);
            };
            img.onerror = () => {
              try { URL.revokeObjectURL(localUrl); } catch {}
              reject(new Error('avatar_decode_failed'));
            };
            img.src = localUrl;
          });
        }
        if (pickTokenRef.current !== token) {
          try { bmp?.close?.(); } catch {}
          return;
        }
        bmpRef.current = bmp;
        setImgInfo({ w: bmp?.width || 0, h: bmp?.height || 0 });
        try { requestPreviewDraw(); } catch {}
      } catch {
        // если bitmap не создался — оставляем raw превью
      }
    })();

    try { e.target.value = ''; } catch {}
  };

  const onPointerDown = (e) => {

    e.preventDefault();
    e.stopPropagation();
    const p = dragRef.current;
    p.on = true;
    p.moved = false;
    p.canDrag = !!uploadFile && !!bmpRef.current;    
    p.x = e.clientX;
    p.y = e.clientY;
    // фиксируем размер квадрата на момент начала drag,
    // чтобы расчёт dx/dy был стабильным даже если layout чуть "дышит".
    p.sz = boxSizeRef.current || 1;    
    // стартуем от актуального live-crop (а не от стейта, чтобы всё совпадало с canvas)
    const c0 = cropLiveRef.current || crop;
    p.sx = Number(c0?.x || 0);
    p.sy = Number(c0?.y || 0);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const p = dragRef.current;
    if (!p.on) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && (dx * dx + dy * dy > 9)) {
      p.moved = true;
    }
    if (!p.moved || !p.canDrag) return;    
    // PERF: не setState на каждом пикселе — обновляем ref и перерисовываем в rAF
    const sz = p.sz || boxSizeRef.current || 1;
    const dxRel = dx / sz;
    const dyRel = dy / sz;    
    const next = clampCrop({
      ...(cropLiveRef.current || crop),
      x: p.sx + dxRel,
      y: p.sy + dyRel,
    });
    cropLiveRef.current = next;
    requestPreviewDraw();
  };
  const onPointerUp = (e) => {
    const p = dragRef.current;
    if (!p.on) return;
    p.on = false;
    p.canDrag = false;   
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
    if (!p.moved) {
      openFilePicker();
      return;
    }

    // commit: один setState на release
    const committed = clampCrop(cropLiveRef.current || crop);
    cropLiveRef.current = committed;
    setCrop(committed);
    requestPreviewDraw();  
  };

  // делаем квадратный PNG из превью (клиентский кроп)
const makeCroppedPngBlob = React.useCallback(async ({ size = 512 } = {}) => {
    const bmp = bmpRef.current;
    if (!bmp) return null;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const iw = bmp.width || 1;
    const ih = bmp.height || 1;
    const base = Math.max(size / iw, size / ih);

    // IMPORTANT: берём live-crop (drag может ещё не успеть прожечь setState)
    const c = cropLiveRef.current || { x: 0, y: 0, z: 1 };
    const z = Math.max(1, Number(c?.z || 1));
    const scale = base * z;
    const dw = iw * scale;
    const dh = ih * scale;
    const cx = size / 2 + relToPx(c?.x, size);
    const cy = size / 2 + relToPx(c?.y, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.92);
    });
 }, []);


  // грузим на сервер и ставим icon=url (но НЕ сохраняем профиль — это сделает основной Save)
  const useUploadedPhoto = async () => {
    if (!uid || !finalAvatarBlob || uploadBusy) return;
    setUploadBusy(true);
    try {
 
      const fd = new FormData();
      fd.append('uid', uid);
      fd.append('file', finalAvatarBlob, 'avatar.png');

      const r = await fetch('/api/profile/upload-avatar', { method: 'POST', body: fd });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok || !j?.url) return;

      // важно: icon становится url, но сохранение только по главной кнопке Save
      setIcon(j.url);
    } finally {
      setUploadBusy(false);
    }
  };

  // валидация ника
  const [nickFree, setNickFree] = useState(null)   // null|true|false
  const [nickBusy, setNickBusy] = useState(false)  // идет проверка
  const [busy, setBusy] = useState(false)          // сохранение
  useEffect(() => {
  if (!open || !uid) return;
  const l = readLocal() || {};
  setNick(l.nickname || '');
  setIcon(l.icon || icons[0] || '👦');
}, [open, uid, readLocal, icons]);

// дебаунс-проверка ника в базе
useEffect(() => {
  if (!open || !uid) {
    setNickFree(null);
    setNickBusy(false);
    return;
  }

  const val = String(nick || '').trim();
  if (!val) {
    setNickFree(null);
    setNickBusy(false);
    return;
  }

  setNickBusy(true);
  const h = setTimeout(async () => {
    try {
      const url = `/api/profile/check-nick?nick=${encodeURIComponent(val)}&uid=${encodeURIComponent(uid)}`;
      const r = await fetch(url, { method: 'GET', cache: 'no-store' });
      const j = await r.json().catch(() => null);

      // j?.ok === false или странный ответ — считаем «не знаем», но НЕ кидаем ошибок
      if (!j || j.error) {
        setNickFree(null);
      } else {
        setNickFree(!!j.free);
      }
    } catch {
      // любая сеть/бэк — просто "не знаем"
      setNickFree(null);
    } finally {
      setNickBusy(false);
    }
  }, 300);

  return () => clearTimeout(h);
}, [open, nick, uid]);


if (!open || !anchorRef?.current || !uid) return null;

// ===== позиционирование попапа (LTR/RTL) =====
const isRtl =
  typeof document !== 'undefined' &&
  (document.documentElement?.dir === 'rtl' ||
    getComputedStyle(document.documentElement).direction === 'rtl');

const el = anchorRef.current;

// ищем ближайшего “контейнерного” родителя, относительно которого будет absolute-позиционирование
const parent =
  el.offsetParent ||
  el.parentElement ||
  el.closest('section') ||
  document.body;

const parentRect = parent?.getBoundingClientRect?.() || { top: 0, left: 0, right: 0 };
const rect = el.getBoundingClientRect();

// top/left/right — теперь ВНУТРИ parent (а не в координатах окна)
const top = Math.round((rect.bottom - parentRect.top) + 8);

// LTR — обычный left
const left = isRtl ? undefined : Math.round(rect.left - parentRect.left);

// RTL — прижимаем по правому краю parent
const right = isRtl ? Math.round(parentRect.right - rect.right) : undefined;

  const save = async () => {
  const n = String(nick || '').trim();
  if (!n || nickFree === false || busy || !uid) return;

  // ===== OPTIMISTIC UI (сразу обновляем всё в интерфейсе пользователя) =====
  const prevLocal = readLocal() || {};
  const prevNick = prevLocal.nickname || '';
  const prevIcon = prevLocal.icon || icons[0] || '👦';

  // если выбран файл — показываем везде то, что уже есть в превью
  const optimisticIcon = uploadFile ? (finalAvatarUrl || rawAvatarUrl || icon) : icon;

  mergeProfileCache(uid, { nickname: n, icon: optimisticIcon, updatedAt: Date.now() });
  onSaved?.({ nickname: n, icon: optimisticIcon });

  // закрываем поповер мгновенно (дальше всё догружается в фоне)
  onClose?.();

  // ===== серверная часть (в фоне): загрузка аватара + сохранение =====
  if (mountedRef.current) setBusy(true);
  try {
    let iconToSend = icon;

    // Если выбрано пользовательское фото — модерируем и грузим в /api/forum/upload.
    if (uploadFile) {
      if (mountedRef.current) setUploadBusy(true);
      try {
        // На мобильных заранее работаем с уже-cropped PNG:
        // меньше риск moderation timeout/oom и стабильнее upload.
        const avatarCropSize = (() => {
          try {
            const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches;
            return coarse ? 384 : 512;
          } catch {
            return 512;
          }
        })();
        let blob = finalAvatarBlob;
        if (!blob) blob = await makeCroppedPngBlob({ size: avatarCropSize });
        const preparedAvatarFile = blob
          ? new File([blob], `avatar-${uid}-${Date.now()}.png`, { type: 'image/png' })
          : uploadFile;

        // 0) MODERATION: точно так же, как в attach (paperclip)
        try {
          const mod = await moderateImageFiles([preparedAvatarFile]);
          if (mod?.decision === 'block') {
            toastI18n('warn', 'forum_image_blocked');
            toastI18n('info', reasonKey(mod?.reason));
            // rollback optimistic
            mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
            onSaved?.({ nickname: prevNick, icon: prevIcon });
            cleanupObjectUrlsIfStale();      
            return;
          }
          if (mod?.decision === 'review') {
            try { console.warn('[moderation] avatar review -> allow (balanced)', mod?.reason, mod?.raw); } catch {}
          }
        } catch (err) {
          console.error('[moderation] avatar check failed', err);
          toastI18n('err', 'forum_moderation_error');
          toastI18n('info', 'forum_moderation_try_again');
          // rollback optimistic
          mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
          onSaved?.({ nickname: prevNick, icon: prevIcon });
           cleanupObjectUrlsIfStale();     
          return;
        }
 
        const fd = new FormData();
        if (blob && preparedAvatarFile) {
          fd.append('files', preparedAvatarFile);
        } else {
          // крайний случай: отправляем исходный файл (без кропа), чтобы не стопорить UX
          fd.append('files', uploadFile);
        }

        const up = await fetch('/api/forum/upload', {
          method: 'POST',
          body: fd,
          cache: 'no-store',
          headers: { 'x-forum-user-id': String(uid || '') },
        });
        const uj = await up.json().catch(() => ({}));
        if (!up.ok || !uj?.urls?.[0]) {
          console.warn('avatar upload failed', uj);
          // rollback optimistic
          mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
          onSaved?.({ nickname: prevNick, icon: prevIcon });
          cleanupObjectUrlsIfStale();     
          return;
        }

        iconToSend = uj.urls[0];

        // ✅ reconcile: подменяем blob-превью на реальный URL (чтобы пережило перезагрузку)
        mergeProfileCache(uid, { icon: iconToSend, updatedAt: Date.now() });
        onSaved?.({ nickname: n, icon: iconToSend });
        cleanupObjectUrlsIfStale();     
      } finally {
        if (mountedRef.current) setUploadBusy(false);
      }
    } else {
      iconToSend = icon;
    }


    const r = await fetch('/api/profile/save-nick', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forum-user-id': String(base || uid || '').trim(),
      },
      body: JSON.stringify({
        nick: n,
        icon: iconToSend,
        // canonical ids
        accountId: uid,
        asherId: uid,
        // raw ids for cross-client alias fan-out
        userId: String(base || uid || '').trim(),
        rawUserId: String(base || '').trim(),
        sourceAccountId: String(baseAuth?.accountId || '').trim(),
        sourceAsherId: String(baseAuth?.asherId || '').trim(),
        sourceForumUserId: (() => {
          try { return String(localStorage.getItem('forum_user_id') || '').trim() } catch { return '' }
        })(),
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      if (j?.error === 'nick_taken' && mountedRef.current) setNickFree(false);
      // rollback optimistic
      mergeProfileCache(uid, { nickname: prevNick, icon: prevIcon, updatedAt: Date.now() });
      onSaved?.({ nickname: prevNick, icon: prevIcon });
      cleanupObjectUrlsIfStale();    
      return;
    }

    const savedNick = j.nick || n;
    const savedIcon = j.icon || iconToSend || optimisticIcon;
    const savedAccountId = String(j.accountId || uid || '').trim();

    writeProfileAlias(uid, savedAccountId);
    mergeProfileCache(savedAccountId, { nickname: savedNick, icon: savedIcon, updatedAt: Date.now() });
  // финальный reconcile на ответ бэка
    onSaved?.({ nickname: savedNick, icon: savedIcon });
    cleanupObjectUrlsIfStale();
  } finally {
if (mountedRef.current) setBusy(false);
  }
};


  return (

    <div className="profilePop" 
    style={{ top, left, right }}
    translate="no"
    >
  
      <div className="text-lg font-bold mb-2">{t('forum_account_settings')}</div>

      {/* Под заголовком: слева бейдж со звездой, справа квадратный Upload Avatar (одна линия) */}
      <div className="profileTopRow">
        <div className="profileBadgeLeft">
          <FollowersCounterInline
            t={t}
            viewerId={viewerId}
            count={myFollowersCount}
            loading={myFollowersLoading}
            formatCountFn={formatCount}
          />
        </div>

        <button
          type="button"
          ref={avaBoxRef}
          className="avaUploadSquare" 
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}       
          title="Upload avatar"
          aria-label="Upload avatar"
        >
          {/* PREVIEW:
              - до декода показываем исходник (без квадратного object-fit crop)
              - после декода рисуем на canvas (полное изображение + drag/zoom),
                а кроп в PNG делаем ТОЛЬКО при Save.
          */}
          {rawAvatarUrl && !uploadFile && (
            // eslint-disable-next-line @next/next/no-img-element -- blob/object URL preview from local file picker must render as raw img src.
            <img
              src={rawAvatarUrl}
              alt=""
              className="avaUploadSquareImgFallback"
            />
          )}

          {rawAvatarUrl && uploadFile && !(imgInfo.w && imgInfo.h) && (
            // eslint-disable-next-line @next/next/no-img-element -- blob/object URL preview from local file picker must render as raw img src.
            <img
              src={rawAvatarUrl}
              alt=""
              className="avaUploadSquareImgFallback"
            />
          )}

          {uploadFile && (imgInfo.w && imgInfo.h) && (
            <canvas
              ref={previewCanvasRef}
              className="avaUploadSquareCanvas" 
            />
          )}
          {!uploadFile && (
            <div className="avaUploadSquareTxt">
              {t('forum_avatar_upload_top')}
              <br/>
              
            </div>
          )}
          {uploadFile && !finalAvatarUrl && !rawAvatarUrl && (
            <div className="avaUploadSquareTxt">{t('forum_processing')}</div>
          )}          
          {uploadBusy && (
            <div className="avaUploadSquareBusy">{t('saving')}</div>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="avaFileInput"
          onChange={onPickFile}
        />
      </div>

      {/* Zoom: следующей строкой, на всю ширину, адаптив */}
      <div className="avaZoomWideRow">
        <span className="avaZoomLbl">{t('forum_zoom')}</span>
        <input
          type="range"
          className="cyberRange"
          min="1"
          max="3"
          step="0.01"
          value={crop.z}
          disabled={!uploadFile}
          onChange={(e) => {
            const v = Number(e.target.value);
            setCrop((c) => {
              const next = clampCrop({ ...c, z: v });
              cropLiveRef.current = next;
              try { requestPreviewDraw(); } catch {}
              return next;
            });
          }}
        />
      </div>
      <div className="grid gap-2">
        <label className="block">
          <div className="topicDesc text-[#eaf4ff]/75 text-sm
      !whitespace-normal break-words
      [overflow-wrap:anywhere]
      max-w-full mt-1">{t('forum_profile_nickname')}</div>
          <input
            className={['input',
              nickFree===true ? 'ok' : '',
              nickFree===false ? 'bad' : ''
            ].join(' ')}
            maxLength={24}
            value={nick}
            onChange={e => setNick(e.target.value)}
            placeholder={t('forum_profile_nickname_ph')}
          />
        <div className="meta mt-1">
            {nickBusy && t('checking')}
            {!nickBusy && nickFree===true  && t('nick_free')}
            {!nickBusy && nickFree===false && t('nick_taken')}
          </div>
        </label>
        <div>
      <div className="forumDividerRail forumDividerRail--gold" style={{ margin: '20px 4px' }} aria-hidden="true" />
           
          <div className="profileAvatarHead">
            <div className="meta">{t('forum_profile_avatar')}</div>
            <div className="meta" style={{ opacity: .7 }}>
              {uploadFile ? `${imgInfo.w || 0}×${imgInfo.h || 0}` : t('')}
            </div>
          </div>

<div className="profileList">
  {/* VIP блок (верхняя строка) */}
  <div className="p-1">
    <div className="emojiTitle">{t('') /* "VIP+ аватары" */}</div>

    <div className="iconWrap">
      {vipAvatars.slice(0,130).map(src => (
        <button
          key={src}
          className={cls('avaMini', icon===src && 'tag', 'hoverPop')}
          onClick={()=>{

  if (!vipActive){
    try { toastI18n?.('warn', 'forum_vip_required') } catch {}
    try { document.activeElement?.blur?.() } catch {}
    return;
  }
  
            setIcon(src) }}
          title={vipActive ? '' : t('forum_vip_only')}
          style={{ position:'relative', width:40, height:40, padding:0 }}
        >
          <Image src={src} alt="" width={40} height={40} unoptimized style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }}/>
         {!vipActive && <span className="lockBadge" aria-hidden>🔒</span>}
        </button>       
      ))}
    </div>
  </div>

  {/* разделитель между VIP и обычными */}
  <div className="forumDividerRail forumDividerRail--gold" style={{ margin: '20px 4px' }} aria-hidden="true" />

  {/* обычные эмодзи-аватары ниже (как было) */}
  <div className="iconWrap p-1">
    {icons.map(ic => (
      <button
        key={ic}
        className={cls('avaMini', icon === ic && 'tag', vipActive && 'vip')}
        onClick={() => setIcon(ic)}
        title={ic}
        style={{ width: 40, height: 40, fontSize: 22 }}
      >
        {ic}
      </button>
    ))}
  </div>
</div>

        </div>
        <div className="flex items-center justify-end gap-2">
          <button className="btn btnGhost" onClick={onClose}>{t('forum_cancel')}</button>
          <button
            className="btn"
            disabled={busy || nickBusy || !String(nick||'').trim() || nickFree===false}
            onClick={save}
          >
            {busy ? t('saving') : t('forum_save')}
          </button>
        </div>
      </div>
    </div>
    
  )
}


/* =========================================================
   UI: посты/темы
========================================================= */

