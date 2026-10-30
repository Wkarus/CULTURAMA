import type { Metadata } from "next";
import { Accessibility, AtSign, CalendarDays, ClipboardList, Globe, Info, MapPin, Ticket } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CapaCategoria } from "@/components/capa-categoria";
import { CliqueExterno } from "@/components/clique-externo";
import { CompartilharEvento } from "@/components/compartilhar-evento";
import { RegistrarVisualizacao } from "@/components/registrar-visualizacao";
import { RotaPainel } from "@/components/rota-painel";
import { ComentarioForm, DenunciaForm, FavoriteButton } from "@/components/social-forms";
import { buttonVariants } from "@/components/ui/button";
import { getUsuarioPainel } from "@/lib/admin";
import { EVENTO_PUBLICO, estaNoAr } from "@/lib/event-filters";
import { FUSO_EVENTO, formatEventoQuando, labelRestricao, labelStatus, seloDaFonte } from "@/lib/eventos";
import { hasValidCoords } from "@/lib/geo";
import { lerSessoes } from "@/lib/mapas-culturais";
import { nomeDaInstancia } from "@/lib/mapas-culturais-config";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

/** Título da aba e do link compartilhado. Evento fora do ar não entrega o nome. */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await prisma.event
    .findFirst({ where: { id: params.id, ...EVENTO_PUBLICO }, select: { titulo: true, endereco: true, dataHora: true } })
    .catch(() => null);
  if (!event) return { title: "Evento" };
  return { title: event.titulo, description: `${formatEventoQuando(event.dataHora)} · ${event.endereco}` };
}

export default async function EventoDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { category: true, organizer: { include: { user: { select: { suspensoEm: true } } } } },
  });
  if (!event) notFound();

  const isOwner = Boolean(session?.user?.id && event.organizer?.userId === session.user.id);
  const foraDoAr = !estaNoAr(event.status) || Boolean(event.organizer?.suspensoEm || event.organizer?.user.suspensoEm);
  if (foraDoAr && !isOwner && !(await getUsuarioPainel())) notFound();

  const data = formatEventoQuando(event.dataHora);
  const dataLonga = event.dataHora.toLocaleString("pt-BR", { timeZone: FUSO_EVENTO, dateStyle: "long", timeStyle: "short" });
  const instancia = event.fonte === "mapas_culturais" ? nomeDaInstancia(event.fonteInstancia) : null;
  const ctaHref = event.fonte === "ticketmaster" ? event.linkIngresso : event.linkIngresso || event.linkSaibaMais;
  const ctaLabel =
    event.fonte === "ticketmaster"
      ? "Comprar na Ticketmaster"
      : event.linkIngresso
        ? "Ingresso"
        : instancia
          ? `Ver no ${instancia}`
          : "Saiba mais";
  const favorito = session?.user?.id
    ? Boolean(await prisma.favorite.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: event.id } } }))
    : false;
  const comments = await prisma.comment.findMany({
    where: { eventId: event.id, oculto: false },
    include: { user: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
  const selo = instancia ? `via ${instancia}` : seloDaFonte(event.fonte);
  const sessoes = lerSessoes(event.sessoes);

  return (
    <main className="mx-auto max-w-page px-4 py-16">
      {!foraDoAr ? <RegistrarVisualizacao eventoId={event.id} /> : null}
      <Link href="/eventos" className="link-quiet inline-flex min-h-6 items-center text-caption">
        Voltar aos eventos
      </Link>

      <article className="mt-8 overflow-hidden rounded-card bg-card shadow-card">
        {/* 16:10 no celular; no computador fica mais baixa para o título aparecer sem rolar. */}
        <div className="aspect-[16/10] bg-muted lg:aspect-[21/8]">
          {event.imagemCapa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imagemCapa} alt="" className="size-full object-cover" />
          ) : (
            <CapaCategoria categoria={event.category} rotulo />
          )}
        </div>
        <div className="grid gap-3 p-6">
          <div className="flex flex-wrap gap-3 text-caption text-muted-foreground">
            <span className="rounded-pill bg-muted px-2 py-0.5 text-on-light">{selo}</span>
            {event.category ? <span>{event.category.nome}</span> : null}
            <span>{labelRestricao(event.restricaoIdade)}</span>
            {!estaNoAr(event.status) ? <span>{labelStatus(event.status)}</span> : null}
          </div>
          <h1 className="text-display">{event.titulo}</h1>
          <p className="text-caption text-muted-foreground">{data}</p>
        </div>
      </article>

      <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-3">
          {/* Descrição igual ao título (Ticketmaster antiga) não informa nada: no lugar, um resumo com o que se sabe. */}
          {event.descricao.trim().toLowerCase() !== event.titulo.trim().toLowerCase() ? (
            <p className="whitespace-pre-wrap text-body-lg">{event.descricao}</p>
          ) : (
            <p className="text-body-lg">
              {[event.category?.nome, event.endereco !== "Brasil" ? `Em ${event.endereco}` : null].filter(Boolean).join(". ")}.{" "}
              {event.fonte === "ticketmaster" ? "Preço, setores e ingressos na página da Ticketmaster." : "Mais detalhes na página original do evento."}
            </p>
          )}
          {/* Etiquetas da Ticketmaster vêm em inglês ("Fine Art · Arts & Theatre"); a categoria já aparece no topo. */}
          {event.tags.length > 0 && event.fonte !== "ticketmaster" ? (
            <ul className="flex flex-wrap gap-2" aria-label="Linguagens e tags">
              {event.tags.map((tag) => (
                <li key={tag} className="rounded-pill bg-muted px-3 py-1 text-caption text-on-light">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          {sessoes.length > 0 ? (
            <section aria-labelledby="sessoes-titulo" className="mt-6 grid gap-3">
              <h2 id="sessoes-titulo" className="font-display text-xl font-semibold">
                Datas e horários
              </h2>
              <ul className="grid gap-3">
                {sessoes.map((sessao) => (
                  <li key={`${sessao.regra}-${sessao.proxima}`} className="grid gap-2 rounded-card bg-card p-5 shadow-card">
                    {sessao.local ? (
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-accent-ink" strokeWidth={1.75} aria-hidden />
                        <span>
                          <span className="font-medium text-on-light">{sessao.local}</span>
                          {sessao.endereco ? <span className="block text-caption text-muted-foreground">{sessao.endereco}</span> : null}
                        </span>
                      </p>
                    ) : null}
                    <p className="flex items-start gap-2 text-sm text-on-light">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent-ink" strokeWidth={1.75} aria-hidden />
                      {sessao.regra}
                    </p>
                    {sessao.preco || sessao.info ? (
                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-light">
                        {sessao.preco ? (
                          <span className="inline-flex items-center gap-2">
                            <Ticket className="size-4 text-accent-ink" strokeWidth={1.75} aria-hidden />
                            {sessao.preco}
                          </span>
                        ) : null}
                        {sessao.info ? (
                          <span className="inline-flex items-center gap-2">
                            <Info className="size-4 text-accent-ink" strokeWidth={1.75} aria-hidden />
                            {sessao.info}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {event.libras || event.audiodescricao || event.acessibilidade.length > 0 ? (
            <section aria-labelledby="acessibilidade-titulo" className="mt-6 rounded-card bg-card p-5 shadow-card">
              <h2 id="acessibilidade-titulo" className="flex items-center gap-2 font-display text-lg font-semibold">
                <Accessibility className="size-5 text-accent-ink" strokeWidth={1.75} aria-hidden />
                Acessibilidade
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[
                  ...(event.libras ? ["Tradução em Libras"] : []),
                  ...(event.audiodescricao ? ["Audiodescrição"] : []),
                  ...event.acessibilidade,
                ].map((item) => (
                  <li key={item} className="rounded-pill bg-muted px-3 py-1.5 text-sm text-on-light">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-caption text-muted-foreground">Informado pela fonte. Na dúvida, confirme com o local.</p>
            </section>
          ) : null}
          {event.inscricoes ? (
            <section aria-labelledby="inscricoes-titulo" className="mt-2 rounded-card bg-card p-5 shadow-card">
              <h2 id="inscricoes-titulo" className="flex items-center gap-2 font-display text-lg font-semibold">
                <ClipboardList className="size-5 text-accent-ink" strokeWidth={1.75} aria-hidden />
                Como se inscrever
              </h2>
              <p className="mt-2 text-body">{event.inscricoes}</p>
            </section>
          ) : null}
          {event.galeria.length > 0 ? (
            <section aria-labelledby="galeria-titulo" className="mt-6 grid gap-3">
              <h2 id="galeria-titulo" className="font-display text-xl font-semibold">
                Galeria de fotos
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.galeria.map((foto, i) => (
                  <li key={foto} className="aspect-[4/3] overflow-hidden rounded-card bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto} alt={`Foto ${i + 1} de ${event.titulo}`} loading="lazy" decoding="async" className="size-full object-cover" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <aside className="grid h-fit gap-3 rounded-card bg-card p-6 shadow-card">
          <p className="text-body-lg">{event.gratuito ? "Entrada franca" : "Pago"}</p>
          <p className="text-caption text-muted-foreground">{event.endereco}</p>
          <p className="text-caption text-muted-foreground">{dataLonga}</p>
          {instancia ? (
            <p className="text-caption text-muted-foreground">
              Fonte:{" "}
              {event.linkSaibaMais ? (
                <a href={event.linkSaibaMais} target="_blank" rel="noreferrer" className="link-quiet">
                  {instancia}
                </a>
              ) : (
                instancia
              )}
            </p>
          ) : null}
          {event.organizer && event.fonte === "interno" ? (
            <p className="text-caption text-muted-foreground">
              Por {event.organizer.nomeEmpresa}
              {event.organizer.statusVerificacao === "aprovado" ? (
                <span className="ml-2 rounded-control bg-success-bg px-2 py-0.5 text-caption text-success">
                  Verificado
                </span>
              ) : null}
            </p>
          ) : null}
          <div className="grid gap-3 pt-3">
            {ctaHref ? (
              event.linkIngresso && ctaHref === event.linkIngresso ? (
                <CliqueExterno href={ctaHref} eventoId={event.id} tipo="ingresso" className={cn(buttonVariants(), "w-full")}>
                  {ctaLabel}
                </CliqueExterno>
              ) : (
                <a href={ctaHref} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "w-full")}>
                  {ctaLabel}
                </a>
              )
            ) : null}
            {event.instagramEvento || event.siteEvento ? (
              <div className="flex flex-wrap gap-2">
                {event.instagramEvento ? (
                  <a href={event.instagramEvento} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "flex-1 gap-2")}>
                    <AtSign className="size-4" aria-hidden />
                    Instagram
                  </a>
                ) : null}
                {event.siteEvento ? (
                  <a href={event.siteEvento} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "flex-1 gap-2")}>
                    <Globe className="size-4" aria-hidden />
                    Site do evento
                  </a>
                ) : null}
              </div>
            ) : null}
            {event.fonte === "interno" && event.linkSaibaMais && event.linkSaibaMais !== event.linkIngresso ? (
              <a href={event.linkSaibaMais} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                Saiba mais
              </a>
            ) : null}
            {!foraDoAr ? <CompartilharEvento titulo={event.titulo} caminho={`/eventos/${event.id}`} /> : null}
            {session?.user?.id ? (
              <FavoriteButton eventId={event.id} favorito={favorito} />
            ) : (
              <p className="text-caption text-muted-foreground">
                <Link href={`/login?callbackUrl=/eventos/${event.id}`} className="link-quiet">
                  Entre
                </Link>{" "}
                para favoritar, comentar ou denunciar.
              </p>
            )}
            {session?.user?.id && !isOwner && !foraDoAr ? <DenunciaForm alvo="evento" id={event.id} /> : null}
          </div>
        </aside>
      </div>

      {hasValidCoords(event.latitude, event.longitude) ? (
        <div className="mt-16">
          <RotaPainel
            eventId={event.id}
            lat={event.latitude}
            lng={event.longitude}
            titulo={event.titulo}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ""}
          />
        </div>
      ) : null}

      <section className="mt-16 grid gap-3">
        <h2 className="text-display">Comentários</h2>
        {session?.user?.id ? <ComentarioForm eventId={event.id} /> : null}
        {comments.length === 0 ? (
          <p className="text-caption text-muted-foreground">Ninguém comentou ainda.</p>
        ) : (
          <ul className="grid gap-3">
            {comments.map((item) => (
              <li key={item.id} className="rounded-card bg-card p-6 shadow-card">
                <p className="text-caption text-muted-foreground">
                  {item.user.nome} · nota {item.nota}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-body-lg">{item.texto}</p>
                {session?.user?.id && session.user.id !== item.userId ? <DenunciaForm alvo="comentario" id={item.id} /> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
