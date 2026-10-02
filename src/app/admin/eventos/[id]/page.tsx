import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { salvarEventoAdmin } from "@/actions/admin-eventos";
import { ModeracaoForm } from "@/components/admin-forms";
import { CabecalhoAdmin } from "@/components/admin/cabecalho";
import { botaoAdmin, painelAdmin } from "@/components/admin/estilos";
import { EventForm } from "@/components/event-form";
import { requireSecao } from "@/lib/admin";
import { ensureCategorias } from "@/lib/categorias";
import { labelStatus } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminEventoPage({ params }: { params: { id: string } }) {
  await requireSecao("eventos");
  const evento = await prisma.event.findUnique({
    where: { id: params.id },
    include: { organizer: { select: { nomeEmpresa: true } } },
  });
  if (!evento) notFound();
  const categorias = await ensureCategorias();
  const interno = evento.fonte === "interno";

  return (
    <>
      <CabecalhoAdmin
        titulo={evento.titulo}
        descricao={`${labelStatus(evento.status)} · ${interno ? (evento.organizer?.nomeEmpresa ?? "Equipe Culturama") : "Ticketmaster"}`}
        acoes={
          <>
            <Link href="/admin/eventos" className={botaoAdmin("fantasma")}>
              <ArrowLeft aria-hidden />
              Eventos
            </Link>
            <Link href={`/eventos/${evento.id}`} target="_blank" className={botaoAdmin("secundario")}>
              Ver no site
              <ExternalLink aria-hidden />
            </Link>
          </>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {interno ? (
          <section aria-labelledby="dados-evento" className={cn(painelAdmin, "p-5 sm:p-6")}>
            <h2 id="dados-evento" className="mb-4 font-display text-lg font-semibold tracking-display">
              Dados do evento
            </h2>
            {evento.mensagemOrganizador ? (
              <p className="chip-dark mb-4 rounded-sm px-3 py-2 text-sm">
                <span className="text-muted-on-dark">Mensagem enviada ao organizador:</span> {evento.mensagemOrganizador}
              </p>
            ) : null}
            <EventForm
              categorias={categorias}
              evento={evento}
              intencoes={["rascunho", "publicar"]}
              acao={salvarEventoAdmin}
              escuro
              sucesso="Alterações salvas."
            />
          </section>
        ) : (
          <p className={cn(painelAdmin, "p-5 text-sm text-muted-on-dark")}>
            O conteúdo deste evento vem da Ticketmaster e é atualizado na sincronização. Aqui dá para mudar o status e a nota interna.
          </p>
        )}
        <section aria-labelledby="moderacao" className={cn(painelAdmin, "p-5")}>
          <h2 id="moderacao" className="mb-4 font-display text-lg font-semibold tracking-display">
            Moderação
          </h2>
          <ModeracaoForm event={evento} />
        </section>
      </div>
    </>
  );
}
