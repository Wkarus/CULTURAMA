"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Drama,
  MapPin,
  Mic,
  Music,
  Palette,
  PartyPopper,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";

/** Mesmas condições de `md:motion-safe:` no Tailwind. */
export const PIN_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

export type EventoTela = {
  id: string;
  titulo: string;
  categoria: string | null;
  quando: string;
  gratuito: boolean;
  imagemCapa: string | null;
};

export type TelaProps = {
  events: EventoTela[];
  active: boolean;
  animate: boolean;
};

const ICONES: Record<string, LucideIcon> = {
  musica: Music,
  teatro: Drama,
  exposicao: Palette,
  feira: Store,
  danca: Sparkles,
  festival: PartyPopper,
  standup: Mic,
};

export function iconeCategoria(categoria: string | null): LucideIcon {
  if (!categoria) return MapPin;
  const key = categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/gi, "")
    .toLowerCase();
  return ICONES[key] ?? MapPin;
}

type ScreenTimelineOptions = {
  active: boolean;
  animate: boolean;
  build: (tl: gsap.core.Timeline) => void;
  /** Volta o estado React ao início, antes de cada `restart`. */
  onReset?: () => void;
  /** Volta o estado React ao final quando a timeline é desmontada. */
  onRevert?: () => void;
};

/**
 * O markup de cada tela já é o estado final. `animate` só fica true enquanto o
 * `PIN_QUERY` casa (quem controla é a seção pai); fora disso a tela fica parada no final.
 */
export function useScreenTimeline<T extends HTMLElement>({
  active,
  animate,
  build,
  onReset,
  onRevert,
}: ScreenTimelineOptions) {
  const rootRef = useRef<T>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const latest = useRef({ active, build, onReset, onRevert });
  latest.current = { active, build, onReset, onRevert };

  useEffect(() => {
    const root = rootRef.current;
    if (!animate || !root) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      latest.current.build(tl);
      tlRef.current = tl;
    }, root);

    if (latest.current.active) {
      latest.current.onReset?.();
      tlRef.current?.restart();
    }

    return () => {
      tlRef.current = null;
      ctx.revert();
      latest.current.onRevert?.();
    };
  }, [animate]);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (active) {
      latest.current.onReset?.();
      tl.restart();
    } else {
      tl.pause();
    }
  }, [active]);

  return rootRef;
}

export function Ripple({ tone = "bg-on-dark" }: { tone?: string }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2">
      <span data-ripple className={`block size-full rounded-full opacity-0 ${tone}`} />
    </span>
  );
}

export function Capa({ src, className }: { src: string | null; className?: string }) {
  if (!src) return <span className={`block bg-accent-gradient ${className ?? ""}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`block object-cover ${className ?? ""}`} />;
}
