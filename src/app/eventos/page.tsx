import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { ensureCategorias } from "@/lib/categorias";
import { eventWhereFromParams, filterPublishedEvents, normalizeSearchParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

export default async function EventosPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = normalizeSearchParams(searchParams);
  const categorias = await ensureCategorias();
  const raw = await prisma.event.findMany({
    where: eventWhereFromParams(filters),
    include: { category: true },
    orderBy: { dataHora: "asc" },
  });
  const events = filterPublishedEvents(raw, filters);

  return (
    <main className="mx-auto max-w-page px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-display">Eventos</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Eventos locais e shows da Ticketmaster. Use data, entrada e distância, ou veja no mapa.
          </p>
        </div>
        <Link href="/mapa" className="text-sm underline underline-offset-4">
          Abrir mapa
        </Link>
      </div>

      <div className="mt-6">
        <EventFilters categorias={categorias} values={filters} action="/eventos" />
      </div>

      {events.length === 0 ? (
        <p className="mt-16 text-sm text-muted-foreground">
          Nenhum evento neste filtro. Organizadores podem cadastrar; a Ticketmaster entra pelo cron.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
