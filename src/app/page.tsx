import type { Prisma } from "@prisma/client";
import { HomeEventGrid } from "@/components/home-event-grid";
import { HomeFeaturedParticles } from "@/components/home-featured-particles";
import { HomeHero } from "@/components/home-hero";
import { HomeHowItWorks } from "@/components/home-how-it-works";
import { HomeStats } from "@/components/home-stats";
import { cidadeDeEndereco, formatEventoCurto, localDoEvento, nomeCurtoEvento, uniqueByCapa } from "@/lib/eventos";
import { eventWhereFromParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

type EventoHome = Prisma.EventGetPayload<{ include: { category: true } }>;

export default async function HomePage() {
  const where = eventWhereFromParams({});
  let events: EventoHome[] = [];
  let destaques: EventoHome[] = [];
  let eventCount = 0;
  let organizerCount = 0;
  let addresses: { endereco: string }[] = [];
  let sponsorNames: string[] = [];
  try {
    const now = new Date();
    [events, destaques, eventCount, organizerCount, addresses, sponsorNames] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { category: true },
        orderBy: { dataHora: "asc" },
        take: 48,
      }),
      prisma.event.findMany({
        where: { ...where, destaque: true, imagemCapa: { not: null } },
        include: { category: true },
        orderBy: { dataHora: "asc" },
        take: 6,
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
  const featuredList = uniqueByCapa([...destaques, ...unique.filter((event) => event.imagemCapa)]).slice(0, 6);
  const featuredIds = new Set(featuredList.map((event) => event.id));
  const grid = unique.filter((event) => !featuredIds.has(event.id)).slice(0, 6);
  const cidades = new Set(addresses.map((row) => cidadeDeEndereco(row.endereco)).filter(Boolean)).size;
  const proximos = unique.slice(0, 3).map((event) => ({
    id: event.id,
    titulo: nomeCurtoEvento(event.titulo, 40),
    categoria: event.category?.nome ?? null,
    quando: formatEventoCurto(event.dataHora),
    gratuito: event.gratuito,
    imagemCapa: event.imagemCapa,
  }));
  const heroNomes = Array.from(new Set(unique.map((event) => nomeCurtoEvento(event.titulo, 28)))).slice(0, 18);
  const heroCapas = unique.flatMap((event) =>
    event.imagemCapa
      ? [
          {
            id: event.id,
            titulo: nomeCurtoEvento(event.titulo, 40),
            categoria: event.category?.nome ?? null,
            imagemCapa: event.imagemCapa,
            href: `/eventos/${event.id}`,
          },
        ]
      : [],
  ).slice(0, 8);
  const heroLocais = Array.from(
    new Set(events.map(localDoEvento).filter((local): local is string => Boolean(local))),
  ).slice(0, 8);

  return (
    <main>
      <HomeHero nomes={heroNomes} capas={heroCapas} locais={heroLocais} patrocinadores={sponsorNames.slice(0, 12)} />
      <HomeFeaturedParticles
        events={featuredList.flatMap((event) =>
          event.imagemCapa
            ? [
                {
                  id: event.id,
                  titulo: event.titulo,
                  imagemCapa: event.imagemCapa,
                  href: `/eventos/${event.id}`,
                  quando: formatEventoCurto(event.dataHora),
                  categoria: event.category?.nome ?? null,
                },
              ]
            : [],
        )}
      />
      <HomeStats eventos={eventCount} cidades={cidades} organizadores={organizerCount} />
      <HomeHowItWorks events={proximos} />
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
