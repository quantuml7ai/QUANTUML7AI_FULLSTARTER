// app/api/profile/save-avatar/route.js
export const runtime = 'nodejs';

import { Redis } from '@upstash/redis';

export async function POST(req) {
  try {
    const { accountId, avatar } = await req.json();

    if (!accountId || typeof accountId !== 'string') {
      return new Response(JSON.stringify({ ok:false, error:'NO_ACCOUNT' }), { status:400 });
    }
    if (!avatar || typeof avatar !== 'string') {
      return new Response(JSON.stringify({ ok:false, error:'NO_AVATAR' }), { status:400 });
    }

    const redis = Redis.fromEnv();

    // профиль храним в hash: profile:{accountId}
    await redis.hset(`profile:${accountId}`, { avatar, updatedAt: Date.now() });

    // рассылаем всем клиентам через Pub/Sub для мгновенного обновления
    await redis.publish('forum:events', JSON.stringify({
      type: 'profile.avatar',
      accountId,
      avatar,
      ts: Date.now(),
    }));

    return new Response(JSON.stringify({ ok:true }), {
      status: 200,
      headers: { 'content-type':'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message || e) }), {
      status: 500, headers: { 'content-type':'application/json' }
    });
  }
}
