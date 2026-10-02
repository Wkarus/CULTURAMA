import { AlternarAnuncioButton, AnuncioForm } from "@/components/admin-forms";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminAnunciosPage() {
  await requireSecao("anuncios");
  const slots = await prisma.adSlot.findMany({ orderBy: { dataInicio: "desc" } });

  return (
    <>
      <CabecalhoAdmin titulo="Anúncios" descricao="Cadastro e período. A etiqueta Patrocinado no site público entra na Fase 6." />
      <div className="grid gap-10">
        <section aria-labelledby="novo-anuncio" className={cn(painelAdmin, "p-5 sm:p-6")}>
          <h2 id="novo-anuncio" className="mb-4 font-display text-lg font-semibold tracking-display">
            Novo anúncio
          </h2>
          <AnuncioForm />
        </section>

        <section aria-labelledby="cadastrados" className="grid gap-4">
          <h2 id="cadastrados" className="font-display text-lg font-semibold tracking-display">
            Cadastrados
          </h2>
          {slots.length === 0 ? (
            <Vazio>Nenhum anúncio ainda.</Vazio>
          ) : (
            <ul className="grid gap-4">
              {slots.map((slot) => (
                <li key={slot.id} className={cn(painelAdmin, "grid gap-3 p-5 sm:grid-cols-[8rem_1fr_auto] sm:items-center")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.imagem} alt="" className="h-20 w-full rounded-sm object-cover" />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">{slot.patrocinador}</p>
                    <p className="text-xs text-muted-on-dark">{slot.tipo}</p>
                    <p className="text-xs text-muted-on-dark">
                      {slot.dataInicio.toLocaleString("pt-BR", { dateStyle: "short" })} até{" "}
                      {slot.dataFim.toLocaleString("pt-BR", { dateStyle: "short" })}
                    </p>
                    <p className="text-xs">{slot.ativo ? "Ativo" : "Inativo"}</p>
                  </div>
                  <AlternarAnuncioButton id={slot.id} ativo={slot.ativo} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
