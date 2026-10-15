import { NextResponse } from "next/server";
import { registrarLog } from "@/lib/admin-log";
import { detalhesDoLog, importarMapasCulturais } from "@/lib/mapas-culturais-importer";

/** A API pública responde devagar e pedimos com pausa entre chamadas; três instâncias levam alguns minutos. */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** `?instancia=https://mapacultural.pb.gov.br` roda só uma das instâncias configuradas. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const apenas = new URL(request.url).searchParams.get("instancia") ?? undefined;
  const result = await importarMapasCulturais({ apenas });
  await registrarLog(null, "mapas.importar", "sistema", null, detalhesDoLog(result));
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
