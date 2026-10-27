import Link from "next/link";
import type { Category, Event } from "@prisma/client";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/actions/social";
import { CapaCategoria } from "@/components/capa-categoria";
import { dataDoCard, linhaDoLocal, seloRestricaoCard } from "@/lib/eventos";
import { cn } from "@/lib/utils";

type CategoriaCard = Category & { parent?: { nome: string } | null };
type EventoCard = Event & { category: CategoriaCard | null };

function nomeCategoria(category: CategoriaCard | null): string | null {
  if (!category) return null;
  if (category.parent?.nome && category.parent.nome !== category.nome) return `${category.parent.nome} · ${category.nome}`;
  return category.nome;
}

const BOTAO_FAVORITO =
  "grid size-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-surface-light)_84%,transparent)] text-on-light shadow-card backdrop-blur-md transition-colors hover:text-accent-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid";

export function EventCard({
  event,
  favorito = false,
  logado = false,
}: {
  event: EventoCard;
  favorito?: boolean;
  logado?: boolean;
}) {
  const data = dataDoCard(new Date(event.dataHora));
  const meta = [nomeCategoria(event.category), data.quando].filter(Boolean).join(" · ");
  const local = linhaDoLocal(event);
  const restricao = seloRestricaoCard(event.restricaoIdade);
  const coracao = (
    <Heart className={cn("size-4", favorito && "fill-accent-solid text-accent-solid")} strokeWidth={1.75} aria-hidden />
  );

  return (
    <article className="group relative h-full rounded-card transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-card motion-reduce:transform-none motion-reduce:transition-none">
      <Link
        href={`/eventos/${event.id}`}
        className="block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface-dark">
          {event.imagemCapa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imagemCapa}
              alt=""
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <CapaCategoria categoria={event.category} />
          )}
          <p className="absolute left-3 top-3 flex flex-col items-center rounded-control bg-[color-mix(in_srgb,var(--color-surface-light)_84%,transparent)] px-2.5 py-1.5 text-on-light backdrop-blur-md">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider">{data.mes}</span>
            <span className="font-display text-xl font-semibold leading-none">{data.dia}</span>
          </p>
        </div>
        <div className="grid gap-1.5 px-1 pt-3">
          <p className="text-caption text-accent-solid">{meta}</p>
          <h3 className="line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug tracking-display text-on-light">
            {event.titulo}
          </h3>
          {local ? <p className="truncate text-caption text-muted-foreground">{local}</p> : null}
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-pill px-2.5 py-1 text-caption",
                event.gratuito ? "bg-success-bg text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {event.gratuito ? "Grátis" : "Pago"}
            </span>
            {restricao ? (
              <span className="inline-flex rounded-pill bg-warning-bg px-2.5 py-1 text-caption text-warning">{restricao}</span>
            ) : null}
          </p>
        </div>
      </Link>
      {logado ? (
        <form
          action={async () => {
            "use server";
            await toggleFavorite(event.id);
          }}
          className="absolute right-3 top-3 z-10"
        >
          <button
            type="submit"
            aria-pressed={favorito}
            aria-label={favorito ? "Remover dos favoritos" : "Favoritar"}
            className={BOTAO_FAVORITO}
          >
            {coracao}
          </button>
        </form>
      ) : (
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/eventos/${event.id}`)}`}
          aria-label="Entre para favoritar"
          className={cn(BOTAO_FAVORITO, "absolute right-3 top-3 z-10")}
        >
          {coracao}
        </Link>
      )}
    </article>
  );
}
