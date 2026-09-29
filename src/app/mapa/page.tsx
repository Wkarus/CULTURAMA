import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { EventMap } from "@/components/event-map";
import { ensureCategorias } from "@/lib/categorias";
import { eventWhereFromParams, filterPublishedEvents, normalizeSearchParams, toMapEvent } from "@/lib/event-filters";
import { parseCoord } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

export default async function MapaPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = normalizeSearchParams(searchParams);
  const categorias = await ensureCategorias();
  const raw = await prisma.event.findMany({
    where: eventWhereFromParams(filters),
    include: { category: true },
    orderBy: { dataHora: "asc" },
    take: 200,
  });
  const events = filterPublishedEvents(raw, filters);
  const pins = events.map(toMapEvent);
  const lat = parseCoord(filters.lat);
  const lng = parseCoord(filters.lng);
  const userCenter = lat !== null && lng !== null ? { lat, lng } : null;

  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <h1 className="text-2xl font-medium tracking-display">Mapa</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Eventos publicados no Brasil. Filtre e abra o detalhe para ver rota, Uber e 99.
      </p>
      <div className="mt-6">
        <EventFilters categorias={categorias} values={filters} action="/mapa" />
      </div>
      <div className="mt-6">
        <EventMap events={pins} userCenter={userCenter} />
      </div>
      <div className="mt-10 flex items-end justify-between gap-3">
        <h2 className="text-lg font-medium tracking-display">{events.length} no filtro</h2>
        <Link href="/eventos" className="text-sm underline underline-offset-4">
          Ver lista
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nada neste recorte. Limpe um filtro ou use Perto de mim.</p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 12).map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
