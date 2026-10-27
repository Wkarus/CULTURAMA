import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CapaCategoria } from "@/components/capa-categoria";
import { CliqueExterno } from "@/components/clique-externo";
import { RegistrarVisualizacao } from "@/components/registrar-visualizacao";
import { RotaPainel } from "@/components/rota-painel";
import { ComentarioForm, DenunciaForm, FavoriteButton } from "@/components/social-forms";
import { buttonVariants } from "@/components/ui/button";
import { getUsuarioPainel } from "@/lib/admin";
import { estaNoAr } from "@/lib/event-filters";
import { formatEventoQuando, labelRestricao, labelStatus, seloDaFonte } from "@/lib/eventos";
import { hasValidCoords } from "@/lib/geo";
import { nomeDaInstancia } from "@/lib/mapas-culturais-config";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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
  const dataLonga = event.dataHora.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
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

  return (
    <main className="mx-auto max-w-page px-4 py-16">
      {!foraDoAr ? <RegistrarVisualizacao eventoId={event.id} /> : null}
      <Link href="/eventos" className="link-quiet text-caption">
        Voltar aos eventos
      </Link>

      <article className="mt-8 overflow-hidden rounded-card bg-card shadow-card">
        <div className="aspect-[16/10] bg-muted">
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
          <p className="whitespace-pre-wrap text-body-lg">{event.descricao}</p>
          {event.tags.length > 0 ? <p className="text-caption text-muted-foreground">{event.tags.join(" · ")}</p> : null}
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
            {event.fonte === "interno" && event.linkSaibaMais && event.linkSaibaMais !== event.linkIngresso ? (
              <a href={event.linkSaibaMais} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                Saiba mais
              </a>
            ) : null}
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
