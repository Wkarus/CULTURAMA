"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import Aurora from "@/components/Aurora";
import BlurText from "@/components/BlurText";
import CurvedLoop from "@/components/CurvedLoop";
import { buttonVariants } from "@/components/ui/button";
import { visual } from "@/lib/visual-tokens";
import { cn } from "@/lib/utils";

const SPONSOR_PATH = "M 300 72 A 228 228 0 1 1 299.99 72";

function loopText(names: string[], copies = 1): string {
  if (names.length === 0) return "";
  const unit = `${names.join("   ·   ")}   ·   `;
  return unit.repeat(Math.max(1, copies));
}

function EventTicker({
  names,
  reverse = false,
  paused = false,
}: {
  names: string[];
  reverse?: boolean;
  paused?: boolean;
}) {
  if (names.length === 0) return null;
  const line = [...names, ...names];

  return (
    <div className="h-[2.75rem] overflow-hidden whitespace-nowrap md:h-[3.25rem]">
      <div
        className="flex w-max items-center font-display text-[clamp(1.35rem,3.6vw,2.35rem)] font-bold uppercase leading-none tracking-[0.1em]"
        style={{
          animation: paused ? "none" : `hero-marquee ${reverse ? "52s" : "40s"} linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {line.map((name, index) => (
          <span key={`${name}-${index}`} className="inline-flex shrink-0 items-center">
            {name}
            <span className="mx-7 opacity-40" aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HomeHero({ events, sponsors }: { events: string[]; sponsors: string[] }) {
  const reduce = useReducedMotion();
  const [allowAurora, setAllowAurora] = useState(false);
  const [allowType, setAllowType] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAllowAurora(fine && motionOk);
    setAllowType(fine && motionOk && !reduce);
  }, [reduce]);

  const sponsorText = loopText(sponsors, 8);
  const ringSpeed = reduce ? 0 : 0.45;

  return (
    <section
      className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-dark)", color: "var(--color-on-dark)" }}
    >
      {allowAurora ? (
        <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-80" aria-hidden>
          <Aurora
            colorStops={[visual.accentFrom, visual.accentTo, visual.accentFrom]}
            amplitude={1.05}
            blend={0.65}
            speed={0.7}
          />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 glow-spot" aria-hidden />
      )}

      <div className="hero-orbs pointer-events-none absolute inset-0" aria-hidden>
        <span className="hero-orb hero-orb-a" />
        <span className="hero-orb hero-orb-b" />
        <span className="hero-orb hero-orb-c" />
      </div>

      {events.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <div
            className="absolute inset-x-0 top-5 opacity-35 md:top-7"
            style={{ color: "var(--color-on-dark)" }}
          >
            <EventTicker names={events} paused={!!reduce} />
          </div>
          <div
            className="absolute inset-x-0 bottom-5 opacity-30 md:bottom-7"
            style={{ color: "var(--color-muted-on-dark)" }}
          >
            <EventTicker names={events} reverse paused={!!reduce} />
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-page flex-col items-center px-4 py-20 text-center md:py-24">
        <div className="relative grid size-[min(94vw,40rem)] place-items-center">
          {events.length > 0 ? (
            <p className="sr-only">Eventos em destaque: {events.join(", ")}</p>
          ) : null}
          {sponsors.length > 0 ? (
            <p className="sr-only">Patrocinadores: {sponsors.join(", ")}</p>
          ) : null}
          {sponsorText ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ color: "var(--color-accent-hover-text)" }}
              aria-hidden
            >
              <CurvedLoop
                marqueeText={sponsorText}
                path={SPONSOR_PATH}
                viewBox="0 0 600 600"
                speed={ringSpeed}
                interactive={false}
                svgClassName="block w-full select-none overflow-visible font-display text-[clamp(1.2rem,3.4vw,1.85rem)] font-semibold uppercase leading-none tracking-[0.2em]"
              />
            </div>
          ) : null}

          {allowType ? (
            <BlurText
              as="h1"
              text="Culturama"
              animateBy="letters"
              delay={45}
              stepDuration={0.22}
              threshold={0}
              animationFrom={{ filter: "blur(6px)", opacity: 0.75, y: 12 }}
              animationTo={[{ filter: "blur(0px)", opacity: 1, y: 0 }]}
              className="relative z-10 justify-center font-display text-[clamp(2.6rem,11vw,6.5rem)] font-bold leading-none tracking-[-0.06em]"
            />
          ) : (
            <h1 className="relative z-10 font-display text-[clamp(2.6rem,11vw,6.5rem)] font-bold leading-none tracking-[-0.06em]">
              Culturama
            </h1>
          )}
        </div>

        <p className="mt-8 max-w-[34ch] text-body-lg" style={{ color: "var(--color-muted-on-dark)" }}>
          Shows, teatro e rua. Compare carro, metrô e caminhada até o destino.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/mapa" className={cn(buttonVariants())}>
            Ver no mapa
          </Link>
          <Link
            href="/eventos"
            className={cn(buttonVariants({ variant: "outline" }))}
            style={{
              borderColor: "color-mix(in srgb, var(--color-on-dark) 22%, transparent)",
              background: "transparent",
              color: "var(--color-on-dark)",
            }}
          >
            Ver lista
          </Link>
        </div>
      </div>
    </section>
  );
}
