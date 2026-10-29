import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus, Heart, Route, type LucideIcon } from "lucide-react";

export type Beneficio = { icone: LucideIcon; texto: string };

const BENEFICIOS: Beneficio[] = [
  { icone: Heart, texto: "Salve eventos nos favoritos" },
  { icone: Route, texto: "Veja como chegar de carro, metrô ou a pé" },
  { icone: CalendarPlus, texto: "Publique seus próprios eventos" },
];

const POSE_CAPAS = [
  { giro: -8, y: 10 },
  { giro: 3, y: -6 },
  { giro: 11, y: 14 },
];

function CapasEmpilhadas({ capas }: { capas: { id: string; imagemCapa: string }[] }) {
  return (
    <div className="hidden pl-2 pt-4 lg:flex" aria-hidden>
      {capas.slice(0, POSE_CAPAS.length).map((capa, i) => (
        <div
          key={capa.id}
          className="-ml-6 aspect-[4/5] w-28 overflow-hidden rounded-card shadow-card first:ml-0 xl:w-32"
          style={{
            transform: `translateY(${POSE_CAPAS[i].y}px) rotate(${POSE_CAPAS[i].giro}deg)`,
            zIndex: POSE_CAPAS.length - i,
            outline: "1px solid color-mix(in srgb, var(--color-on-dark) 14%, transparent)",
          }}
        >
          {/* Sem loading="lazy": no topo da tela o carregamento preguiçoso não disparava e sobrava só a moldura. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capa.imagemCapa} alt="" decoding="async" draggable={false} className="size-full object-cover" />
        </div>
      ))}
    </div>
  );
}

export function AuthShell({
  titulo,
  capas,
  beneficios = BENEFICIOS,
  children,
}: {
  titulo: ReactNode;
  capas: { id: string; imagemCapa: string }[];
  /** Lista ao lado do formulário; o padrão fala com quem vai a eventos. */
  beneficios?: Beneficio[];
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh bg-surface-dark pt-16 text-on-dark lg:grid-cols-2">
      <section className="relative isolate overflow-hidden">
        <div
          className="hero-orbs pointer-events-none absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] lg:[mask-image:none]"
          aria-hidden
        >
          <span className="hero-orb hero-orb-a" />
          <span className="hero-orb hero-orb-b" />
          <span className="hero-orb hero-orb-c" />
        </div>
        <div className="mx-auto flex h-full w-full max-w-xl flex-col justify-center gap-5 px-4 pb-6 pt-8 sm:px-8 lg:gap-10 lg:px-12 lg:py-16">
          <h1 className="text-balance font-display text-[clamp(2rem,4.4vw,3.75rem)] font-bold leading-[1.05] tracking-display">
            {titulo}
          </h1>
          <ul className="grid gap-2.5 lg:gap-4">
            {beneficios.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm lg:text-base">
                <span className="chip-dark inline-flex size-8 shrink-0 items-center justify-center rounded-sm lg:size-10" aria-hidden>
                  <Icone className="size-4 text-accent-hover lg:size-5" strokeWidth={1.75} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
          {capas.length > 0 ? <CapasEmpilhadas capas={capas} /> : null}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 pb-14 pt-2 sm:px-8 lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}

export function AuthTroca({ pergunta, href, acao }: { pergunta: string; href: string; acao: string }) {
  return (
    <p className="mt-6 text-center text-base text-muted-on-dark">
      {pergunta}{" "}
      <Link
        href={href}
        className="rounded-sm font-semibold text-accent-hover underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
      >
        {acao}
      </Link>
    </p>
  );
}
