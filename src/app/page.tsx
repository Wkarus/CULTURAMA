import type { AdSlotTipo, EventFonte, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { Suspense } from "react";
import { BannerPatrocinado } from "@/components/banner-patrocinado";
import { HomeB2BPartners } from "@/components/home-b2b-partners";
import { HomeEventGridSkeleton, HomeSemana } from "@/components/home-event-grid";
import { HomeFeaturedParticles } from "@/components/home-featured-particles";
import { HomeHero } from "@/components/home-hero";
import { HomeInteractiveDemo } from "@/components/home-interactive-demo";
import { HomeMarketInvestors } from "@/components/home-market-investors";
import { HomePainSolution } from "@/components/home-pain-solution";
import { HomeStats } from "@/components/home-stats";
import { anuncioNoAr, contaComoExibicao, hrefDoAnuncio } from "@/lib/anuncios";
import { cidadeDoEvento, formatEventoCurto, nomeCurtoEvento, uniqueByCapa } from "@/lib/eventos";
import { eventWhereFromParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

type EventoHome = Prisma.EventGetPayload<{ include: { category: true } }>;

/** Letreiro de fundo do hero: as cenas que o Culturama cobre, não títulos de eventos (que mudam e às vezes não dizem nada). */
const CENAS_DO_FUNDO = [
  "Batalha de rima",
  "Roda de samba",
  "Encontro de carros",
  "Anime",
  "Games",
  "Breaking",
  "Slam",
  "Corrida de rua",
  "Eletrônica",
  "Skate",
  "Cosplay",
  "Sarau",
];

/** Cidades na ordem em que aparecem; "SANTO ANDRÉ" e "Santo André" contam uma vez só, com a primeira grafia. */
function cidadesUnicas(eventos: { endereco: string; fonte: EventFonte }[]): string[] {
  const porChave = new Map<string, string>();
  for (const cidade of eventos.map(cidadeDoEvento)) {
    if (cidade && !porChave.has(cidade.toLocaleLowerCase("pt-BR"))) porChave.set(cidade.toLocaleLowerCase("pt-BR"), cidade);
  }
  return [...porChave.values()];
}

export default async function HomePage() {
  const where = eventWhereFromParams({});
  let events: EventoHome[] = [];
  let destaques: EventoHome[] = [];
  let eventCount = 0;
  let organizerCount = 0;
  let addresses: { endereco: string; fonte: EventFonte }[] = [];
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
      prisma.event.findMany({ where, select: { endereco: true, fonte: true } }),
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
  const cidades = cidadesUnicas(addresses).length;
  const proximos = unique.slice(0, 3).map((event) => ({
    id: event.id,
    titulo: nomeCurtoEvento(event.titulo, 40),
    categoria: event.category?.nome ?? null,
    quando: formatEventoCurto(event.dataHora),
    gratuito: event.gratuito,
    imagemCapa: event.imagemCapa,
  }));
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
  const heroCidades = cidadesUnicas(events).slice(0, 8);

  const destaquesParticles = featuredList.flatMap((event) =>
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
  );

  return (
    <main>
      <HomeHero nomes={CENAS_DO_FUNDO} capas={heroCapas} locais={heroCidades} patrocinadores={faixa.map(({ nome, href }) => ({ nome, href }))} />
      {/* Evento de verdade logo depois do topo: quem chega vê o produto antes do discurso. */}
      {eventCount === 0 && featuredList.length === 0 ? null : (
        <Suspense fallback={<HomeEventGridSkeleton />}>
          <HomeSemana />
        </Suspense>
      )}
      <HomePainSolution />
      {destaquesParticles.length > 0 ? <HomeFeaturedParticles events={destaquesParticles} /> : null}
      <HomeInteractiveDemo events={proximos} />
      {banner ? (
        <BannerPatrocinado anuncio={{ href: hrefDoAnuncio(banner.id), imagem: banner.imagem, patrocinador: banner.patrocinador }} />
      ) : null}
      <HomeB2BPartners />
      <HomeStats eventos={eventCount} cidades={cidades} organizadores={organizerCount} />
      <HomeMarketInvestors />
    </main>
  );
}
