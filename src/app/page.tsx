import type { AdSlotTipo, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { BannerPatrocinado } from "@/components/banner-patrocinado";
import { HomeEventGrid } from "@/components/home-event-grid";
import { HomeFeaturedParticles } from "@/components/home-featured-particles";
import { HomeHero } from "@/components/home-hero";
import { HomeHowItWorks } from "@/components/home-how-it-works";
import { HomeStats } from "@/components/home-stats";
import { anuncioNoAr, contaComoExibicao, hrefDoAnuncio } from "@/lib/anuncios";
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
  let anuncios: { id: string; tipo: AdSlotTipo; patrocinador: string; imagem: string }[] = [];
  try {
    const now = new Date();
    [events, destaques, eventCount, organizerCount, addresses, anuncios] = await Promise.all([
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
      prisma.adSlot.findMany({
        where: anuncioNoAr(now),
        select: { id: true, tipo: true, patrocinador: true, imagem: true },
        orderBy: { dataInicio: "asc" },
      }),
    ]);
  } catch {
    events = [];
  }

  const patrocinadores = new Map<string, { nome: string; href: string; id: string }>();
  for (const anuncio of anuncios) {
    const nome = anuncio.patrocinador.trim();
    if (nome && !patrocinadores.has(nome)) patrocinadores.set(nome, { nome, href: hrefDoAnuncio(anuncio.id), id: anuncio.id });
  }
  const faixa = Array.from(patrocinadores.values()).slice(0, 12);
  const banners = anuncios.filter((anuncio) => anuncio.tipo === "banner_home");
  const banner = banners.length ? banners[Math.floor(Math.random() * banners.length)] : null;

  const exibidos = new Set(faixa.map((p) => p.id));
  if (banner) exibidos.add(banner.id);
  if (exibidos.size > 0 && contaComoExibicao(headers())) {
    await prisma.adSlot
      .updateMany({ where: { id: { in: Array.from(exibidos) } }, data: { exibicoes: { increment: 1 } } })
      .catch(() => undefined);
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
      <HomeHero nomes={heroNomes} capas={heroCapas} locais={heroLocais} patrocinadores={faixa.map(({ nome, href }) => ({ nome, href }))} />
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
      {banner ? (
        <BannerPatrocinado anuncio={{ href: hrefDoAnuncio(banner.id), imagem: banner.imagem, patrocinador: banner.patrocinador }} />
      ) : null}
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
