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
        className="panel ads-panel"
        data-ads-slot={internalSlotKey}
        data-ads-base-slot={slotKey || ''}
        data-ads-kind={effectiveSlotKind}
        aria-label="Реклама"
      >
        <div className="ads-media-wrapper">
          <AdCard
            url={url}
            slotKind={effectiveSlotKind}
            nearId={internalSlotKey}
          />
        </div>
      </section>

      <style jsx>{`
        .ads-panel {
          width: 100%;
        }

        /* Обёртка, которая всегда центрирует карточку/медиа */
        .ads-media-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        /* На всякий случай централизуем любой медиаконтент внутри */
        .ads-media-wrapper :global(img),
        .ads-media-wrapper :global(video),
        .ads-media-wrapper :global(svg),
        .ads-media-wrapper :global(canvas) {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </>
  );
}

export default HomeBetweenBlocksAd;
