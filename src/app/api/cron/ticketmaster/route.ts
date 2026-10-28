import { NextResponse } from "next/server";
import { registrarLog } from "@/lib/admin-log";
import { apagarDocumentosVencidos } from "@/lib/documentos";
import { apagarLimitesVencidos } from "@/lib/limite";
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

  // Faxinas no mesmo cron diário (o plano da Vercel tem poucos crons): falha aqui não derruba a importação.
  const faxina = await apagarDocumentosVencidos().catch((erro: unknown) => ({ erro: String(erro) }));
  if ("erro" in faxina || faxina.apagados > 0 || faxina.falhas > 0) {
    await registrarLog(null, "documentos.apagar_vencidos", "sistema", null, faxina);
  }
  await apagarLimitesVencidos();

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
