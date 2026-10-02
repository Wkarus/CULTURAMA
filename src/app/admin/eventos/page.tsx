import Link from "next/link";
import { ModeracaoForm } from "@/components/admin-forms";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { labelStatus } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminEventosPage() {
  await requireSecao("eventos");
  const events = await prisma.event.findMany({
    include: { category: true, organizer: true },
    orderBy: { dataHora: "desc" },
    take: 80,
  });

  return (
    <>
      <CabecalhoAdmin
        titulo="Eventos"
        descricao="Cancelar ou adiar muda o status. O registro fica. Ticketmaster só pode ser ocultado, o conteúdo não é editado."
      />
      {events.length === 0 ? (
        <Vazio>Nenhum evento no banco.</Vazio>
      ) : (
        <ul className="grid gap-4">
          {events.map((event) => (
            <li key={event.id} className={cn(painelAdmin, "grid gap-4 p-5 lg:grid-cols-[1fr_20rem]")}>
              <div className="grid content-start gap-2">
                <p className="text-xs text-muted-on-dark">
                  {event.fonte === "ticketmaster" ? "via Ticketmaster" : "evento local"} · {labelStatus(event.status)}
                  {event.category ? ` · ${event.category.nome}` : ""}
                </p>
                <h2 className="font-display text-lg font-semibold tracking-display">{event.titulo}</h2>
                <p className="text-sm text-muted-on-dark">
                  {event.dataHora.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}
                </p>
                <p className="text-sm">{event.endereco}</p>
                {event.organizer ? <p className="text-sm text-muted-on-dark">{event.organizer.nomeEmpresa}</p> : null}
                <Link href={`/eventos/${event.id}`} className={cn("w-fit rounded-sm text-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}>
                  Ver página pública
                </Link>
              </div>
              <ModeracaoForm event={event} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
