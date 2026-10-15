import { auth } from "@/auth";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { EventMap } from "@/components/event-map";
import { PageHeading } from "@/components/page-heading";
import { ensureCategorias } from "@/lib/categorias";
import { idsDaCategoria } from "@/lib/categorias-arvore";
import { eventWhereFromParams, filterPublishedEvents, normalizeSearchParams, toMapEvent } from "@/lib/event-filters";
import { uniqueByCapa } from "@/lib/eventos";
import { parseCoord } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

export default async function MapaPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = normalizeSearchParams(searchParams);
  const categorias = await ensureCategorias();
  const raw = await prisma.event.findMany({
    where: eventWhereFromParams(filters, idsDaCategoria(categorias, filters.categoria)),
    include: { category: { include: { parent: { select: { nome: true } } } } },
    orderBy: { dataHora: "asc" },
    take: 200,
  });
  const events = filterPublishedEvents(raw, filters);
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
        <EventMap events={pins} userCenter={userCenter} apiKey={mapsKey} />
      </div>
      <div className="mt-16 flex items-end justify-between gap-3">
        <h2 className="text-display">{events.length} no filtro</h2>
      </div>
      {events.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {userCenter
            ? "Nenhum evento nesta distância. Aumente o raio em Distância e clique em Filtrar."
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
