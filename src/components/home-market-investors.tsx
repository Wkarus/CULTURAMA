import { BarChart3, Target, TrendingUp } from "lucide-react";

const FONTE_84 =
  "https://fundacaoitau.org.br/observatorio/biblioteca/habitos-culturais";

export function HomeMarketInvestors() {
  return (
    <section className="relative overflow-hidden bg-surface-dark px-4 py-20 text-on-dark md:py-28">
      <div
        className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full bg-accent-from/10 blur-[130px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-from/30 bg-accent-from/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
            <TrendingUp className="size-3.5" aria-hidden />
            Mercado
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-display text-on-dark sm:text-4xl md:text-5xl">
            Cultura presencial ainda é hábito da maioria
          </h2>
          <p className="mt-3 text-base text-muted-on-dark sm:text-lg">
            O público existe e já sai de casa. Abaixo, o dado de pesquisa e como o Culturama gera receita sem cobrar de quem usa.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <article className="rounded-card border border-on-dark/10 bg-on-dark/[0.04] p-6 text-center">
            <p className="text-accent-gradient font-display text-4xl font-extrabold sm:text-5xl">
              <a
                href={FONTE_84}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-hover"
              >
                84%
              </a>
            </p>
            <p className="mt-1 font-display text-sm font-bold uppercase tracking-wider text-on-dark">dos brasileiros</p>
            <p className="mt-2 text-xs text-muted-on-dark">
              praticaram alguma atividade cultural presencial nos últimos 12 meses.{" "}
              <a href={FONTE_84} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-on-dark">
                Hábitos Culturais, 6ª edição
              </a>
              , Observatório Fundação Itaú com apoio técnico do Datafolha.
            </p>
          </article>
          <article className="rounded-card border border-on-dark/10 bg-on-dark/[0.04] p-6 text-center">
            <p className="text-accent-gradient font-display text-4xl font-extrabold sm:text-5xl">3</p>
            <p className="mt-1 font-display text-sm font-bold uppercase tracking-wider text-on-dark">fontes de receita</p>
            <p className="mt-2 text-xs text-muted-on-dark">
              Uso gratuito para o público; quem paga é quem quer alcançá-lo: organizadores e marcas.
            </p>
          </article>
          <article className="rounded-card border border-on-dark/10 bg-on-dark/[0.04] p-6 text-center">
            <p className="text-accent-gradient font-display text-4xl font-extrabold sm:text-5xl">Mapa</p>
            <p className="mt-1 font-display text-sm font-bold uppercase tracking-wider text-on-dark">com endereço</p>
            <p className="mt-2 text-xs text-muted-on-dark">
              Evento publicado entra na lista e no mapa, com rota a partir da localização de quem usa.
            </p>
          </article>
        </div>

        <div className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent-hover">Modelo de negócio</p>
              <h3 className="font-display text-xl font-bold text-on-dark sm:text-2xl">Como a receita está desenhada</h3>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-on-dark">
              <BarChart3 className="size-4 text-accent-from" aria-hidden />
              Entra em operação em etapas
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                tipo: "Quem usa",
                modelo: "Gratuito",
                detalhe: "Descobrir evento, ver a rota e salvar favoritos é livre. Sempre.",
              },
              {
                tipo: "Quem organiza",
                modelo: "Comissão e assinatura",
                detalhe: "Destaque pago do evento e taxa sobre ingresso vendido no Culturama, com o checkout do Mercado Pago.",
              },
              {
                tipo: "Marcas",
                modelo: "Patrocínio",
                detalhe: "Patrocínio por categoria, anúncio na rota e relatório de público agregado no Insights. O anúncio da home já mede exibição e clique.",
              },
            ].map((item) => (
              <article key={item.tipo} className="flex flex-col justify-between rounded-card border border-on-dark/10 bg-surface-raised p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-on-dark">{item.tipo}</p>
                  <h4 className="mt-1 font-display text-lg font-bold text-on-dark">{item.modelo}</h4>
                  <p className="mt-3 text-xs leading-relaxed text-muted-on-dark">{item.detalhe}</p>
                </div>
                <p className="mt-6 flex items-center gap-2 text-[11px] font-medium text-accent-hover">
                  <Target className="size-3.5" aria-hidden />
                  Fonte de receita
                </p>
              </article>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
