import { NextResponse } from "next/server";
import { registrarLog } from "@/lib/admin-log";
import { syncTicketmaster } from "@/lib/ticketmaster";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await syncTicketmaster();
  await registrarLog(
    null,
    "ticketmaster.sincronizar",
    "sistema",
    null,
    result.ok ? { ok: true, importados: result.upserted } : { ok: false, erro: result.message },
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, upserted: result.upserted });
}

export const dynamic = "force-dynamic";
