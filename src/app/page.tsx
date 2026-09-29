import type { Prisma } from "@prisma/client";
import { HomeEventGrid } from "@/components/home-event-grid";
import { HomeFeaturedMembers } from "@/components/home-featured-members";
import { HomeHero } from "@/components/home-hero";
import { HomeHowItWorks } from "@/components/home-how-it-works";
import { HomeStats } from "@/components/home-stats";
import { cidadeDeEndereco, nomeCurtoEvento, uniqueByCapa } from "@/lib/eventos";
import { eventWhereFromParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

type EventoHome = Prisma.EventGetPayload<{ include: { category: true } }>;

export default async function HomePage() {
  const where = eventWhereFromParams({});
  let events: EventoHome[] = [];
  let eventCount = 0;
  let organizerCount = 0;
  let addresses: { endereco: string }[] = [];
  let sponsorNames: string[] = [];
  try {
    const now = new Date();
    [events, eventCount, organizerCount, addresses, sponsorNames] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { category: true },
        orderBy: { dataHora: "asc" },
        take: 48,
      }),
      prisma.event.count({ where }),
      prisma.organizer.count({ where: { statusVerificacao: "aprovado" } }),
      prisma.event.findMany({ where, select: { endereco: true } }),
      prisma.adSlot
        .findMany({
          where: { ativo: true, dataInicio: { lte: now }, dataFim: { gte: now } },
          select: { patrocinador: true },
        })
        .then((rows) => [...new Set(rows.map((row) => row.patrocinador.trim()).filter(Boolean))]),
    ]);
  } catch {
    events = [];
  }

  const unique = uniqueByCapa(events);
  const featuredList = unique.filter((event) => event.imagemCapa).slice(0, 6);
  const featuredIds = new Set(featuredList.map((event) => event.id));
  const grid = unique.filter((event) => !featuredIds.has(event.id)).slice(0, 6);
  const cidades = new Set(addresses.map((row) => cidadeDeEndereco(row.endereco)).filter(Boolean)).size;
  const pathEvents = unique.slice(0, 14).map((event) => nomeCurtoEvento(event.titulo));
  const pathSponsors = [
    ...(events.some((event) => event.fonte === "ticketmaster") ? ["Ticketmaster"] : []),
    ...sponsorNames,
  ].slice(0, 8);

  return (
    <main>
      <HomeHero events={pathEvents} sponsors={pathSponsors} />
      <HomeFeaturedMembers
        events={featuredList.map((event) => ({
          name: event.titulo,
          image: event.imagemCapa ?? "",
          href: `/eventos/${event.id}`,
        }))}
      />
      <HomeStats eventos={eventCount} cidades={cidades} organizadores={organizerCount} />
      <HomeHowItWorks />
      {grid.length > 0 ? (
        <section className="mx-auto max-w-page px-4 pb-24">
          <div className="grid gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-display">Em seguida</h2>
          </div>
          <HomeEventGrid events={grid} />
        </section>
      ) : featuredList.length === 0 ? (
        <section className="mx-auto max-w-page px-4 pb-24">
          <p className="max-w-md text-caption text-muted-foreground">
            Ainda não há eventos futuros na base. Quando o cron da Ticketmaster rodar, eles aparecem aqui.
          </p>
        </section>
      ) : null}
    </main>
  );
}
