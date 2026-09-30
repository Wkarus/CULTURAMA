"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createParticleSlider, type ParticleSlider } from "@/components/particle-slider-gl";
import { buttonVariants } from "@/components/ui/button";
import { imagemMesmaOrigem } from "@/lib/imagem";
import { cn } from "@/lib/utils";
import { useWebglSlot } from "@/lib/webgl-slot";

export type EventoDestaque = {
  id: string;
  titulo: string;
  imagemCapa: string;
  href: string;
  quando: string;
  categoria: string | null;
};

const LIMIAR_ARRASTE = 48;

export function HomeFeaturedParticles({ events }: { events: EventoDestaque[] }) {
  if (events.length === 0) return null;
  return <FeaturedSlider events={events} />;
}

function FeaturedSlider({ events }: { events: EventoDestaque[] }) {
  const total = events.length;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ParticleSlider | null>(null);
  const indexRef = useRef(0);
  const dragRef = useRef<{ x: number; id: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [particlesOk, setParticlesOk] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const [glReady, setGlReady] = useState(false);

  const srcs = useMemo(() => events.map((event) => imagemMesmaOrigem(event.imagemCapa)), [events]);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setParticlesOk(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  const ownsWebgl = useWebglSlot("featured-particles", sectionRef, particlesOk && !glFailed && total > 1);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!ownsWebgl || !host) return;
    let engine: ParticleSlider;
    try {
      engine = createParticleSlider(host, srcs, indexRef.current, () => setGlReady(true));
    } catch {
      setGlFailed(true);
      return;
    }
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
      setGlReady(false);
    };
  }, [ownsWebgl, srcs]);

  function go(delta: number) {
    const next = (indexRef.current + delta + total) % total;
    indexRef.current = next;
    setIndex(next);
    engineRef.current?.goTo(next, Math.sign(delta));
  }

  function goTo(target: number) {
    if (target === indexRef.current) return;
    go(target - indexRef.current);
  }

  function pointerToClip(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    };
  }

  const event = events[index];
  const meta = [event.categoria, event.quando].filter(Boolean).join(" · ");

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={sectionRef}
        aria-roledescription="carrossel"
        aria-label="Eventos em destaque"
        className="relative bg-surface-dark text-on-dark"
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === "ArrowRight") {
            keyEvent.preventDefault();
            go(1);
          } else if (keyEvent.key === "ArrowLeft") {
            keyEvent.preventDefault();
            go(-1);
          }
        }}
      >
        <div className="mx-auto max-w-page px-4 py-20 md:py-24">
          <div className="flex items-end justify-between gap-6">
            <div className="grid gap-2">
              <p className="text-caption text-muted-on-dark">Eventos em destaque</p>
              <h2 className="font-display text-2xl font-semibold tracking-display">Em cartaz agora</h2>
            </div>
            {total > 1 ? (
              <div className="flex items-center gap-3">
                <span className="font-display text-caption tabular-nums text-muted-on-dark" aria-hidden>
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
                <SetaButton label="Evento anterior" onClick={() => go(-1)}>
                  <ChevronLeft className="size-4" />
                </SetaButton>
                <SetaButton label="Próximo evento" onClick={() => go(1)}>
                  <ChevronRight className="size-4" />
                </SetaButton>
              </div>
            ) : null}
          </div>

          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${total}: ${event.titulo}`}
            tabIndex={0}
            className={cn(
              "relative mt-8 h-[min(70vh,620px)] min-h-[380px] touch-pan-y select-none overflow-hidden rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              total > 1 && "cursor-grab active:cursor-grabbing",
            )}
            onPointerDown={(pointerEvent) => {
              if ((pointerEvent.target as HTMLElement).closest("a, button")) return;
              dragRef.current = { x: pointerEvent.clientX, id: pointerEvent.pointerId };
              pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
            }}
            onPointerMove={(pointerEvent) => {
              const { x, y } = pointerToClip(pointerEvent);
              engineRef.current?.setPointer(x, y, true);
            }}
            onPointerUp={(pointerEvent) => {
              const drag = dragRef.current;
              dragRef.current = null;
              if (!drag || drag.id !== pointerEvent.pointerId || total < 2) return;
              const dx = pointerEvent.clientX - drag.x;
              if (Math.abs(dx) >= LIMIAR_ARRASTE) go(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
            onPointerLeave={() => engineRef.current?.setPointer(9, 9, false)}
          >
            <div
              className={cn("absolute inset-0 transition-opacity duration-500", glReady && "opacity-0")}
              aria-hidden
            >
              {events.map((item, itemIndex) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={item.id}
                  src={srcs[itemIndex]}
                  alt=""
                  draggable={false}
                  loading={itemIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={cn(
                    "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out",
                    itemIndex === index ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>

            <div
              ref={canvasHostRef}
              className={cn("absolute inset-0 transition-opacity duration-700", glReady ? "opacity-100" : "opacity-0")}
              aria-hidden
            />

            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-dark via-[color-mix(in_srgb,var(--color-surface-dark)_35%,transparent)] to-transparent"
              aria-hidden
            />

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={event.id}
                  className="grid max-w-[36rem] gap-3"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {meta ? <p className="text-caption text-muted-on-dark">{meta}</p> : null}
                  <h3 className="text-balance font-display text-[clamp(1.75rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-display">
                    {event.titulo}
                  </h3>
                  <Link href={event.href} className={cn(buttonVariants(), "mt-2 w-fit")}>
                    Ver evento
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {total > 1 ? (
            <div className="mt-5 flex gap-2">
              {events.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir para ${item.titulo}`}
                  aria-current={itemIndex === index ? "true" : undefined}
                  onClick={() => goTo(itemIndex)}
                  className="group grid h-6 flex-1 place-items-center outline-none"
                >
                  <span
                    className="relative block h-0.5 w-full overflow-hidden rounded-full group-focus-visible:ring-2 group-focus-visible:ring-ring"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-on-dark) 14%, transparent)" }}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 origin-left bg-accent-gradient transition-transform duration-500",
                        itemIndex === index ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </MotionConfig>
  );
}

function SetaButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="phone-chip grid size-10 place-items-center rounded-full text-on-dark transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transform-none"
    >
      {children}
    </button>
  );
}
