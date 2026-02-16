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
// ограничиваем размер строки (чтобы логи не раздували диск и не падали на huge payload)
function safeJsonlRow(obj, maxChars = 200_000) {
  let s = "";
  try {
    s = JSON.stringify(obj);
  } catch {
    s = JSON.stringify({ ts: new Date().toISOString(), event: "server_error", error: "json_stringify_failed" });
  }
  if (s.length > maxChars) {
    // если прилетело слишком много (например, случайно ресурсы/DOM), режем “extra”
    const clipped = { ...obj, _clipped: true };
    if (clipped?.extra) clipped.extra = safeString(clipped.extra, 8000);
    s = JSON.stringify(clipped);
    if (s.length > maxChars) s = s.slice(0, maxChars) + "…[cut]";
  }
  return s;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const root = process.cwd();
    const file = path.join(root, "forum-diag.jsonl");
// server-side meta
const ua = req.headers.get("user-agent") || "";
const ip =
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
  req.headers.get("x-real-ip") ||
  "";

    const row = {
      ts: new Date().toISOString(),
      ip,
      ua,      
      ...body,
    };

    fs.appendFileSync(file, safeJsonlRow(row) + "\n", "utf8");
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
