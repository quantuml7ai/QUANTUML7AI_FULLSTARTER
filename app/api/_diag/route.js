﻿export const dynamic = "force-dynamic"; export const revalidate = 0; export const fetchCache = "force-no-store";
export async function GET(){ return new Response(JSON.stringify({ ok:true, where:"app/api/_diag" }), { status:200, headers:{ "Content-Type":"application/json" } }) }
