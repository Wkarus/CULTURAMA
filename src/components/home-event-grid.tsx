import type { Category, Event } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/auth";
import { EventCard } from "@/components/event-card";
import { eventWhereFromParams } from "@/lib/event-filters";
import { misturarVitrine, uniqueByCapa } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";

type EventoCard = Event & { category: Category | null };

const LISTA =
  "mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4";
const ITEM = "w-[calc((100%-1rem)/1.2)] shrink-0 snap-start md:w-auto";

export function HomeEventGrid({
  events,
  favoritos,
  logado,
}: {
  events: EventoCard[];
  favoritos: Set<string>;
  logado: boolean;
}) {
  return (
    <section className="mx-auto max-w-page px-4 py-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-display text-on-light">Acontecendo esta semana</h2>
        <Link href="/eventos" className="shrink-0 text-sm font-medium text-accent-ink underline-offset-4 hover:underline">
          Ver todos
        </Link>
      </div>
      <ul className={LISTA}>
        {events.map((event) => (
          <li key={event.id} className={ITEM}>
            <EventCard event={event} favorito={favoritos.has(event.id)} logado={logado} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeEventGridSkeleton() {
  return (
    <section className="mx-auto max-w-page px-4 py-16" aria-hidden>
      <div className="flex items-end justify-between gap-4">
        <div className="h-8 w-64 max-w-[70%] animate-pulse rounded-control bg-border-light motion-reduce:animate-none" />
        <div className="h-4 w-16 animate-pulse rounded-control bg-border-light motion-reduce:animate-none" />
      </div>
      <ul className={LISTA}>
        {Array.from({ length: 8 }, (_, indice) => (
          <li key={indice} className={ITEM}>
            <div className="aspect-[4/5] animate-pulse rounded-card bg-border-light motion-reduce:animate-none" />
            <div className="mt-3 h-3 w-3/5 animate-pulse rounded-full bg-border-light motion-reduce:animate-none" />
            <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-border-light motion-reduce:animate-none" />
            <div className="mt-2 h-3 w-2/5 animate-pulse rounded-full bg-border-light motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Próximos 7 dias, no máximo 8. A seção some quando a semana está vazia. */
export async function HomeSemana() {
  try {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
    const semana = { ...eventWhereFromParams({}), dataHora: { gte: agora, lte: limite } };
    const consulta = (comFoto: boolean) =>
      prisma.event.findMany({
        where: { ...semana, imagemCapa: comFoto ? { not: null } : null },
        include: { category: { include: { parent: { select: { nome: true } } } } },
        orderBy: { dataHora: "asc" },
        take: 40,
      });
    // Busca separada: com uma só consulta por data, a fonte que publica mais (e sem foto) ocupava as 24 primeiras.
    const [session, comFoto, semFoto] = await Promise.all([auth(), consulta(true), consulta(false)]);
    const events = misturarVitrine(uniqueByCapa([...comFoto, ...semFoto]), 8);
    if (events.length === 0) return null;
    const marcados = session?.user?.id
      ? await prisma.favorite.findMany({
          where: { userId: session.user.id, eventId: { in: events.map((event) => event.id) } },
          select: { eventId: true },
        })
      : [];
    return <HomeEventGrid events={events} favoritos={new Set(marcados.map((row) => row.eventId))} logado={Boolean(session?.user?.id)} />;
  } catch {
    return null;
  }
}
