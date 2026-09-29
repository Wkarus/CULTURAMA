"use client";

import ModalCards from "@/components/ModalCards";
import { visual } from "@/lib/visual-tokens";

const passos = [
  {
    id: "mapa",
    kicker: "01",
    title: "Encontre o que rola perto",
    description:
      "Abra o mapa e veja shows, teatro e rua ao redor. O pin mostra só o que ainda vai acontecer.",
    href: "/mapa",
    cta: "Ver no mapa",
    gradientColor: visual.accentTo,
  },
  {
    id: "filtros",
    kicker: "02",
    title: "Filtre data, entrada e distância",
    description: "Ajuste a lista por quando, se é pago ou grátis, e até onde você consegue ir.",
    href: "/eventos",
    cta: "Ver lista",
    gradientColor: visual.accentFrom,
  },
  {
    id: "rotas",
    kicker: "03",
    title: "Compare rotas e chame o carro",
    description:
      "Carro, metrô e caminhada no mesmo lugar. Se fizer sentido, abra Uber ou 99 já com o destino.",
    href: "/mapa",
    cta: "Comparar rotas",
    gradientColor: visual.accentSolid,
  },
];

export function HomeHowItWorks() {
  return (
    <section className="mx-auto max-w-page px-4 py-20 md:py-24">
      <h2 className="font-display text-2xl font-semibold tracking-display">Como funciona</h2>
      <div className="mt-10">
        <ModalCards cards={passos} ariaLabel="Detalhe de como o Culturama funciona" />
      </div>
    </section>
  );
}
