import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { RotaPainel } from "@/components/rota-painel";
import { buttonVariants } from "@/components/ui/button";
import { labelRestricao } from "@/lib/eventos";
import { hasValidCoords } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function EventoDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { category: true, organizer: true },
  });
  if (!event) notFound();

  const isOwner = Boolean(session?.user?.id && event.organizer?.userId === session.user.id);
  const isAdmin = session?.user?.tipo === "admin";
  if (event.status !== "publicado" && !isOwner && !isAdmin) notFound();

  const data = event.dataHora.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const ctaHref = event.fonte === "ticketmaster" ? event.linkIngresso : event.linkIngresso || event.linkSaibaMais;
  const ctaLabel = event.fonte === "ticketmaster" ? "Comprar na Ticketmaster" : event.linkIngresso ? "Ingresso" : "Saiba mais";

  return (
    <main className="mx-auto max-w-page px-4 py-12">
      <Link href="/eventos" className="text-sm text-muted-foreground underline underline-offset-4">
        Voltar aos eventos
      </Link>

      <article className="mt-6 overflow-hidden rounded-card bg-card shadow-card">
        {event.imagemCapa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imagemCapa} alt="" className="aspect-[16/8] w-full object-cover" />
        ) : null}
        <div className="grid gap-4 p-6">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {event.fonte === "ticketmaster" ? (
              <span className="rounded-pill bg-muted px-2 py-0.5">via Ticketmaster</span>
            ) : (
              <span className="rounded-pill bg-muted px-2 py-0.5">evento local</span>
            )}
            {event.category ? <span>{event.category.nome}</span> : null}
            <span>{labelRestricao(event.restricaoIdade)}</span>
            {event.status !== "publicado" ? <span>{event.status}</span> : null}
          </div>
          <h1 className="text-2xl font-medium tracking-display">{event.titulo}</h1>
          <p className="text-sm text-muted-foreground">{data}</p>
          <p className="text-sm">{event.gratuito ? "Entrada franca" : "Pago"}</p>
          <p className="text-sm">{event.endereco}</p>
          {event.organizer && event.fonte === "interno" ? (
            <p className="text-sm text-muted-foreground">Por {event.organizer.nomeEmpresa}</p>
          ) : null}
          <p className="whitespace-pre-wrap text-base leading-relaxed">{event.descricao}</p>
          {event.tags.length > 0 ? <p className="text-sm text-muted-foreground">{event.tags.join(" · ")}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            {ctaHref ? (
              <a href={ctaHref} target="_blank" rel="noreferrer" className={cn(buttonVariants())}>
                {ctaLabel}
              </a>
            ) : null}
            {event.fonte === "interno" && event.linkSaibaMais && event.linkSaibaMais !== event.linkIngresso ? (
              <a href={event.linkSaibaMais} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
                Saiba mais
              </a>
            ) : null}
          </div>
        </div>
      </article>

      {hasValidCoords(event.latitude, event.longitude) ? (
        <div className="mt-8">
          <RotaPainel eventId={event.id} lat={event.latitude} lng={event.longitude} titulo={event.titulo} />
        </div>
      ) : null}
    </main>
  );
}
