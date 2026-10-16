import type { LinhaInsight, TipoInsight } from "@/lib/insights-agregar";
import { agregar, type FiltrosInsights, type PainelInsights } from "@/lib/insights-agregar";
import { modoDemo } from "@/lib/insights-coleta";
import { dadosDemo } from "@/lib/insights-demo";
import { prisma } from "@/lib/prisma";

const DIA = 86_400_000;

export async function montarPainel(filtros: FiltrosInsights): Promise<PainelInsights> {
  if (modoDemo()) return agregar(dadosDemo(), filtros, true);
  const desde = new Date(Date.now() - 180 * DIA);
  const [registros, anuncios] = await Promise.all([
    prisma.interacaoEvento.findMany({
      where: { data: { gte: desde } },
      select: {
        eventoId: true,
        tipo: true,
        data: true,
        categoria: true,
        bairro: true,
        cidade: true,
        faixaEtaria: true,
        coorte: true,
        evento: { select: { titulo: true, organizerId: true } },
      },
    }),
    prisma.adSlot.findMany({
      where: { ativo: true, dataFim: { gte: new Date() } },
      select: { link: true },
    }),
  ]);
  const links = anuncios.map((anuncio) => anuncio.link);
  const linhas: LinhaInsight[] = registros.map((registro) => ({
    eventoId: registro.eventoId,
    titulo: registro.evento.titulo,
    tipo: registro.tipo as TipoInsight,
    data: registro.data,
    categoria: registro.categoria,
    bairro: registro.bairro,
    cidade: registro.cidade,
    faixa: registro.faixaEtaria,
    coorte: registro.coorte,
    patrocinado: links.some((link) => link.includes(registro.eventoId)),
    temOrganizador: Boolean(registro.evento.organizerId),
  }));
  return agregar(linhas, filtros, false);
}
