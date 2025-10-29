import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
const redis = Redis.fromEnv();

// ---- Telegram initData verify (docs) ----
function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return { ok: false, error: 'NO_DATA_OR_TOKEN' };

  // initData приходит строкой query-пары (a=1&b=2&hash=…)
  const url = new URLSearchParams(initData);
  const hash = url.get('hash');
  url.delete('hash');

  // Собираем data_check_string отсортированно
  const pairs = [];
  for (const [k, v] of url.entries()) pairs.push(`${k}=${v}`);
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  // Секрет = HMAC_SHA256("WebAppData", SHA256(bot_token))
  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(crypto.createHash('sha256').update(botToken).digest())
    .digest();

  const calcHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  const ok = calcHash === (hash || '').toLowerCase();
  if (!ok) return { ok: false, error: 'BAD_HASH' };

  // Парсим user
  let user = null;
  try {
    const raw = url.get('user');
    if (raw) user = JSON.parse(raw);
  } catch {}

  return { ok: true, user, params: Object.fromEntries(url.entries()) };
}

// ---- cookie helper: простая sid + asherId ----
function setCookies(res, accountId) {
  // httpOnly sid — если хотите, можно поднимать полноценную сессию
  const sid = `sess:${crypto.randomBytes(8).toString('hex')}`;
  res.cookies.set('sid', sid, { httpOnly: true, path: '/', sameSite: 'Lax', secure: true });

  // не httpOnly — чтобы фронт видел id сразу (ваш фронт так и ожидает)
  res.cookies.set('asherId', accountId, { httpOnly: false, path: '/', sameSite: 'Lax', secure: true, maxAge: 3600 * 24 * 365 });
}

// ---- основной обработчик ----
export async function POST(req) {
  try {
    const { initData, return: ret } = await req.json().catch(() => ({}));
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

    const v = verifyTelegramInitData(initData, BOT_TOKEN);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    }

    const tg = v.user || {};
    const tgId = String(tg.id || '').trim();
    if (!tgId) {
      return NextResponse.json({ ok: false, error: 'NO_TG_ID' }, { status: 400 });
    }

    // 1) делаем детерминированный accountId (или свою схему)
    const accountId = `tg:${tgId}`;

    // 2) сохраняем связи в Redis (как у вас в скринах)
    await Promise.all([
      redis.hset(`acc:${accountId}`, {
        tg_id: tgId,
        tg_username: tg.username || '',
        tg_first_name: tg.first_name || '',
        tg_last_name: tg.last_name || '',
        updated_at: Date.now(),
      }),
      redis.set(`tg:uid:${tgId}`, accountId, { ex: 60 * 60 * 24 * 365 }),
    ]);

    // (опционально) можно мигрировать VIP-ключи tg:<id> -> tg:<id> без префикса и т.д.

    const res = NextResponse.json({
      ok: true,
      accountId,
      return: ret || '/',
    });

    setCookies(res, accountId);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
