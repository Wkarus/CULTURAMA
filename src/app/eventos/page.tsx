import type { Metadata } from "next";
import { auth } from "@/auth";
import { EventMosaic } from "@/components/event-mosaic";
import { EventosBusca } from "@/components/eventos-busca";
import { ensureCategorias } from "@/lib/categorias";
import { expandirInteresses, idsDaCategoria } from "@/lib/categorias-arvore";
import { uniqueByCapa } from "@/lib/eventos";
import { eventWhereFromParams, filtraBusca, filterPublishedEvents, normalizeSearchParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Eventos" };

export default async function EventosPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const session = await auth();
  const filters = normalizeSearchParams(searchParams);
  const categorias = await ensureCategorias();
  const raw = await prisma.event.findMany({
    where: eventWhereFromParams(filters, idsDaCategoria(categorias, filters.categoria)),
    include: { category: { include: { parent: { select: { nome: true } } } } },
    orderBy: { dataHora: "asc" },
  });
  const events = filterPublishedEvents(raw, filters);

  const interesses = session?.user?.id
    ? ((await prisma.user.findUnique({ where: { id: session.user.id }, select: { interesses: true } }))?.interesses ?? [])
    : [];
  const idsDeInteresse = expandirInteresses(categorias, interesses);
  const ranked = [...events].sort((a, b) => {
    const score = (event: (typeof events)[number]) => (event.categoriaId && idsDeInteresse.has(event.categoriaId) ? 1 : 0);
    return score(b) - score(a);
  });
  const visual = filtraBusca(uniqueByCapa(ranked), filters.q);
  const marcados =
    session?.user?.id && visual.length > 0
      ? await prisma.favorite.findMany({
          where: { userId: session.user.id, eventId: { in: visual.map((event) => event.id) } },
          select: { eventId: true },
        })
      : [];
  const favoritos = new Set(marcados.map((row) => row.eventId));

  return (
    <main className="mx-auto max-w-page px-4 pb-16 pt-6">
      <EventosBusca filters={filters} categorias={categorias} total={visual.length}>
        {visual.length > 0 ? <EventMosaic events={visual} favoritos={favoritos} logado={Boolean(session?.user?.id)} /> : null}
      </EventosBusca>
    </main>
  );
}
