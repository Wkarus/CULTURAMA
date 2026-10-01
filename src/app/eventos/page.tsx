import { auth } from "@/auth";
import { EventMosaic } from "@/components/event-mosaic";
import { EventFilters } from "@/components/event-filters";
import { PageHeading } from "@/components/page-heading";
import { ensureCategorias } from "@/lib/categorias";
import { expandirInteresses, idsDaCategoria } from "@/lib/categorias-arvore";
import { uniqueByCapa } from "@/lib/eventos";
import { eventWhereFromParams, filterPublishedEvents, normalizeSearchParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

export default async function EventosPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const session = await auth();
  const filters = normalizeSearchParams(searchParams);
  const categorias = await ensureCategorias();
  const raw = await prisma.event.findMany({
    where: eventWhereFromParams(filters, idsDaCategoria(categorias, filters.categoria)),
    include: { category: true },
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
  const paraVoce = interesses.length > 0;
  const visual = uniqueByCapa(ranked);
  const destaque = visual[0];
  const demais = visual.slice(1);

  return (
    <main className="mx-auto max-w-page px-4 py-16">
      <PageHeading
        title="Eventos"
        description={
          paraVoce
            ? "O que combina com seus interesses vem primeiro. Filtre por data, entrada e distância."
            : "Shows oficiais e a cena de rua. Filtre por data, entrada e distância, ou abra o mapa."
        }
        action={{ href: "/mapa", label: "Abrir mapa" }}
      />

      <div className="mt-8">
        <EventFilters categorias={categorias} values={filters} action="/eventos" />
      </div>

      {ranked.length === 0 ? (
        <p className="mt-16 max-w-md text-caption text-muted-foreground">
          {filters.lat && filters.lng
            ? "Nenhum evento nesta distância. Aumente o raio em Distância e clique em Filtrar."
            : "Nenhum evento neste recorte. Organizadores podem cadastrar; a Ticketmaster entra pelo cron."}
        </p>
      ) : (
        <EventMosaic destaque={destaque} demais={demais} />
      )}
    </main>
  );
}
