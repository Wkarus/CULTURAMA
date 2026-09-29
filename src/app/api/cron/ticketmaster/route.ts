import { NextResponse } from "next/server";
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
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, upserted: result.upserted });
}

export const dynamic = "force-dynamic";
