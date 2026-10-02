import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cancelarEvento } from "@/actions/eventos";
import { Button, buttonVariants } from "@/components/ui/button";
import { getOrganizerForUser, labelStatus } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function MeusEventosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/conta/eventos");

  const organizer = await getOrganizerForUser(session.user.id);
  if (!organizer) redirect("/cadastro/organizador");

  const events = await prisma.event.findMany({
    where: { organizerId: organizer.id, fonte: "interno" },
    include: { category: true },
    orderBy: { dataHora: "desc" },
  });

  return (
    <main className="mx-auto max-w-page px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium tracking-display">Meus eventos</h1>
        <Link href="/conta/eventos/novo" className={cn(buttonVariants())}>
          Novo evento
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Verificação: {organizer.statusVerificacao}. Eventos da Ticketmaster não aparecem aqui e não podem ser editados.
      </p>

      {events.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Nenhum evento interno ainda.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-card p-4 shadow-card">
              <div>
                <Link href={`/eventos/${event.id}`} className="font-medium underline-offset-4 hover:underline">
                  {event.titulo}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {labelStatus(event.status)} · {event.category?.nome} · {event.dataHora.toLocaleString("pt-BR")}
                </p>
                {event.revisaoResultado && event.mensagemOrganizador ? (
                  <p className="mt-2 max-w-prose rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
                    <span className="font-medium">
                      {event.revisaoResultado === "recusado" ? "Recusado pela equipe" : "A equipe pediu um ajuste"}:
                    </span>{" "}
                    {event.mensagemOrganizador}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Link href={`/conta/eventos/${event.id}/editar`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Editar
                </Link>
                {event.status !== "cancelado" ? (
                  <form
                    action={async () => {
                      "use server";
                      await cancelarEvento(event.id);
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      Cancelar
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
