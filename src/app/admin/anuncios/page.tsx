import type { AdSlotTipo } from "@prisma/client";
import { AlternarAnuncioButton, AnuncioForm } from "@/components/admin-forms";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { formatarCtr, statusDoAnuncio, type StatusAnuncio } from "@/lib/anuncios";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const ROTULO_TIPO: Record<AdSlotTipo, string> = {
  banner_home: "Banner da home",
  banner_categoria: "Banner de categoria",
  destaque_evento: "Destaque de evento",
};

const STATUS: Record<StatusAnuncio, { rotulo: string; classe: string }> = {
  no_ar: { rotulo: "No ar", classe: "bg-[color-mix(in_srgb,var(--color-accent-to)_22%,transparent)] text-on-dark" },
  agendado: { rotulo: "Agendado", classe: "bg-[color-mix(in_srgb,var(--color-accent-from)_22%,transparent)] text-on-dark" },
  pausado: { rotulo: "Pausado", classe: "chip-dark text-muted-on-dark" },
  encerrado: { rotulo: "Encerrado", classe: "chip-dark text-muted-on-dark line-through decoration-1" },
};

const numero = new Intl.NumberFormat("pt-BR");
const data = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-on-dark">{rotulo}</dt>
      <dd className="font-display text-lg font-semibold tabular-nums tracking-display">{valor}</dd>
    </div>
  );
}

export default async function AdminAnunciosPage() {
  await requireSecao("anuncios");
  const slots = await prisma.adSlot.findMany({ orderBy: { dataInicio: "desc" } });
  const agora = new Date();
  const total = slots.reduce((acc, s) => ({ exibicoes: acc.exibicoes + s.exibicoes, cliques: acc.cliques + s.cliques }), { exibicoes: 0, cliques: 0 });

  return (
    <>
      <CabecalhoAdmin
        titulo="Anúncios"
        descricao="Banners da home aparecem com a etiqueta Patrocinado enquanto estiverem ativos e dentro do período. Exibições e cliques são contados no servidor, sem robôs."
      />
      <div className="grid gap-10">
        <section aria-labelledby="novo-anuncio" className={cn(painelAdmin, "p-5 sm:p-6")}>
          <h2 id="novo-anuncio" className="mb-4 font-display text-lg font-semibold tracking-display">
            Novo anúncio
          </h2>
          <AnuncioForm />
        </section>

        <section aria-labelledby="cadastrados" className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="cadastrados" className="font-display text-lg font-semibold tracking-display">
              Cadastrados
            </h2>
            {slots.length > 0 ? (
              <p className="text-sm tabular-nums text-muted-on-dark">
                Total: {numero.format(total.exibicoes)} exibições · {numero.format(total.cliques)} cliques · CTR{" "}
                {formatarCtr(total.exibicoes, total.cliques)}
              </p>
            ) : null}
          </div>
          {slots.length === 0 ? (
            <Vazio>Nenhum anúncio ainda.</Vazio>
          ) : (
            <ul className="grid gap-4">
              {slots.map((slot) => {
                const status = STATUS[statusDoAnuncio(slot, agora)];
                return (
                  <li key={slot.id} className={cn(painelAdmin, "grid gap-4 p-5")}>
                    <div className="grid gap-4 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.imagem} alt="" className="aspect-[16/9] w-full rounded-sm object-cover" />
                      <div className="grid min-w-0 gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{slot.patrocinador}</p>
                          <span className={cn("rounded-pill px-2.5 py-0.5 text-xs font-medium", status.classe)}>{status.rotulo}</span>
                        </div>
                        <p className="text-xs text-muted-on-dark">{ROTULO_TIPO[slot.tipo]}</p>
                        <p className="text-xs tabular-nums text-muted-on-dark">
                          {data.format(slot.dataInicio)} até {data.format(slot.dataFim)}
                        </p>
                        <a
                          href={slot.link}
                          target="_blank"
                          rel="noreferrer"
                          className={cn("w-fit truncate rounded-sm text-xs text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
                        >
                          {slot.link}
                        </a>
                      </div>
                      <AlternarAnuncioButton id={slot.id} ativo={slot.ativo} />
                    </div>
                    <dl className="grid grid-cols-3 gap-4 border-t border-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] pt-4 sm:max-w-md">
                      <Metrica rotulo="Exibições" valor={numero.format(slot.exibicoes)} />
                      <Metrica rotulo="Cliques" valor={numero.format(slot.cliques)} />
                      <Metrica rotulo="CTR" valor={formatarCtr(slot.exibicoes, slot.cliques)} />
                    </dl>
                    <details className="group">
                      <summary className={cn("w-fit cursor-pointer rounded-sm text-sm text-muted-on-dark hover:text-on-dark", focoAdmin)}>
                        Editar dados e período
                      </summary>
                      <div className="mt-4">
                        <AnuncioForm slot={slot} />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
