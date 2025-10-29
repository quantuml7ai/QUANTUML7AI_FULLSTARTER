'use client';

import React, { useEffect, useState } from 'react';

export default function TmaAutoPage() {
  const [msg, setMsg] = useState('Starting…');

  useEffect(() => {
    (async () => {
      try {
        // 1) initData из hash (tgWebAppData=…) или из Telegram.WebApp
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const params = new URLSearchParams((hash || '').replace(/^#/, ''));
        let initData = params.get('tgWebAppData') || params.get('tma_init') || '';

        try {
          if (!initData && window.Telegram?.WebApp?.initData) {
            initData = window.Telegram.WebApp.initData; // запасной вариант
          }
        } catch {}

        // 2) return= из query
        const u = new URL(window.location.href);
        const ret = u.searchParams.get('return') || '/';

        if (!initData) {
          setMsg('No initData from Telegram (open via Mini App button)');
          return;
        }

        setMsg('Authorizing…');

        // 3) POST на наш API
        const r = await fetch('/api/tma/auto', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ initData, return: ret }),
        });

        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok || !j?.accountId) {
          setMsg(`Auth failed: ${j?.error || r.status}`);
          return;
        }

        const accountId = String(j.accountId);

        // 4) фиксируем клиентское состояние (как у вас принято)
        try {
          window.__AUTH_ACCOUNT__ = accountId;
          localStorage.setItem('asherId', accountId);
          localStorage.setItem('ql7_uid', accountId);
          sessionStorage.setItem('fromTMA', '1'); // маркер для AuthNavClient
          window.dispatchEvent(new CustomEvent('auth:ok', { detail: { accountId, provider: 'tma' } }));
        } catch {}

        setMsg('OK, redirecting…');

        // 5) редирект обратно
        const to = ret.startsWith('/') ? ret : '/';
        window.location.replace(to);
      } catch (e) {
        setMsg(`Error: ${String(e?.message || e)}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16, color: '#fff', fontFamily: 'system-ui' }}>
      <h3>Quantum L7 — Telegram Mini App</h3>
      <div>{msg}</div>
    </div>
  );
}
