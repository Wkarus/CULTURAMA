import Link from "next/link";
import { ModeracaoForm } from "@/components/admin-forms";
import { labelStatus } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";

export default async function AdminEventosPage() {
  const events = await prisma.event.findMany({
    include: { category: true, organizer: true },
    orderBy: { dataHora: "desc" },
    take: 80,
  });

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        Cancelar ou adiar muda o status. O registro fica. Ticketmaster só pode ser ocultado, o conteúdo não é editado.
      </p>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento no banco.</p>
      ) : (
        <ul className="grid gap-6">
          {events.map((event) => (
            <li key={event.id} className="grid gap-4 rounded-card bg-card p-5 shadow-card lg:grid-cols-[1fr_20rem]">
              <div className="grid gap-2">
                <p className="text-xs text-muted-foreground">
                  {event.fonte === "ticketmaster" ? "via Ticketmaster" : "evento local"} · {labelStatus(event.status)}
                  {event.category ? ` · ${event.category.nome}` : ""}
                </p>
                <h2 className="text-lg font-medium tracking-display">{event.titulo}</h2>
                <p className="text-sm text-muted-foreground">
                  {event.dataHora.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p className="text-sm">{event.endereco}</p>
                {event.organizer ? <p className="text-sm text-muted-foreground">{event.organizer.nomeEmpresa}</p> : null}
                <Link href={`/eventos/${event.id}`} className="text-sm underline underline-offset-4">
                  Ver página pública
                </Link>
              </div>
              <ModeracaoForm event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
