import { exigirEmpresa } from "@/lib/insights-acesso";
import { lerFiltros, paraCsv } from "@/lib/insights-agregar";
import { montarPainel } from "@/lib/insights-dados";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await exigirEmpresa();
  const filtros = lerFiltros(new URL(request.url).searchParams);
  const csv = paraCsv(await montarPainel(filtros));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=culturama-insights.csv",
      "Cache-Control": "no-store",
    },
  });
}
