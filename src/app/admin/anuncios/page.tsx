import { AlternarAnuncioButton, AnuncioForm } from "@/components/admin-forms";
import { prisma } from "@/lib/prisma";

export default async function AdminAnunciosPage() {
  const slots = await prisma.adSlot.findMany({ orderBy: { dataInicio: "desc" } });

  return (
    <div className="grid gap-10">
      <section className="rounded-card bg-card p-5 shadow-card">
        <h2 className="text-lg font-medium tracking-display">Novo anúncio</h2>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          Cadastro e período. A etiqueta Patrocinado no site público entra na Fase 6.
        </p>
        <AnuncioForm />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-medium tracking-display">Cadastrados</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anúncio ainda.</p>
        ) : (
          <ul className="grid gap-4">
            {slots.map((slot) => (
              <li key={slot.id} className="grid gap-3 rounded-card bg-card p-5 shadow-card sm:grid-cols-[8rem_1fr_auto]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slot.imagem} alt="" className="h-20 w-full rounded-card object-cover" />
                <div className="grid gap-1">
                  <p className="text-sm font-medium">{slot.patrocinador}</p>
                  <p className="text-xs text-muted-foreground">{slot.tipo}</p>
                  <p className="text-xs text-muted-foreground">
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
  );
}
