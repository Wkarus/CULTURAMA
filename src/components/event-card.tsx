import Link from "next/link";
import type { Category, Event } from "@prisma/client";
import { formatEventoQuando, labelRestricao } from "@/lib/eventos";
import { cn } from "@/lib/utils";

type EventoCard = Event & { category: Category | null };

export function EventCard({ event, featured = false }: { event: EventoCard; featured?: boolean }) {
  const data = formatEventoQuando(event.dataHora);
  const selo = event.fonte === "ticketmaster" ? "via Ticketmaster" : "Na rua";

  return (
    <Link
      href={`/eventos/${event.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-card bg-surface-dark shadow-card transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transform-none",
        featured && "h-full min-h-[280px]",
      )}
    >
      <div className={cn("relative bg-surface-dark", featured ? "aspect-[16/10] min-h-[280px]" : "aspect-[4/5]")}>
        {event.imagemCapa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imagemCapa}
            alt=""
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div className="size-full bg-surface-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-[color-mix(in_srgb,var(--color-surface-dark)_42%,transparent)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 grid gap-2 p-4 text-on-dark">
          <p className="text-caption text-muted-on-dark">
            {selo}
            {event.category ? ` · ${event.category.nome}` : ""}
            {` · ${event.gratuito ? "Entrada franca" : "Pago"}`}
            {` · ${labelRestricao(event.restricaoIdade)}`}
          </p>
          <h2 className="font-display text-xl font-semibold tracking-display">{event.titulo}</h2>
          <p className="text-caption text-muted-on-dark">{data}</p>
        </div>
      </div>
    </Link>
  );
}
