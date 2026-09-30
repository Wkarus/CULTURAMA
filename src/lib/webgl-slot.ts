"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

/**
 * Uma única "vaga" de WebGL na página: fica com a seção que tem mais pixels visíveis.
 * Quem perde a vaga deve desmontar o canvas (e com ele o contexto).
 */
const visivel = new Map<string, number>();
const ouvintes = new Set<() => void>();
let dono: string | null = null;

function recalcular() {
  let melhor: string | null = null;
  let maior = 0;
  visivel.forEach((altura, id) => {
    if (altura > maior) {
      maior = altura;
      melhor = id;
    }
  });
  if (melhor !== dono) {
    dono = melhor;
    ouvintes.forEach((ouvinte) => ouvinte());
  }
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

const LIMIARES = Array.from({ length: 21 }, (_, i) => i / 20);

export function useWebglSlot(id: string, ref: RefObject<Element>, enabled: boolean): boolean {
  const souDono = useSyncExternalStore(
    assinar,
    () => dono === id,
    () => false,
  );

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visivel.set(id, entry.isIntersecting ? entry.intersectionRect.height : 0);
        recalcular();
      },
      { threshold: LIMIARES },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      visivel.delete(id);
      recalcular();
    };
  }, [id, ref, enabled]);

  return enabled && souDono;
}
