import { CabecalhoAdmin } from "@/components/admin/cabecalho";
import { CategoriaLinha, NovaCategoriaForm } from "@/components/admin/categorias-admin";
import { painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { montarArvore } from "@/lib/categorias-arvore";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminCategoriasPage() {
  await requireSecao("categorias");
  const lista = await prisma.category.findMany({
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    include: { _count: { select: { events: true, subcategorias: true } } },
  });
  const arvore = montarArvore(lista);

  return (
    <>
      <CabecalhoAdmin
        titulo="Categorias"
        descricao="Categorias principais e subcategorias. O endereço (slug) não muda ao renomear, para não quebrar filtros nem interesses salvos. Só dá para excluir sem eventos vinculados."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-label="Árvore de categorias" className={cn(painelAdmin, "px-5 py-2")}>
          <ul>
            {arvore.map((mae, i) => {
              const totalEventos = mae._count.events + mae.filhas.reduce((soma, f) => soma + f._count.events, 0);
              return (
                <li key={mae.id} className="border-t border-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] first:border-t-0">
                  <CategoriaLinha
                    categoria={{ id: mae.id, nome: mae.nome, slug: mae.slug, icone: mae.icone }}
                    eventos={totalEventos}
                    subcategorias={mae._count.subcategorias}
                    primeira={i === 0}
                    ultima={i === arvore.length - 1}
                  />
                  {mae.filhas.length ? (
                    <ul className="pb-2">
                      {mae.filhas.map((filha, j) => (
                        <li key={filha.id}>
                          <CategoriaLinha
                            categoria={{ id: filha.id, nome: filha.nome, slug: filha.slug, icone: filha.icone }}
                            eventos={filha._count.events}
                            subcategorias={0}
                            primeira={j === 0}
                            ultima={j === mae.filhas.length - 1}
                            filha
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
        <section aria-labelledby="nova-categoria" className={cn(painelAdmin, "p-5 xl:sticky xl:top-20")}>
          <h2 id="nova-categoria" className="mb-4 font-display text-lg font-semibold tracking-display">
            Nova categoria
          </h2>
          <NovaCategoriaForm maes={arvore.map((m) => ({ id: m.id, nome: m.nome }))} />
        </section>
      </div>
    </>
  );
}
