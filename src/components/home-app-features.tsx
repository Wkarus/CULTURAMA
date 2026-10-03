import Link from "next/link";
import { ArrowRight, Map, Navigation, ShieldCheck, Sparkles } from "lucide-react";

export function HomeAppFeatures() {
  const features = [
    {
      icone: Map,
      badge: "Mapa",
      titulo: "Mapa cultural",
      descricao: "Veja eventos publicados perto de você, com endereço e data, direto no mapa.",
      linkHref: "/mapa",
      linkTexto: "Explorar o mapa",
    },
    {
      icone: Sparkles,
      badge: "Interesses",
      titulo: "Busca por interesse",
      descricao: "Filtre por categoria e marque o que você curte para achar evento do seu gosto.",
      linkHref: "/eventos",
      linkTexto: "Ver categorias",
    },
    {
      icone: Navigation,
      badge: "Mobilidade",
      titulo: "Rotas até o evento",
      descricao: "Compare tempo e trajeto de metrô, ônibus, carro ou a pé até o destino.",
      linkHref: "/mapa",
      linkTexto: "Testar rotas",
    },
    {
      icone: ShieldCheck,
      badge: "Confiança",
      titulo: "Organizador verificado",
      descricao: "Quem publica passa por cadastro com CPF ou CNPJ. O selo aparece quando a verificação é aprovada.",
      linkHref: "/cadastro/organizador",
      linkTexto: "Cadastrar como organizador",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-surface-dark px-4 py-20 text-on-dark md:py-28">
      <div className="pointer-events-none absolute -left-40 top-1/4 size-96 rounded-full bg-accent-from/15 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 size-96 rounded-full bg-accent-to/15 blur-[120px]" aria-hidden />

      <div className="relative mx-auto max-w-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center rounded-pill border border-accent-from/30 bg-accent-from/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
            Tecnologia e experiência
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-display text-on-dark sm:text-4xl md:text-5xl">
            O que o Culturama faz hoje
          </h2>
          <p className="mt-3 text-base text-muted-on-dark sm:text-lg">
            Mapa, lista, rotas e cadastro de quem organiza. O resto do app móvel ainda está em construção.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat) => {
            const Icone = feat.icone;
            return (
              <div
                key={feat.titulo}
                className="group relative flex flex-col justify-between rounded-card border border-on-dark/10 bg-on-dark/[0.04] p-6 transition-colors duration-300 hover:border-accent-from/60 hover:bg-on-dark/[0.07] motion-reduce:transition-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid size-12 place-items-center rounded-control bg-accent-gradient text-on-dark shadow-cta">
                      <Icone className="size-6" aria-hidden />
                    </span>
                    <span className="rounded-pill bg-on-dark/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-accent-hover">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-bold leading-snug text-on-dark">{feat.titulo}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-on-dark">{feat.descricao}</p>
                </div>
                <div className="mt-6 border-t border-on-dark/10 pt-4">
                  <Link
                    href={feat.linkHref}
                    className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-xs font-semibold text-accent-hover outline-none transition-colors hover:text-on-dark focus-visible:ring-2 focus-visible:ring-accent-hover"
                  >
                    <span>{feat.linkTexto}</span>
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
