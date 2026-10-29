import { CheckCircle2, Clock, Compass, MapPin, ShieldAlert, Sparkles } from "lucide-react";

export function HomePainSolution() {
  const dores = [
    {
      icone: Compass,
      titulo: "Informação dispersa",
      descricao:
        "Eventos espalhados em dezenas de redes sociais, panfletos de rua e sites desatualizados. O público perde o que mais interessa por falta de centralização.",
    },
    {
      icone: Clock,
      titulo: "Tempo perdido",
      descricao:
        "Horas rolando feeds e grupos para decidir o que fazer no final de semana, gerando atrito e frustração antes mesmo de sair de casa.",
    },
    {
      icone: ShieldAlert,
      titulo: "Pouca confiança",
      descricao:
        "Incerteza sobre horários reais, locais imprecisos, medo de ingressos falsos e pouca credibilidade em produções independentes sem validação.",
    },
  ];

  const pilaresSolucao = [
    {
      titulo: "Cultura por perto, num só app",
      descricao: "Geolocalização para descobrir o que está acontecendo perto de onde você está.",
    },
    {
      titulo: "Curadoria e verificação",
      descricao: "Organizadores verificados por CPF ou CNPJ, para reduzir evento fantasma e golpe.",
    },
    {
      titulo: "Rotas até o evento",
      descricao: "Compare tempo e trajeto de metrô, ônibus, carro ou a pé até o destino.",
    },
  ];

  return (
    <section className="relative border-t border-border-light bg-surface-light px-4 py-20 text-on-light md:py-28">
      <div className="mx-auto max-w-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-from/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-ink">
            <Sparkles className="size-3.5" aria-hidden />
            O desafio da cultura urbana
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-display text-on-light sm:text-4xl md:text-5xl">
            A dor e a solução
          </h2>
          <p className="mt-3 text-base text-muted-on-light sm:text-lg">
            Por que é tão difícil descobrir o que fazer na sua própria cidade, e como o Culturama muda esse cenário.
          </p>
        </div>

        <div className="mt-14">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-ink">Os problemas atuais</p>
          <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dores.map((dor) => {
              const Icone = dor.icone;
              return (
                <div
                  key={dor.titulo}
                  className="group relative rounded-card border border-border-light bg-card p-6 shadow-card transition hover:border-accent-from/40 motion-reduce:transition-none"
                >
                  <div className="flex size-12 items-center justify-center rounded-control bg-accent-from/10 text-accent-ink transition group-hover:bg-accent-gradient group-hover:text-on-dark motion-reduce:transition-none">
                    <Icone className="size-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-on-light">{dor.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-on-light">{dor.descricao}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-card border border-on-dark/10 bg-surface-dark p-8 text-on-dark shadow-card md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-from/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
                <MapPin className="size-3.5" aria-hidden />
                A solução Culturama
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold tracking-display text-on-dark sm:text-3xl md:text-4xl">
                Cultura por perto, num só app.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-on-dark sm:text-base">
                Das batalhas de rima e rodas de samba aos encontros de carros, eventos geek e festivais. O que está publicado aparece no mapa, com data e endereço.
              </p>
            </div>

            <div className="grid gap-4">
              {pilaresSolucao.map((pilar) => (
                <div key={pilar.titulo} className="flex items-start gap-3 rounded-control border border-on-dark/10 bg-on-dark/5 p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-hover" aria-hidden />
                  <div>
                    <h4 className="font-display text-sm font-bold text-on-dark">{pilar.titulo}</h4>
                    <p className="mt-0.5 text-xs text-muted-on-dark">{pilar.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
