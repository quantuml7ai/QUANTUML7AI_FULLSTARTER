// app/ads.js
'use client';

import React, { useMemo } from 'react';
import {
  getForumAdConf,
  resolveCurrentAdUrl,
  AdCard,
  AdsCoordinator,
} from './forum/ForumAds';

function getClientIdSafe() {
  if (typeof window === 'undefined') return 'guest';
  try {
    // если где-то уже есть clientId / forumClientId — используем
    return (
      window.__forumClientId ||
      window.__clientId ||
      window.__qClientId ||
      'guest'
    );
  } catch {
    return 'guest';
  }
}

/**
 * Жёсткий рекламный слот для главной:
 * - использует те же ENV/LINKS, что форум
 * - тот же resolveCurrentAdUrl / AdsCoordinator
 * - фиксированное место между первым и вторым блоком
 */
export function HomeBetweenBlocksAd({
  slotKey = 'home_between_1_2',
  slotKind = 'home_between',
}) {
  const conf = useMemo(() => getForumAdConf(), []);
  const clientId = getClientIdSafe();

  // один детерминированный выбор для слота
  const now = (typeof window !== 'undefined') ? Date.now() : 0;
  const url = resolveCurrentAdUrl(
    conf,
    clientId,
    now || undefined,
    slotKey,
    AdsCoordinator
  );

  if (!url) {
    return null; // нет валидных ссылок — ничего не рисуем
  }

  return (
    <section
      className="panel"
      data-ads-slot={slotKey}
      aria-label="Реклама"
    >
      <AdCard
        url={url}
        slotKind={slotKind}
        nearId={slotKey}
      />
    </section>
  );
}

export default HomeBetweenBlocksAd;
