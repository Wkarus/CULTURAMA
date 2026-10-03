import Link from "next/link";
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
            O número abaixo vem de pesquisa publicada. As fontes de receita são o modelo planejado, não o que o site cobra hoje.
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
            <p className="mt-1 font-display text-sm font-bold uppercase tracking-wider text-on-dark">fontes planejadas</p>
            <p className="mt-2 text-xs text-muted-on-dark">
              Modelo planejado: uso gratuito, comissão de organizador e cota de patrocínio. Nenhuma delas está cobrando no site agora.
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
              <p className="text-xs font-bold uppercase tracking-wider text-accent-hover">Modelo planejado</p>
              <h3 className="font-display text-xl font-bold text-on-dark sm:text-2xl">Como a receita está desenhada</h3>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-on-dark">
              <BarChart3 className="size-4 text-accent-from" aria-hidden />
              Ainda não está em operação
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                tipo: "Quem usa",
                modelo: "Gratuito",
                detalhe: "Descobrir evento continua livre. Plano pago, se existir, entra depois.",
              },
              {
                tipo: "Quem organiza",
                modelo: "Comissão e assinatura",
                detalhe: "Planejado: taxa sobre ingresso e ferramentas de público. O checkout ainda não existe.",
              },
              {
                tipo: "Marcas",
                modelo: "Patrocínio",
                detalhe: "Anúncio na home já conta exibição e clique. Cota comercial é o passo seguinte.",
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
                  Modelo planejado
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 rounded-card border border-on-dark/10 bg-accent-from/10 p-8 text-center sm:p-10">
          <h3 className="font-display text-2xl font-bold text-on-dark">Quer publicar um evento?</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-on-dark">
            O caminho que existe hoje é o cadastro de organizador. Não há e-mail comercial separado.
          </p>
          <Link
            href="/cadastro/organizador"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-pill bg-accent-gradient px-6 text-sm font-semibold text-on-dark shadow-cta outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
          >
            Cadastrar como organizador
          </Link>
        </div>
      </div>
    </section>
  );
}
