"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capa, iconeCategoria, Ripple, useScreenTimeline, type TelaProps } from "./shared";

const PIN_POSICOES = [
  { left: "30%", top: "28%" },
  { left: "72%", top: "38%" },
  { left: "24%", top: "52%" },
];

export function TelaMapa({ events, active, animate }: TelaProps) {
  const pins = events.slice(0, PIN_POSICOES.length);
  const destaque = pins[0];

  const rootRef = useScreenTimeline<HTMLDivElement>({
    active,
    animate,
    build: (tl) => {
      if (pins.length === 0) return;
      tl.fromTo(
        "[data-pin]",
        { y: -40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55, ease: "back.out(2.4)", stagger: 0.28 },
        0.3,
      )
        .fromTo("[data-pin-shadow]", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.28 }, 0.45)
        .fromTo(
          "[data-ripple]",
          { scale: 0.3, autoAlpha: 0.5 },
          { scale: 2.6, autoAlpha: 0, duration: 0.7, ease: "power2.out", immediateRender: false },
          "+=0.4",
        )
        .to("[data-pin-tap]", { scale: 0.86, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, "<")
        .fromTo("[data-sheet]", { yPercent: 120 }, { yPercent: 0, duration: 0.65, ease: "power3.out" }, "-=0.35");
    },
  });

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-surface-dark text-on-dark">
      <MapaFundo />

      <div className="phone-card absolute inset-x-3 top-10 z-10 flex h-8 items-center gap-2 rounded-full px-3 text-[11px] text-muted-on-dark">
        <Search className="size-3.5" strokeWidth={2} />
        Perto de você
      </div>

      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <span className={cn("phone-ring absolute inset-0 rounded-full", animate && "phone-pulse")} />
        <span className="relative block size-3.5 rounded-full bg-accent-gradient ring-2 ring-on-dark" />
      </div>

      {pins.map((event, index) => {
        const Icone = iconeCategoria(event.categoria);
        return (
          <div
            key={event.id}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={PIN_POSICOES[index]}
          >
            <span
              data-pin-shadow
              className="phone-shadow absolute -bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full"
            />
            <div data-pin className="relative neon-pin">
              <div data-pin-tap={index === 0 ? "" : undefined} className="relative origin-bottom">
                <span className="grid size-7 rotate-45 place-items-center rounded-full rounded-br-none border border-on-dark/20 bg-accent-gradient shadow-cta">
                  <Icone className="size-3.5 -rotate-45" strokeWidth={2.25} />
                </span>
                {index === 0 ? <Ripple /> : null}
              </div>
            </div>
          </div>
        );
      })}

      {destaque ? (
        <div data-sheet className="phone-card absolute inset-x-2 bottom-2 z-20 grid gap-2 rounded-card p-2.5 shadow-card">
          <span className="phone-handle mx-auto h-1 w-8 rounded-full" />
          <Capa src={destaque.imagemCapa} className="h-20 w-full rounded-sm" />
          <div className="grid gap-1 px-0.5">
            <p className="line-clamp-2 font-display text-[13px] font-semibold leading-tight tracking-display">
              {destaque.titulo}
            </p>
            <p className="truncate text-[11px] leading-tight text-muted-on-dark">
              {[destaque.categoria, destaque.quando].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight",
              destaque.gratuito ? "bg-accent-gradient" : "phone-chip",
            )}
          >
            {destaque.gratuito ? "Grátis" : "Pago"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function MapaFundo() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 200 420" preserveAspectRatio="xMidYMid slice">
      <rect x="116" y="70" width="74" height="96" rx="14" style={{ fill: "var(--phone-map-park)" }} />
      <path
        d="M-20 318 C 30 290, 70 350, 120 322 S 190 280, 230 300"
        fill="none"
        strokeWidth="18"
        strokeLinecap="round"
        style={{ stroke: "var(--phone-map-water)" }}
      />
      <g fill="none" strokeLinecap="round" style={{ stroke: "var(--color-on-dark)" }}>
        <g strokeWidth="3" opacity="0.1">
          <path d="M-10 190 L 210 170" />
          <path d="M92 -10 L 108 430" />
          <path d="M-10 400 L 210 360" />
        </g>
        <g strokeWidth="1" opacity="0.07">
          <path d="M-10 60 L 210 48" />
          <path d="M-10 120 L 210 112" />
          <path d="M-10 250 L 210 232" />
          <path d="M-10 290 L 210 270" />
          <path d="M40 -10 L 52 430" />
          <path d="M150 -10 L 160 430" />
          <path d="M-10 20 L 120 140" />
          <path d="M60 230 L 210 330" />
        </g>
      </g>
    </svg>
  );
}
