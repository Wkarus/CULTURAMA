"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PIN_QUERY, type EventoTela, type TelaProps } from "@/components/phone-screens/shared";
import { TelaFiltros } from "@/components/phone-screens/tela-filtros";
import { TelaMapa } from "@/components/phone-screens/tela-mapa";
import { TelaRotas } from "@/components/phone-screens/tela-rotas";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Passo = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  Tela: ComponentType<TelaProps>;
};

const passos: Passo[] = [
  {
    id: "mapa",
    kicker: "01",
    title: "Encontre o que rola perto",
    description:
      "Abra o mapa e veja batalhas, rodas, encontros e shows ao redor. Só aparece o que ainda vai acontecer.",
    href: "/mapa",
    cta: "Ver no mapa",
    Tela: TelaMapa,
  },
  {
    id: "filtros",
    kicker: "02",
    title: "Filtre data, entrada e distância",
    description: "Ajuste a lista por quando, se é pago ou grátis, e até onde você consegue ir.",
    href: "/eventos",
    cta: "Ver lista",
    Tela: TelaFiltros,
  },
  {
    id: "rotas",
    kicker: "03",
    title: "Compare rotas e chame o carro",
    description:
      "Carro, metrô e caminhada no mesmo lugar. Se fizer sentido, abra Uber ou 99 já com o destino.",
    href: "/mapa",
    cta: "Comparar rotas",
    Tela: TelaRotas,
  },
];

export function HomeHowItWorks({ events }: { events: EventoTela[] }) {
  return (
    <section aria-label="Como funciona" className="relative bg-surface-dark text-on-dark">
      <PinnedShowcase events={events} />
      <StaticShowcase events={events} />
    </section>
  );
}

function PinnedShowcase({ events }: { events: EventoTela[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const phone = phoneRef.current;
    const glow = glowRef.current;
    const rail = railRef.current;
    const screens = screenRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!root || !phone || !glow || !rail || screens.length !== passos.length) return;

    const mm = gsap.matchMedia();
    mm.add(PIN_QUERY, () => {
      let current = 0;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${(passos.length - 1) * 100}%`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onToggle: (self) => setPinned(self.isActive),
          onUpdate: (self) => {
            const t = self.progress * passos.length;
            const next = t < 1.15 ? 0 : t < 2.15 ? 1 : 2;
            if (next !== current) {
              current = next;
              setActive(next);
            }
          },
        },
      });

      tl.fromTo(
        phone,
        { rotateY: -18, rotateX: 6, scale: 0.9 },
        { rotateY: 0, rotateX: 0, scale: 1, duration: passos.length, ease: "power1.out" },
        0,
      )
        .fromTo(glow, { opacity: 0.45, scale: 0.85 }, { opacity: 1, scale: 1, duration: passos.length }, 0)
        .fromTo(rail, { scaleY: 0 }, { scaleY: 1, duration: passos.length }, 0);

      setMotionOk(true);
      gsap.set(screens.slice(1), { autoAlpha: 0, yPercent: 6 });
      screens.slice(1).forEach((screen, i) => {
        const at = i + 1;
        tl.to(screens[i], { autoAlpha: 0, yPercent: -6, duration: 0.3, ease: "power2.inOut" }, at).to(
          screen,
          { autoAlpha: 1, yPercent: 0, duration: 0.3, ease: "power2.inOut" },
          at,
        );
      });

      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cancelAnimationFrame(raf);
        current = 0;
        setActive(0);
        setPinned(false);
        setMotionOk(false);
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative hidden overflow-hidden md:motion-safe:block">
      <div className="mx-auto grid h-[100svh] max-w-page grid-cols-12 items-center gap-8 px-4 pt-16">
        <div className="col-span-6 grid gap-10 lg:col-span-5">
          <h2 className="font-display text-2xl font-semibold tracking-display">
            Como funciona
          </h2>
          <div className="relative pl-8">
            <span
              className="absolute left-0 top-0 h-full w-0.5 rounded-full"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-on-dark) 12%, transparent)" }}
              aria-hidden
            />
            <span
              ref={railRef}
              className="absolute left-0 top-0 h-full w-0.5 origin-top rounded-full bg-accent-gradient will-change-transform"
              style={{ transform: "scaleY(0)" }}
              aria-hidden
            />
            <ol className="grid gap-10">
              {passos.map((passo, index) => (
                <li
                  key={passo.id}
                  aria-current={index === active ? "step" : undefined}
                  className={cn(
                    "grid gap-3 transition-opacity duration-500 ease-out",
                    index === active ? "opacity-100" : "opacity-35",
                  )}
                >
                  <StepText passo={passo} />
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="col-span-6 flex justify-center lg:col-span-6 lg:col-start-7">
          <div className="relative" style={{ perspective: "1400px" }}>
            <div
              ref={glowRef}
              className="pointer-events-none absolute -inset-16 rounded-full blur-3xl will-change-transform"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in srgb, var(--color-accent-to) 55%, transparent), color-mix(in srgb, var(--color-accent-from) 18%, transparent) 60%, transparent)",
                opacity: 0.45,
                transform: "scale(0.85)",
              }}
              aria-hidden
            />
            <div
              ref={phoneRef}
              className="relative will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateY(-18deg) rotateX(6deg) scale(0.9)",
              }}
            >
              <PhoneFrame className="h-[min(72svh,640px)]">
                {passos.map((passo, index) => (
                  <div
                    key={passo.id}
                    ref={(el) => {
                      screenRefs.current[index] = el;
                    }}
                    className="absolute inset-0 will-change-transform"
                    style={index === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
                  >
                    <passo.Tela events={events} active={pinned && index === active} animate={motionOk} />
                  </div>
                ))}
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaticShowcase({ events }: { events: EventoTela[] }) {
  return (
    <div className="mx-auto max-w-page px-4 py-20 md:motion-safe:hidden md:py-24">
      <h2 className="font-display text-2xl font-semibold tracking-display">
        Como funciona
      </h2>
      <ol className="mt-12 grid gap-20 md:grid-cols-3 md:gap-10">
        {passos.map((passo) => (
          <li key={passo.id} className="grid gap-8">
            <div className="relative flex justify-center">
              <div
                className="pointer-events-none absolute inset-x-6 inset-y-10 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, color-mix(in srgb, var(--color-accent-to) 45%, transparent), transparent)",
                }}
                aria-hidden
              />
              <PhoneFrame className="h-[min(64svh,520px)] md:h-[440px]">
                <passo.Tela events={events} active={false} animate={false} />
              </PhoneFrame>
            </div>
            <div className="grid gap-3">
              <StepText passo={passo} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepText({ passo }: { passo: Passo }) {
  return (
    <>
      <span className="font-display text-caption tracking-display text-muted-on-dark">{passo.kicker}</span>
      <h3 className="font-display text-xl font-semibold leading-snug tracking-display md:text-2xl">
        {passo.title}
      </h3>
      <p className="max-w-[42ch] text-body-lg text-muted-on-dark">{passo.description}</p>
      <Link href={passo.href} className={cn(buttonVariants(), "mt-2 w-fit")}>
        {passo.cta}
      </Link>
    </>
  );
}

function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative aspect-[9/19.5] rounded-[44px] p-2.5", className)}
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface-dark) 70%, black)",
        border: "1px solid color-mix(in srgb, var(--color-on-dark) 14%, transparent)",
        boxShadow:
          "inset 0 0 0 1px color-mix(in srgb, var(--color-on-dark) 6%, transparent), 0 48px 96px -32px color-mix(in srgb, var(--color-accent-to) 45%, transparent)",
      }}
    >
      <span
        className="absolute -left-[3px] top-28 h-14 w-[3px] rounded-l-full"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-on-dark) 16%, transparent)" }}
        aria-hidden
      />
      <span
        className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r-full"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-on-dark) 16%, transparent)" }}
        aria-hidden
      />
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-surface-dark">
        {children}
        <span
          className="absolute left-1/2 top-2.5 z-10 h-6 w-[30%] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-surface-dark) 40%, black)" }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 z-10 rounded-[34px]"
          style={{
            background:
              "linear-gradient(115deg, color-mix(in srgb, var(--color-on-dark) 10%, transparent) 0%, transparent 32%)",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}