import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventForm } from "@/components/event-form";
import { ensureCategorias } from "@/lib/categorias";
import { getOrganizerForUser, podePublicar } from "@/lib/eventos";

export default async function NovoEventoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/conta/eventos/novo");
  const organizer = await getOrganizerForUser(session.user.id);
  if (!organizer) redirect("/cadastro/organizador");

  const categorias = await ensureCategorias();

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-2xl font-medium tracking-display">Novo evento</h1>
      <EventForm categorias={categorias} podePublicar={podePublicar(organizer.statusVerificacao)} />
    </main>
  );
}
