import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventForm } from "@/components/event-form";
import { ensureCategorias } from "@/lib/categorias";
import { botoesDoOrganizador, getOrganizerForUser } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";

export default async function EditarEventoPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const organizer = await getOrganizerForUser(session.user.id);
  if (!organizer) redirect("/cadastro/organizador");

  const evento = await prisma.event.findFirst({
    where: { id: params.id, organizerId: organizer.id, fonte: "interno" },
  });
  if (!evento) notFound();

  const categorias = await ensureCategorias();

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-2xl font-medium tracking-display">Editar evento</h1>
      {evento.revisaoResultado && evento.mensagemOrganizador ? (
        <p className="mb-6 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
          <span className="font-medium">
            {evento.revisaoResultado === "recusado" ? "Recusado pela equipe" : "A equipe pediu um ajuste"}:
          </span>{" "}
          {evento.mensagemOrganizador}
        </p>
      ) : null}
      <EventForm categorias={categorias} evento={evento} {...botoesDoOrganizador(organizer.statusVerificacao)} />
    </main>
  );
}
