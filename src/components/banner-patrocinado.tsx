import { ArrowUpRight } from "lucide-react";

export type BannerAnuncio = { href: string; imagem: string; patrocinador: string };

export function BannerPatrocinado({ anuncio }: { anuncio: BannerAnuncio }) {
  return (
    <section aria-label="Patrocinado" className="mx-auto max-w-page px-4 pb-16">
      <a
        href={anuncio.href}
        target="_blank"
        rel="sponsored noopener"
        className="group relative block overflow-hidden rounded-card bg-surface-dark shadow-card outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-solid)] focus-visible:ring-offset-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={anuncio.imagem}
          alt={`Anúncio de ${anuncio.patrocinador}`}
          className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none sm:aspect-[4/1]"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[color-mix(in_srgb,var(--color-surface-dark)_80%,transparent)] to-transparent p-4 sm:p-5">
          <span className="flex flex-wrap items-center gap-2 text-on-dark">
            <span className="rounded-pill bg-[color-mix(in_srgb,var(--color-surface-dark)_70%,transparent)] px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.14em] backdrop-blur-sm">
              Patrocinado
            </span>
            <span className="font-display text-sm font-semibold tracking-display">{anuncio.patrocinador}</span>
          </span>
          <ArrowUpRight
            className="size-5 shrink-0 text-on-dark transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
        </div>
      </a>
    </section>
  );
}
