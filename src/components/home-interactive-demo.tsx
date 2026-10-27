"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Map, Sparkles } from "lucide-react";
import { HomeHowItWorks } from "@/components/home-how-it-works";
import type { EventoTela } from "@/components/phone-screens/shared";

export function HomeInteractiveDemo({ events }: { events: EventoTela[] }) {
  return (
    <div id="demo" className="relative bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-page px-4 pt-20 text-center md:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-from/30 bg-accent-from/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
          <Sparkles className="size-3.5" aria-hidden />
          Demonstração da plataforma
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-display text-on-dark sm:text-4xl md:text-5xl">
          Experimente o Culturama
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-on-dark sm:text-lg">
          O celular abaixo usa os eventos que estão no ar. Sem evento publicado, a tela aparece vazia.
        </p>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <Link
            href="/mapa"
            className="group flex flex-col justify-between rounded-card border border-on-dark/10 bg-on-dark/[0.04] p-5 text-left outline-none transition-colors duration-300 hover:border-accent-from hover:bg-on-dark/[0.08] focus-visible:ring-2 focus-visible:ring-accent-hover motion-reduce:transition-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-control bg-accent-gradient text-on-dark shadow-cta">
                  <Map className="size-5" aria-hidden />
                </span>
                <span className="rounded-pill bg-accent-from/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-hover">
                  Mapa
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-on-dark">Mapa cultural</h3>
              <p className="mt-1 text-xs text-muted-on-dark">Eventos no mapa, com rota até o destino.</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-hover group-hover:text-on-dark">
              Abrir o mapa
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </Link>

          <Link
            href="/eventos"
            className="group flex flex-col justify-between rounded-card border border-on-dark/10 bg-on-dark/[0.04] p-5 text-left outline-none transition-colors duration-300 hover:border-accent-from hover:bg-on-dark/[0.08] focus-visible:ring-2 focus-visible:ring-accent-hover motion-reduce:transition-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-control bg-on-dark/10 text-on-dark group-hover:bg-accent-gradient">
                  <Calendar className="size-5" aria-hidden />
                </span>
                <span className="rounded-pill bg-on-dark/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-on-dark">
                  Eventos
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-on-dark">Catálogo</h3>
              <p className="mt-1 text-xs text-muted-on-dark">Filtre por data, preço, distância e categoria.</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-hover group-hover:text-on-dark">
              Abrir a lista
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </Link>
        </div>
      </div>

      <HomeHowItWorks events={events} />
    </div>
  );
}
