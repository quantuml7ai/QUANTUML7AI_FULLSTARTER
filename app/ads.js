// app/ads.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getForumAdConf,
  resolveCurrentAdUrl,
  AdCard,
  AdsCoordinator,
} from './forum/ForumAds';

/* ========= helpers ========= */

function isBrowser() {
  return typeof window !== 'undefined';
}

function getClientIdSafe() {
  if (!isBrowser()) return 'guest';

  try {
    // если где-то уже есть clientId / forumClientId — используем
    const w = window;
    return (
      w.__forumClientId ||
      w.__clientId ||
      w.__qClientId ||
      w.localStorage?.getItem('forum_client_id') ||
      'guest'
    );
  } catch {
    return 'guest';
  }
}

function getPageKey() {
  if (!isBrowser()) return 'ssr';

  try {
    const { hostname = '', pathname = '' } = window.location || {};
    const raw = `${hostname}${pathname}` || 'page';
    const norm = raw.replace(/[^a-zA-Z0-9]+/g, '_');
    return norm || 'page';
  } catch {
    return 'page';
  }
}

let globalInstanceCounter = 0;

/**
 * Делаем уникальный ключ потока:
 * - базовый slotKey (как ты уже передаёшь в JSX),
 * - + тип слота,
 * - + страница,
 * - + порядковый номер инстанса.
 *
 * Важно:
 * - Один и тот же вызов на другой странице → другой поток.
 * - Несколько одинаковых вызовов на одной странице → разные потоки.
 * - При этом developer-friendly slotKey, который ты пробрасываешь, сохраняется внутри.
 */
function buildInternalSlotKey(slotKeyProp, slotKindProp) {
  const base =
    (slotKeyProp && String(slotKeyProp)) ||
    (slotKindProp && String(slotKindProp)) ||
    'ads';

  const page = getPageKey();

  globalInstanceCounter += 1;
  const idx = globalInstanceCounter;

  // Это то, что реально участвует в подборе урла
  return `${base}__${page}__${idx}`;
}

/* ========= основной компонент ========= */

export function HomeBetweenBlocksAd({ slotKey, slotKind }) {
  // Конфиг форума: ENV, локалсторадж, query, FORUM_CONF и т.п.
  const conf = useMemo(() => getForumAdConf(), []);

  const clientId = getClientIdSafe();

  // Фиксируем уникальный ключ слота один раз на инстанс
  const internalKeyRef = useRef(null);
  if (!internalKeyRef.current) {
    internalKeyRef.current = buildInternalSlotKey(slotKey, slotKind);
  }
  const internalSlotKey = internalKeyRef.current;

  // Фиксируем начальное время, чтобы не дёргать лишний раз на рендер
  const initialNowRef = useRef(null);
  if (initialNowRef.current == null) {
    initialNowRef.current = isBrowser() ? Date.now() : 0;
  }

  // Текущее URL объявы для этого конкретного потока
  const [url, setUrl] = useState(() =>
    resolveCurrentAdUrl(
      conf,
      clientId,
      initialNowRef.current || undefined,
      internalSlotKey,
      AdsCoordinator
    )
  );

  // Обновляем по таймеру согласно ROTATE_MIN (как в ForumAds)
  useEffect(() => {
    if (!isBrowser()) return;
    const rotateMin = Number(conf.ROTATE_MIN || 1);
    const periodMs = Math.max(1, rotateMin) * 60_000;

    if (!Number.isFinite(periodMs) || periodMs <= 0) return;

    let timer = null;

    const schedule = () => {
      const now = Date.now();
      const currentBucket = Math.floor(now / periodMs);
      const nextBucketStart = (currentBucket + 1) * periodMs;
      const delay = Math.max(500, nextBucketStart - now + 10); // чуть вперёд, чтобы точно перейти

      timer = setTimeout(() => {
        const nextUrl = resolveCurrentAdUrl(
          conf,
          getClientIdSafe(),
          Date.now(),
          internalSlotKey,
          AdsCoordinator
        );
        if (nextUrl) {
          setUrl(nextUrl);
        }
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [conf, internalSlotKey]);

  if (!url) return null;

  const effectiveSlotKind =
    (slotKind && String(slotKind)) ||
    (slotKey && String(slotKey)) ||
    'home_between';

  return (
    <>
      <section
        className="panel"
        data-ads-slot={internalSlotKey}
        data-ads-base-slot={slotKey || ''}
        data-ads-kind={effectiveSlotKind}
        aria-label="Реклама"
      >
        <AdCard
          url={url}
          slotKind={effectiveSlotKind}
          nearId={internalSlotKey}
           layout="fluid"
        />
      </section>

      {/* Локальные стили только для рекламного слота */}
      <style jsx>{`
        /* Любой медиа-контент внутри рекламного секшена:
           - старается занять всю ширину
           - если меньше, то по центру с одинаковыми отступами слева/справа */
        section[data-ads-slot] :global(img),
        section[data-ads-slot] :global(video) {
          display: block;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }

        /* Для iframe / svg / canvas — только центрируем и ограничиваем ширину,
           размеры (width/height) берём из inline-стилей AdCard (YouTube и т.п.) */
        section[data-ads-slot] :global(iframe),
        section[data-ads-slot] :global(svg),
        section[data-ads-slot] :global(canvas) {
          display: block;
          margin-left: auto;
          margin-right: auto;
          max-width: 100%;
        }
      `}</style>
    </>
  );
}

export default HomeBetweenBlocksAd;
