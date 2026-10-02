import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { salvarEventoAdmin } from "@/actions/admin-eventos";
import { CabecalhoAdmin } from "@/components/admin/cabecalho";
import { botaoAdmin, painelAdmin } from "@/components/admin/estilos";
import { EventForm } from "@/components/event-form";
import { requireSecao } from "@/lib/admin";
import { ensureCategorias } from "@/lib/categorias";
import { cn } from "@/lib/utils";

export default async function AdminNovoEventoPage() {
  await requireSecao("eventos");
  const categorias = await ensureCategorias();

  return (
    <>
      <CabecalhoAdmin
        titulo="Novo evento"
        descricao="Evento da própria equipe, sem organizador vinculado."
        acoes={
          <Link href="/admin/eventos" className={botaoAdmin("fantasma")}>
            <ArrowLeft aria-hidden />
            Eventos
          </Link>
        }
      />
      <section className={cn(painelAdmin, "max-w-2xl p-5 sm:p-6")}>
        <EventForm
          categorias={categorias}
          intencoes={["rascunho", "publicar"]}
          acao={salvarEventoAdmin}
          escuro
          sucesso="Evento salvo. Ele já aparece na lista de eventos do painel."
        />
      </section>
    </>
  );
}
