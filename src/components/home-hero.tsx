"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Aurora from "@/components/Aurora";
import { buttonVariants } from "@/components/ui/button";
import { visual } from "@/lib/visual-tokens";
import { cn } from "@/lib/utils";
import { useWebglSlot } from "@/lib/webgl-slot";

gsap.registerPlugin(ScrollTrigger);

export type CapaHero = {
  id: string;
  titulo: string;
  categoria: string | null;
  imagemCapa: string;
  href: string;
};

type HomeHeroProps = {
  nomes: string[];
  capas: CapaHero[];
  locais: string[];
  patrocinadores: string[];
};

const MOTION_FINE = "(pointer: fine) and (prefers-reduced-motion: no-preference)";
const TROCA_LOCAL_MS = 2200;
const CAMADAS_TITULO = 10;
const MIN_NOMES_FUNDO = 4;

/** Colunas laterais (x em %) — o título ocupa ~22–78% da largura a partir de lg. d = proximidade (1 = perto). */
const SLOTS_CAPAS = [
  { x: 15, y: 40, d: 0.9, r: 5 },
  { x: 93, y: 64, d: 0.85, r: 4 },
  { x: 91, y: 20, d: 0.6, r: 6 },
  { x: 7, y: 63, d: 0.55, r: -4 },
  { x: 86, y: 86, d: 0.45, r: -8 },
  { x: 14, y: 85, d: 0.35, r: 8 },
  { x: 85, y: 42, d: 0.25, r: -6 },
  { x: 8, y: 18, d: 0.2, r: -7 },
];

const mix = (cor: string, pct: number, com = "transparent") => `color-mix(in srgb, ${cor} ${pct}%, ${com})`;

function corCamada(i: number): string {
  const t = i / CAMADAS_TITULO;
  const tom = mix("var(--color-accent-from)", Math.round(100 - t * 100), "var(--color-accent-to)");
  return mix(tom, Math.round(100 - t * 85), "var(--color-surface-dark)");
}

function NomesAoFundo({ nomes }: { nomes: string[] }) {
  const linhas = nomes.length >= 9 ? 3 : 2;
  const grupos = Array.from({ length: linhas }, (_, linha) => {
    const grupo = nomes.filter((_, j) => j % linhas === linha);
    const cheio = [...grupo];
    while (cheio.length < 4) cheio.push(...grupo);
    return cheio;
  });

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-around overflow-hidden py-[6vh] opacity-10"
      aria-hidden
    >
      {grupos.map((grupo, linha) => (
        <div key={linha} data-hero-names>
          <div
            className="hero-marquee-track flex w-max whitespace-nowrap font-display text-[clamp(4rem,10vw,8rem)] font-bold uppercase leading-none tracking-[-0.02em]"
            style={{
              animationDuration: `${140 + linha * 35}s`,
              animationDirection: linha % 2 ? "reverse" : "normal",
            }}
          >
            {[0, 1].map((copia) => (
              <span key={copia} className="flex shrink-0">
                {grupo.map((nome, k) => (
                  <span key={k} className="hero-outline-text px-[0.3em]">
                    {nome}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CapaLegenda({ capa, sempre = false }: { capa: CapaHero; sempre?: boolean }) {
  return (
    <span
      className={cn(
        "absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 text-left transition-[opacity,transform] duration-300",
        !sempre && "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
      )}
      style={{ background: `linear-gradient(to top, ${mix("var(--color-surface-dark)", 88)}, transparent)` }}
    >
      {capa.categoria ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-hover">
          {capa.categoria}
        </span>
      ) : null}
      <span className="line-clamp-2 font-display text-sm font-semibold leading-tight text-on-dark">{capa.titulo}</span>
    </span>
  );
}

function rotuloCapa(capa: CapaHero) {
  return capa.categoria ? `${capa.titulo}, ${capa.categoria}` : capa.titulo;
}

function CapasFlutuantes({ capas }: { capas: CapaHero[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:fine:block">
      {capas.map((capa, i) => {
        const slot = SLOTS_CAPAS[i];
        const lado = slot.x < 50 ? 1 : -1;
        return (
          <div
            key={capa.id}
            className="absolute z-[var(--z)] -translate-x-1/2 -translate-y-1/2 focus-within:z-30 hover:z-30"
            style={{ left: `${slot.x}%`, top: `${slot.y}%`, "--z": Math.round(slot.d * 10) } as CSSProperties}
          >
            <div data-cover-parallax data-depth={slot.d}>
              <div data-cover-float>
                <Link
                  href={capa.href}
                  aria-label={rotuloCapa(capa)}
                  className="group pointer-events-auto block rounded-card outline-none"
                  style={{
                    transform: `perspective(900px) translateZ(${Math.round(-240 * (1 - slot.d))}px) rotateY(${lado * 14}deg) rotateZ(${slot.r}deg)`,
                  }}
                >
                  <span
                    className="relative block aspect-[4/5] w-[clamp(7rem,10vw,11rem)] overflow-hidden rounded-card shadow-card transition-[transform,filter,opacity] duration-300 ease-out [filter:blur(var(--blur))] [opacity:var(--op)] group-hover:scale-110 group-hover:[filter:blur(0)] group-hover:[opacity:1] group-focus-visible:scale-110 group-focus-visible:[filter:blur(0)] group-focus-visible:[opacity:1] group-focus-visible:ring-2 group-focus-visible:ring-accent-hover"
                    style={
                      {
                        "--op": (0.5 + 0.5 * slot.d).toFixed(2),
                        "--blur": `${Math.max(0, (0.5 - slot.d) * 7).toFixed(1)}px`,
                      } as CSSProperties
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capa.imagemCapa}
                      alt=""
                      loading={i < 2 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      className="size-full object-cover"
                    />
                    <CapaLegenda capa={capa} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FaixaDeCapas({ capas }: { capas: CapaHero[] }) {
  return (
    <div className="pointer-events-auto -mx-4 mt-8 w-screen max-w-[100vw] overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:fine:hidden">
      <ul className="mx-auto flex w-max snap-x snap-mandatory gap-3">
        {capas.map((capa, i) => (
          <li key={capa.id} className="shrink-0 snap-start">
            <Link
              href={capa.href}
              aria-label={rotuloCapa(capa)}
              className="relative block aspect-[4/5] w-32 overflow-hidden rounded-card shadow-card outline-none focus-visible:ring-2 focus-visible:ring-accent-hover sm:w-36"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capa.imagemCapa}
                alt=""
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                className="size-full object-cover"
              />
              <CapaLegenda capa={capa} sempre />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TituloCulturama() {
  const profundidade = Array.from({ length: CAMADAS_TITULO }, (_, i) => CAMADAS_TITULO - i);

  return (
    <h1
      className="relative font-display text-[clamp(3.5rem,12vw,9rem)] font-bold leading-none tracking-[-0.05em]"
      style={{ perspective: "900px" }}
    >
      <span className="sr-only">Culturama</span>
      <span data-title-tilt className="relative inline-block" style={{ transformStyle: "preserve-3d" }} aria-hidden>
        {profundidade.map((i) => (
          <span
            key={i}
            className="absolute inset-0"
            style={{ color: corCamada(i), transform: `translate3d(${i * 0.5}px, ${i * 0.9}px, ${-i * 3}px)` }}
          >
            Culturama
          </span>
        ))}
        <span className="relative block text-on-dark" style={{ transform: "translateZ(1px)" }}>
          Culturama
          <span className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="hero-shine-window absolute inset-y-0 left-0 overflow-hidden motion-reduce:hidden">
              <span className="hero-shine-text block">Culturama</span>
            </span>
          </span>
        </span>
      </span>
    </h1>
  );
}

function LinhaDeApoio({ locais, reduce }: { locais: string[]; reduce: boolean }) {
  const alterna = locais.length >= 2;
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (!alterna || reduce) return;
    const id = window.setInterval(() => setIndice((v) => (v + 1) % locais.length), TROCA_LOCAL_MS);
    return () => window.clearInterval(id);
  }, [alterna, reduce, locais.length]);

  const opcoes = alterna ? locais : ["perto de você"];
  const atual = opcoes[reduce ? 0 : indice % opcoes.length];

  return (
    <>
      <p
        className="mt-5 font-display text-[clamp(1.25rem,2.5vw,2rem)] font-semibold leading-tight tracking-display"
        aria-hidden
      >
        O que está rolando {alterna ? "em " : ""}
        <span className="inline-grid overflow-hidden pb-[0.12em] text-left align-top">
          {opcoes.map((local) => (
            <span key={local} className="invisible col-start-1 row-start-1 whitespace-nowrap">
              {local}
            </span>
          ))}
          <AnimatePresence initial={false}>
            <motion.span
              key={atual}
              className="text-accent-gradient col-start-1 row-start-1 whitespace-nowrap"
              initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {atual}
            </motion.span>
          </AnimatePresence>
        </span>
      </p>
      <p className="sr-only">O que está rolando {alterna ? `em ${locais.join(", ")}` : "perto de você"}</p>
    </>
  );
}

function FaixaPatrocinadores({ nomes, reduce }: { nomes: string[]; reduce: boolean }) {
  const janelaRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const [cabe, setCabe] = useState(true);

  useEffect(() => {
    const janela = janelaRef.current;
    const lista = listaRef.current;
    if (!janela || !lista) return;
    const medir = () => setCabe(lista.scrollWidth <= janela.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(janela);
    return () => ro.disconnect();
  }, [nomes]);

  const marquee = !cabe && !reduce;
  const itens = (oculto: boolean) => (
    <ul
      ref={oculto ? undefined : listaRef}
      className={cn("flex shrink-0 items-center gap-10", marquee && "pr-10")}
      aria-hidden={oculto || undefined}
    >
      {nomes.map((nome) => (
        <li
          key={nome}
          className="whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-on-dark hover:text-on-dark"
        >
          {nome}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative z-10 border-t" style={{ borderColor: mix("var(--color-on-dark)", 10) }}>
      <div className="mx-auto flex max-w-page items-center gap-6 px-4 py-4">
        <span className="shrink-0 text-caption text-muted-on-dark">Apoio de</span>
        <p className="sr-only">{nomes.join(", ")}</p>
        <div
          ref={janelaRef}
          className={cn("min-w-0 flex-1 [scrollbar-width:none]", marquee ? "overflow-hidden" : "overflow-x-auto")}
          aria-hidden
        >
          <div
            className={cn("flex w-max", marquee && "hero-marquee-track hover:[animation-play-state:paused]")}
            style={marquee ? { animationDuration: `${Math.max(24, nomes.length * 6)}s` } : undefined}
          >
            {itens(false)}
            {marquee ? itens(true) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeHero({ nomes, capas, locais, patrocinadores }: HomeHeroProps) {
  const reduce = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [allowAurora, setAllowAurora] = useState(false);
  const auroraOn = useWebglSlot("hero-aurora", sectionRef, allowAurora);
  const capasHero = capas.slice(0, SLOTS_CAPAS.length);

  useEffect(() => {
    const query = window.matchMedia(MOTION_FINE);
    const update = () => setAllowAurora(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_FINE, () => {
      const tilt = section.querySelector<HTMLElement>("[data-title-tilt]");
      const girarY = tilt ? gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3.out" }) : null;
      const girarX = tilt ? gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3.out" }) : null;

      gsap.utils.toArray<HTMLElement>("[data-hero-names]", section).forEach((linha, i) => {
        gsap.to(linha, {
          y: (i % 2 ? 1 : -1) * (40 + i * 20),
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
        });
      });

      const parallax = gsap.utils.toArray<HTMLElement>("[data-cover-parallax]", section).map((el) => {
        const d = Number(el.dataset.depth ?? 0.5);
        return {
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
          ax: 10 + d * 40,
          ay: 8 + d * 28,
        };
      });

      gsap.utils.toArray<HTMLElement>("[data-cover-float]", section).forEach((el, i) => {
        gsap.to(el, {
          y: gsap.utils.random(-14, -6),
          rotation: gsap.utils.random(-2, 2),
          duration: gsap.utils.random(4, 7),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.35,
        });
      });

      const mover = (event: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        girarY?.(nx * 10);
        girarX?.(-ny * 10);
        for (const capa of parallax) {
          capa.x(-nx * capa.ax);
          capa.y(-ny * capa.ay);
        }
      };
      const soltar = () => {
        girarY?.(0);
        girarX?.(0);
        for (const capa of parallax) {
          capa.x(0);
          capa.y(0);
        }
      };

      section.addEventListener("mousemove", mover);
      section.addEventListener("mouseleave", soltar);
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        cancelAnimationFrame(raf);
        section.removeEventListener("mousemove", mover);
        section.removeEventListener("mouseleave", soltar);
      };
    });

    return () => mm.revert();
  }, [nomes.length, capasHero.length]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-dvh flex-col pt-16 overflow-hidden bg-surface-dark text-on-dark"
    >
      {auroraOn ? (
        <div className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen" aria-hidden>
          <Aurora
            colorStops={[visual.accentFrom, visual.accentTo, visual.accentFrom]}
            amplitude={1.05}
            blend={0.65}
            speed={0.7}
          />
        </div>
      ) : (
        <div className="hero-orbs pointer-events-none absolute inset-0" aria-hidden>
          <span className="hero-orb hero-orb-a" />
          <span className="hero-orb hero-orb-b" />
          <span className="hero-orb hero-orb-c" />
        </div>
      )}

      {nomes.length >= MIN_NOMES_FUNDO ? <NomesAoFundo nomes={nomes} /> : null}
      {nomes.length > 0 ? <p className="sr-only">Próximos eventos: {nomes.join(", ")}</p> : null}

      <div className="relative flex flex-1 flex-col">
        {capasHero.length > 0 ? <CapasFlutuantes capas={capasHero} /> : null}

        <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-20">
          <TituloCulturama />
          <LinhaDeApoio locais={locais} reduce={reduce} />
          <p className="mt-4 max-w-[38ch] text-[1.125rem] leading-relaxed" style={{ color: mix("var(--color-on-dark)", 85, "var(--color-muted-on-dark)") }}>
            Shows, teatro e rua. Compare carro, metrô e caminhada até o destino.
          </p>
          <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/mapa" className={cn(buttonVariants())}>
              Ver no mapa
            </Link>
            <Link
              href="/eventos"
              className={cn(buttonVariants({ variant: "outline" }))}
              style={{
                borderColor: mix("var(--color-on-dark)", 22),
                background: "transparent",
                color: "var(--color-on-dark)",
              }}
            >
              Ver lista
            </Link>
          </div>
          {capasHero.length > 0 ? <FaixaDeCapas capas={capasHero.slice(0, 4)} /> : null}
        </div>
      </div>

      {patrocinadores.length > 0 ? <FaixaPatrocinadores nomes={patrocinadores} reduce={reduce} /> : null}
    </section>
  );
}
