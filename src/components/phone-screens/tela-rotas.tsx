"use client";

import { useId } from "react";
import { Car, Footprints, TrainFront, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconeCategoria, Ripple, useScreenTimeline, type TelaProps } from "./shared";

type Opcao = { id: string; Icone: LucideIcon; label: string; tempo: string; distancia: string };

const OPCOES: Opcao[] = [
  { id: "carro", Icone: Car, label: "Carro", tempo: "14 min", distancia: "4,8 km" },
  { id: "metro", Icone: TrainFront, label: "Metrô", tempo: "19 min", distancia: "5,3 km" },
  { id: "caminhada", Icone: Footprints, label: "Caminhada", tempo: "56 min", distancia: "4,1 km" },
];
const OPCAO_FINAL = "metro";

const ROTA = "M36 178 L36 152 L80 152 L80 118 L124 118 L124 104";

export function TelaRotas({ events, active, animate }: TelaProps) {
  const destino = events[0];
  const IconeDestino = iconeCategoria(destino?.categoria ?? null);
  const gradId = `rota-${useId().replace(/:/g, "")}`;

  const rootRef = useScreenTimeline<HTMLDivElement>({
    active,
    animate,
    build: (tl) => {
      tl.fromTo(
        "[data-route-solid]",
        { opacity: 1, strokeDashoffset: 1 },
        { opacity: 1, strokeDashoffset: 0, duration: 1.1, ease: "power1.inOut" },
        0.3,
      )
        .fromTo(
          "[data-dest]",
          { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.4)" },
          1.25,
        )
        .fromTo(
          "[data-option]",
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out", stagger: 0.15 },
          0.5,
        )
        .fromTo('[data-hl="carro"]', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.4)
        .to('[data-hl="carro"]', { opacity: 0, duration: 0.35 }, 2.5)
        .fromTo(`[data-hl="${OPCAO_FINAL}"]`, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 2.5)
        .to("[data-route-solid]", { opacity: 0, duration: 0.35 }, 2.5)
        .fromTo("[data-route-dashed]", { opacity: 0 }, { opacity: 1, duration: 0.35 }, 2.5)
        .fromTo(
          "[data-cta]",
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 },
          3.1,
        )
        .fromTo(
          "[data-ripple]",
          { scale: 0.3, autoAlpha: 0.45 },
          { scale: 3.2, autoAlpha: 0, duration: 0.7, ease: "power2.out", immediateRender: false },
          3.9,
        )
        .to("[data-cta-tap]", { scale: 0.95, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, 3.9);
    },
  });

  return (
    <div ref={rootRef} className="flex h-full w-full flex-col overflow-hidden bg-surface-dark text-on-dark">
      <div className="relative min-h-24 flex-1">
        <svg
          className="absolute inset-0 size-full overflow-visible"
          viewBox="0 0 160 200"
          preserveAspectRatio="xMidYMax meet"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: "var(--color-accent-from)" }} />
              <stop offset="1" style={{ stopColor: "var(--color-accent-to)" }} />
            </linearGradient>
          </defs>
          <rect x="88" y="125" width="64" height="20" rx="8" style={{ fill: "var(--phone-map-park)" }} />
          <g fill="none" strokeLinecap="round" style={{ stroke: "var(--color-on-dark)" }}>
            <g strokeWidth="3" opacity="0.1">
              <path d="M-300 152 L 460 152" />
              <path d="M80 -300 L 80 500" />
            </g>
            <g strokeWidth="1" opacity="0.07">
              <path d="M-300 118 L 460 118" />
              <path d="M-300 80 L 460 80" />
              <path d="M-300 40 L 460 40" />
              <path d="M-300 186 L 460 186" />
              <path d="M36 -300 L 36 500" />
              <path d="M124 -300 L 124 500" />
              <path d="M-8 -300 L -8 500" />
              <path d="M168 -300 L 168 500" />
            </g>
          </g>
          <path
            data-route-solid
            d={ROTA}
            pathLength={1}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            style={{ stroke: `url(#${gradId})`, opacity: 0 }}
          />
          <path
            data-route-dashed
            d={ROTA}
            pathLength={1}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.001 0.035"
            style={{ stroke: `url(#${gradId})` }}
          />
          <circle cx="36" cy="178" r="9" style={{ fill: "color-mix(in srgb, var(--color-accent-to) 30%, transparent)" }} />
          <circle cx="36" cy="178" r="4.5" strokeWidth="2" style={{ fill: `url(#${gradId})`, stroke: "var(--color-on-dark)" }} />
          <g transform="translate(124 94)">
            <g data-dest>
              <circle r="11" style={{ fill: `url(#${gradId})` }} />
              <IconeDestino x={-6} y={-6} size={12} strokeWidth={2.25} style={{ color: "var(--color-on-dark)" }} />
            </g>
          </g>
        </svg>

        <div className="phone-card absolute inset-x-3 top-10 flex h-8 items-center gap-2 rounded-full px-3 text-[11px]">
          <span className="text-muted-on-dark">Até</span>
          <span className="truncate font-medium">{destino?.titulo ?? "o destino"}</span>
        </div>
      </div>

      <div className="phone-card -mt-3 grid gap-2 rounded-t-card border-x-0 border-b-0 p-3">
        <p className="font-display text-[12px] font-semibold tracking-display">Como ir</p>
        <ul className="grid gap-1.5">
          {OPCOES.map((opcao) => (
            <li key={opcao.id} data-option className="phone-chip relative overflow-hidden rounded-sm">
              <span
                data-hl={opcao.id}
                className={cn(
                  "absolute inset-0 bg-accent-gradient",
                  opcao.id === OPCAO_FINAL ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="relative flex items-center gap-2 px-2 py-1.5">
                <opcao.Icone className="size-3.5 shrink-0" strokeWidth={2} />
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className="text-[12px] font-medium">{opcao.label}</span>
                  <span className="text-[11px] opacity-70">{opcao.distancia}</span>
                </span>
                <span className="font-display text-[12px] font-semibold tabular-nums">{opcao.tempo}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <span
            data-cta
            data-cta-tap
            className="relative grid h-8 place-items-center overflow-hidden rounded-control bg-on-dark text-[11px] font-medium text-on-light"
          >
            <span className="relative">Abrir no Uber</span>
            <Ripple tone="bg-accent-to" />
          </span>
          <span data-cta className="phone-chip grid h-8 place-items-center rounded-control text-[11px] font-medium">
            Abrir no 99
          </span>
        </div>
      </div>
    </div>
  );
}
