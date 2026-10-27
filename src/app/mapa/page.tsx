import { auth } from "@/auth";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { EventMap } from "@/components/event-map";
import { PageHeading } from "@/components/page-heading";
import { ensureCategorias } from "@/lib/categorias";
import { idsDaCategoria } from "@/lib/categorias-arvore";
import { eventWhereFromParams, filterPublishedEvents, normalizeSearchParams, raioDoFiltro, toMapEvent } from "@/lib/event-filters";
import { uniqueByCapa } from "@/lib/eventos";
import { parseCoord } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

const LIMITE_PINOS = 300;

export default async function MapaPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = normalizeSearchParams(searchParams);
  const categorias = await ensureCategorias();
  const where = eventWhereFromParams(filters, idsDaCategoria(categorias, filters.categoria));
  const [raw, totalNoBanco] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { category: { include: { parent: { select: { nome: true } } } } },
      orderBy: { dataHora: "asc" },
      take: LIMITE_PINOS,
    }),
    prisma.event.count({ where }),
  ]);
  const events = filterPublishedEvents(raw, filters);
  /** Sem Perto de mim o Brasil todo não cabe no mapa: avisa quantos ficaram de fora em vez de fingir que são todos. */
  const cortado = totalNoBanco > raw.length;
  const cards = uniqueByCapa(events).slice(0, 12);
  const session = await auth();
  const marcados =
    session?.user?.id && cards.length > 0
      ? await prisma.favorite.findMany({
          where: { userId: session.user.id, eventId: { in: cards.map((event) => event.id) } },
          select: { eventId: true },
        })
      : [];
  const favoritos = new Set(marcados.map((row) => row.eventId));
  const logado = Boolean(session?.user?.id);
  const pins = events.map(toMapEvent);
  const lat = parseCoord(filters.lat);
  const lng = parseCoord(filters.lng);
  const userCenter = lat !== null && lng !== null ? { lat, lng } : null;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  return (
    <main className="mx-auto max-w-page px-4 py-16">
      <PageHeading
        title="Mapa"
        description="Eventos no Brasil. Filtre e abra o detalhe para ver rota, Uber e 99."
        action={{ href: "/eventos", label: "Ver lista" }}
      />
      <div className="mt-8">
        <EventFilters categorias={categorias} values={filters} action="/mapa" />
      </div>
      <div className="mt-8">
        <EventMap events={pins} userCenter={userCenter} raioKm={raioDoFiltro(filters.distancia)} apiKey={mapsKey} />
      </div>
      <div className="mt-16 flex items-end justify-between gap-3">
        <h2 className="text-display">{events.length} no filtro</h2>
      </div>
      {cortado ? (
        <p className="mt-3 text-sm text-muted-foreground">
          O mapa mostra os {LIMITE_PINOS} próximos pela data, de {totalNoBanco} no filtro. Use Perto de mim, a data ou a categoria para
          ver os outros.
        </p>
      ) : null}
      {events.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {userCenter
            ? "Nenhum evento neste raio. Arraste o Raio para aumentar a distância."
            : "Nada neste recorte. Limpe um filtro ou use Perto de mim."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((event) => (
            <li key={event.id}>
              <EventCard event={event} favorito={favoritos.has(event.id)} logado={logado} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
