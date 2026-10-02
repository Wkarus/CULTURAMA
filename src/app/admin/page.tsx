import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { GraficoCategorias, type FatiaCategoria } from "@/components/admin/grafico-categorias";
import { SincronizarTicketmaster } from "@/components/admin/sincronizar-ticketmaster";
import { requireSecao } from "@/lib/admin";
import { ensureCategorias } from "@/lib/categorias";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const maxDuration = 60;

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

type Cartao = { rotulo: string; valor: number; detalhe?: string; href?: string; destaque?: boolean };

function CartaoNumero({ cartao }: { cartao: Cartao }) {
  const conteudo = (
    <>
      <dt className="text-sm text-muted-on-dark">{cartao.rotulo}</dt>
      <dd className="mt-3 flex items-baseline gap-2">
        <span className={cn("font-display text-4xl font-bold tabular-nums tracking-display", cartao.destaque && "text-accent-gradient")}>
          {cartao.valor}
        </span>
        {cartao.detalhe ? <span className="text-sm text-muted-on-dark">{cartao.detalhe}</span> : null}
      </dd>
      {cartao.href ? (
        <ArrowUpRight
          className="absolute right-4 top-4 size-4 text-muted-on-dark transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-on-dark motion-reduce:transform-none"
          aria-hidden
        />
      ) : null}
    </>
  );

  return cartao.href ? (
    <Link
      href={cartao.href}
      className={cn(painelAdmin, "group relative block p-5 transition-colors hover:border-[color-mix(in_srgb,var(--color-on-dark)_22%,transparent)]", focoAdmin)}
    >
      <dl>{conteudo}</dl>
    </Link>
  ) : (
    <dl className={cn(painelAdmin, "relative p-5")}>{conteudo}</dl>
  );
}

export default async function AdminHomePage() {
  await requireSecao("visao-geral");

  const agora = new Date();
  const [
    eventosPublicados,
    emRevisao,
    organizadoresPendentes,
    denunciasAbertas,
    usuarios,
    usuariosNovos,
    anunciosNoAr,
    porCategoria,
    categorias,
    topFavoritos,
    ultimaSync,
    ticketmasterPublicados,
  ] = await Promise.all([
    prisma.event.count({ where: { status: "publicado" } }),
    prisma.event.count({ where: { status: "em_revisao" } }),
    prisma.organizer.count({ where: { statusVerificacao: "pendente" } }),
    prisma.denuncia.count({ where: { status: "aberta" } }),
    prisma.user.count(),
    prisma.user.count({ where: { criadoEm: { gte: new Date(agora.getTime() - SETE_DIAS) } } }),
    prisma.adSlot.count({ where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } } }),
    prisma.event.groupBy({ by: ["categoriaId"], where: { status: "publicado" }, _count: { _all: true } }),
    ensureCategorias(),
    prisma.favorite.groupBy({
      by: ["eventId"],
      where: { event: { status: "publicado" } },
      _count: { eventId: true },
      orderBy: { _count: { eventId: "desc" } },
      take: 5,
    }),
    prisma.adminLog.findFirst({ where: { acao: "ticketmaster.sincronizar" }, orderBy: { criadoEm: "desc" } }),
    prisma.event.count({ where: { fonte: "ticketmaster", status: "publicado" } }),
  ]);

  const porId = new Map(categorias.map((c) => [c.id, c]));
  const somaPorMae = new Map<string, number>();
  for (const grupo of porCategoria) {
    const categoria = grupo.categoriaId ? porId.get(grupo.categoriaId) : undefined;
    const mae = categoria?.parentId ? porId.get(categoria.parentId) : categoria;
    const nome = mae?.nome ?? "Sem categoria";
    somaPorMae.set(nome, (somaPorMae.get(nome) ?? 0) + grupo._count._all);
  }
  const fatias: FatiaCategoria[] = Array.from(somaPorMae, ([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);

  const eventosTop = topFavoritos.length
    ? await prisma.event.findMany({
        where: { id: { in: topFavoritos.map((f) => f.eventId) } },
        select: { id: true, titulo: true, dataHora: true, category: { select: { nome: true } } },
      })
    : [];
  const eventoPorId = new Map(eventosTop.map((e) => [e.id, e]));

  const detalhesSync = (ultimaSync?.detalhes ?? null) as { ok?: boolean; importados?: number; erro?: string } | null;

  const cartoes: Cartao[] = [
    { rotulo: "Eventos publicados", valor: eventosPublicados, href: "/admin/eventos" },
    { rotulo: "Em revisão", valor: emRevisao, href: "/admin/revisao", destaque: emRevisao > 0 },
    { rotulo: "Organizadores pendentes", valor: organizadoresPendentes, href: "/admin/organizadores", destaque: organizadoresPendentes > 0 },
    { rotulo: "Denúncias abertas", valor: denunciasAbertas, href: "/admin/denuncias", destaque: denunciasAbertas > 0 },
    { rotulo: "Usuários", valor: usuarios, href: "/admin/usuarios", detalhe: `+${usuariosNovos} em 7 dias` },
    { rotulo: "Anúncios no ar", valor: anunciosNoAr, href: "/admin/anuncios" },
  ];

  return (
    <>
      <CabecalhoAdmin titulo="Visão geral" descricao="O que está no ar e o que espera decisão." />

      <section aria-label="Números" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cartoes.map((cartao) => (
          <CartaoNumero key={cartao.rotulo} cartao={cartao} />
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-labelledby="grafico-titulo" className={cn(painelAdmin, "p-5 sm:p-6")}>
          <h2 id="grafico-titulo" className="font-display text-lg font-semibold tracking-display">
            Eventos publicados por categoria
          </h2>
          <div className="mt-5">{fatias.length ? <GraficoCategorias dados={fatias} /> : <Vazio>Nenhum evento publicado ainda.</Vazio>}</div>
        </section>

        <section aria-labelledby="top-titulo" className={cn(painelAdmin, "p-5 sm:p-6")}>
          <h2 id="top-titulo" className="font-display text-lg font-semibold tracking-display">
            Mais favoritados
          </h2>
          {topFavoritos.length ? (
            <ol className="mt-4 grid">
              {topFavoritos.map((fav, i) => {
                const evento = eventoPorId.get(fav.eventId);
                if (!evento) return null;
                return (
                  <li key={fav.eventId} className="border-t border-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] first:border-t-0">
                    <Link href={`/eventos/${evento.id}`} className={cn("flex items-center gap-4 rounded-sm py-3", focoAdmin)}>
                      <span className="w-5 font-display text-lg font-bold tabular-nums text-muted-on-dark">{i + 1}</span>
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-medium">{evento.titulo}</span>
                        <span className="truncate text-xs text-muted-on-dark">
                          {evento.category?.nome ?? "Sem categoria"} · {evento.dataHora.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm tabular-nums text-accent-hover">
                        <Heart className="size-3.5 fill-current" aria-hidden />
                        {fav._count.eventId}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-on-dark">Ninguém favoritou eventos publicados ainda.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="tm-titulo" className={cn(painelAdmin, "mt-6 grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6")}>
        <div className="grid gap-2">
          <h2 id="tm-titulo" className="font-display text-lg font-semibold tracking-display">
            Ticketmaster
          </h2>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-flow-col sm:auto-cols-max">
            <div className="grid gap-0.5">
              <dt className="text-muted-on-dark">Última sincronização</dt>
              <dd>
                {ultimaSync ? (
                  <>
                    {formatoData.format(ultimaSync.criadoEm)}
                    <span className="text-muted-on-dark"> · {ultimaSync.autorNome}</span>
                  </>
                ) : (
                  "Nenhuma registrada"
                )}
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-on-dark">Resultado</dt>
              <dd>
                {!detalhesSync ? (
                  "—"
                ) : detalhesSync.ok ? (
                  `${detalhesSync.importados ?? 0} eventos importados`
                ) : (
                  <span className="text-danger">Falhou: {detalhesSync.erro}</span>
                )}
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-on-dark">Publicados da Ticketmaster</dt>
              <dd className="tabular-nums">{ticketmasterPublicados}</dd>
            </div>
          </dl>
        </div>
        <SincronizarTicketmaster />
      </section>
    </>
  );
}
