import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventForm } from "@/components/event-form";
import { ensureCategorias } from "@/lib/categorias";
import { getOrganizerForUser, podePublicar } from "@/lib/eventos";
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
      <EventForm categorias={categorias} evento={evento} podePublicar={podePublicar(organizer.statusVerificacao)} />
    </main>
  );
}
