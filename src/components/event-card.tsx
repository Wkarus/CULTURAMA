import Link from "next/link";
import type { Category, Event } from "@prisma/client";
import { labelRestricao } from "@/lib/eventos";

type EventoCard = Event & { category: Category | null };

export function EventCard({ event }: { event: EventoCard }) {
  const data = event.dataHora.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Link href={`/eventos/${event.id}`} className="block overflow-hidden rounded-card bg-card shadow-card transition-transform hover:-translate-y-0.5">
      <div className="aspect-[4/3] bg-muted">
        {event.imagemCapa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imagemCapa} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Sem imagem</div>
        )}
      </div>
      <div className="grid gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {event.fonte === "ticketmaster" ? (
            <span className="rounded-pill bg-muted px-2 py-0.5">via Ticketmaster</span>
          ) : (
            <span className="rounded-pill bg-muted px-2 py-0.5">evento local</span>
          )}
          {event.category ? <span>{event.category.nome}</span> : null}
          <span>{labelRestricao(event.restricaoIdade)}</span>
          <span>{event.gratuito ? "Entrada franca" : "Pago"}</span>
        </div>
        <h2 className="text-base font-medium tracking-shop">{event.titulo}</h2>
        <p className="text-sm text-muted-foreground">{data}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{event.endereco}</p>
      </div>
    </Link>
  );
}
