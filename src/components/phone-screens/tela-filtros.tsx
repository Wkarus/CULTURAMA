"use client";

import { useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capa, iconeCategoria, useScreenTimeline, type EventoTela, type TelaProps } from "./shared";

const CHIPS = ["Hoje", "Fim de semana", "Grátis", "Até 3 km"];
const ETAPA_FINAL = CHIPS.length;
const DISTANCIA_INICIAL = 10;
const DISTANCIA_FINAL = 3;
const POSICAO_FINAL = `${(DISTANCIA_FINAL / DISTANCIA_INICIAL) * 100}%`;

/** Cards de esqueleto somem a cada filtro; os eventos reais trocam de ordem no meio e voltam por data no fim. */
const ORDEM_POR_ETAPA = [
  ["s1", "e0", "s2", "e1", "s3", "e2"],
  ["e0", "s2", "e1", "s3", "e2"],
  ["e1", "e0", "s3", "e2"],
  ["e1", "e0", "e2"],
  ["e0", "e1", "e2"],
];

export function TelaFiltros({ events, active, animate }: TelaProps) {
  const [etapa, setEtapa] = useState(ETAPA_FINAL);
  const kmRef = useRef<HTMLSpanElement>(null);

  const rootRef = useScreenTimeline<HTMLDivElement>({
    active,
    animate,
    onReset: () => {
      setEtapa(0);
      if (kmRef.current) kmRef.current.textContent = `${DISTANCIA_INICIAL} km`;
    },
    onRevert: () => {
      setEtapa(ETAPA_FINAL);
      if (kmRef.current) kmRef.current.textContent = `${DISTANCIA_FINAL} km`;
    },
    build: (tl) => {
      CHIPS.forEach((_, index) => {
        tl.call(() => setEtapa(index + 1), [], 0.5 + index * 0.65);
      });
      const inicioSlider = 0.5 + (CHIPS.length - 1) * 0.65;
      const km = { value: DISTANCIA_INICIAL };
      const escala = DISTANCIA_INICIAL / DISTANCIA_FINAL;
      tl.fromTo(
        "[data-fill]",
        { scaleX: escala },
        { scaleX: 1, duration: 0.9, ease: "power2.inOut" },
        inicioSlider,
      )
        .fromTo(
          "[data-thumb]",
          { xPercent: ((DISTANCIA_INICIAL - DISTANCIA_FINAL) / DISTANCIA_INICIAL) * 100 },
          { xPercent: 0, duration: 0.9, ease: "power2.inOut" },
          inicioSlider,
        )
        .fromTo(
          km,
          { value: DISTANCIA_INICIAL },
          {
            value: DISTANCIA_FINAL,
            duration: 0.9,
            ease: "power2.inOut",
            onUpdate: () => {
              if (kmRef.current) kmRef.current.textContent = `${Math.round(km.value)} km`;
            },
          },
          inicioSlider,
        );
    },
  });

  const porChave = new Map(events.slice(0, 3).map((event, index) => [`e${index}`, event]));
  const itens = ORDEM_POR_ETAPA[etapa].filter((key) => key.startsWith("s") || porChave.has(key));
  const encontrados = itens.length;

  return (
    <div ref={rootRef} className="flex h-full w-full flex-col gap-3 overflow-hidden bg-surface-dark px-3 pb-3 pt-10 text-on-dark">
      <div className="flex items-center justify-between">
        <p className="font-display text-[15px] font-semibold tracking-display">Eventos</p>
        <span className="phone-chip grid size-7 place-items-center rounded-full">
          <SlidersHorizontal className="size-3.5" strokeWidth={2} />
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip, index) => (
          <span
            key={chip}
            className="phone-chip relative overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-medium leading-tight"
          >
            <span
              className={cn(
                "absolute inset-0 bg-accent-gradient transition-opacity duration-300",
                index < etapa ? "opacity-100" : "opacity-0",
              )}
            />
            <span className="relative">{chip}</span>
          </span>
        ))}
      </div>

      <div className="phone-card grid gap-2 rounded-sm p-2.5">
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="text-muted-on-dark">Distância</span>
          <span ref={kmRef} className="font-display font-semibold tabular-nums">
            {DISTANCIA_FINAL} km
          </span>
        </div>
        <div className="relative h-4">
          <span className="phone-skeleton absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" />
          <span className="absolute inset-y-0 left-0 flex items-center" style={{ width: POSICAO_FINAL }}>
            <span data-fill className="h-1 w-full origin-left rounded-full bg-accent-gradient" />
          </span>
          <span data-thumb className="absolute inset-0">
            <span
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-dark shadow-cta"
              style={{ left: POSICAO_FINAL }}
            />
          </span>
        </div>
      </div>

      {porChave.size > 0 ? (
        <MotionConfig reducedMotion="user">
          <div className="grid min-h-0 gap-2">
            <p className="text-[11px] leading-tight text-muted-on-dark">
              <span className="font-display font-semibold tabular-nums text-on-dark">{encontrados}</span>{" "}
              {encontrados === 1 ? "evento encontrado" : "eventos encontrados"}
            </p>
            <ul className="grid gap-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {itens.map((key) => {
                  const event = porChave.get(key);
                  return (
                    <motion.li
                      key={key}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.7 }}
                    >
                      {event ? <MiniCard event={event} /> : <CardEsqueleto />}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </MotionConfig>
      ) : null}
    </div>
  );
}

function MiniCard({ event }: { event: EventoTela }) {
  const Icone = iconeCategoria(event.categoria);
  return (
    <div className="phone-card flex items-center gap-2 rounded-sm p-1.5">
      <Capa src={event.imagemCapa} className="size-9 shrink-0 rounded-sm" />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="truncate font-display text-[12px] font-semibold leading-tight tracking-display">{event.titulo}</p>
        <p className="flex items-center gap-1 truncate text-[11px] leading-tight text-muted-on-dark">
          <Icone className="size-3 shrink-0" strokeWidth={2} />
          <span className="truncate">{event.quando}</span>
        </p>
      </div>
      {event.gratuito ? (
        <span className="shrink-0 rounded-full bg-accent-gradient px-1.5 py-0.5 text-[11px] font-medium leading-tight">
          Grátis
        </span>
      ) : null}
    </div>
  );
}

function CardEsqueleto() {
  return (
    <div className="phone-card flex items-center gap-2 rounded-sm p-1.5">
      <span className="phone-skeleton size-9 shrink-0 rounded-sm" />
      <div className="grid flex-1 gap-1.5">
        <span className="phone-skeleton h-2 w-3/4 rounded-full" />
        <span className="phone-skeleton h-2 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
