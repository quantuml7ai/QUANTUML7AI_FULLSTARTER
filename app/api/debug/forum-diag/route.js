// app/api/debug/forum-diag/route.js
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // важно: нужен доступ к fs

function safeString(x, max = 4000) {
  try {
    const s = typeof x === "string" ? x : JSON.stringify(x);
    return s.length > max ? s.slice(0, max) + "…[cut]" : s;
  } catch {
    return "[unstringifiable]";
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const root = process.cwd();
    const file = path.join(root, "forum-diag.jsonl");

    const row = {
      ts: new Date().toISOString(),
      ...body,
    };

    fs.appendFileSync(file, safeString(row) + "\n", "utf8");
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
