"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { visual } from "@/lib/visual-tokens";
import { cn } from "@/lib/utils";

export type ModalCardData = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  gradientColor?: string;
  kicker?: string;
  href?: string;
  cta?: string;
  className?: string;
};

type AnimationSpeed = "slow" | "normal" | "fast" | "none";
type AnimationVariant = "scale" | "fade" | "slide";

const SPEED: Record<AnimationSpeed, number> = {
  slow: 0.55,
  normal: 0.38,
  fast: 0.22,
  none: 0,
};

export default function ModalCards({
  cards,
  className,
  gradientColor = visual.accentTo,
  animationSpeed = "normal",
  springStiffness,
  springDamping,
  animationVariant = "scale",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  ariaLabel = "Detalhe do passo",
  backdropGradientPosition = "50% 10%",
  modalClassName,
  backdropClassName,
}: {
  cards: ModalCardData[];
  className?: string;
  gradientColor?: string;
  animationSpeed?: AnimationSpeed;
  springStiffness?: number;
  springDamping?: number;
  animationVariant?: AnimationVariant;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  ariaLabel?: string;
  backdropGradientPosition?: string;
  modalClassName?: string;
  backdropClassName?: string;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const selected = cards.find((card) => card.id === selectedId) ?? null;
  const duration = reduce || animationSpeed === "none" ? 0 : SPEED[animationSpeed];
  const morph = !reduce && animationVariant === "scale" && duration > 0;
  const spring = {
    type: "spring" as const,
    stiffness: springStiffness ?? 420,
    damping: springDamping ?? 34,
    mass: 0.7,
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected || !closeOnEscape) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, closeOnEscape]);

  function close() {
    setSelectedId(null);
  }

  return (
    <>
      <ul className={cn("grid gap-4 md:grid-cols-12 md:grid-rows-2 md:gap-5", className)}>
        {cards.map((card, index) => {
          const color = card.gradientColor ?? gradientColor;
          const open = selectedId === card.id;
          return (
            <li
              key={card.id}
              className={cn(
                index === 0 && "md:col-span-5 md:row-span-2",
                index > 0 && "md:col-span-7",
                card.className,
              )}
            >
              <div className={cn("h-full min-h-[14rem]", index === 0 && "md:min-h-[28rem]")}>
                {open ? (
                  <div
                    className="h-full min-h-[14rem] rounded-card md:min-h-full"
                    style={{ backgroundColor: visual.surfaceDark, opacity: 0.22 }}
                    aria-hidden
                  />
                ) : (
                  <motion.button
                    type="button"
                    layoutId={morph ? `modal-card-${card.id}` : undefined}
                    onClick={() => setSelectedId(card.id)}
                    aria-haspopup="dialog"
                    className="group relative isolate flex h-full min-h-[14rem] w-full overflow-hidden rounded-card text-left shadow-card outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transform-none md:min-h-full"
                    style={{ backgroundColor: visual.surfaceDark, color: visual.onDark }}
                    whileTap={reduce ? undefined : { scale: 0.985 }}
                  >
                    <CardFace card={card} color={color} />
                  </motion.button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {selected ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
                  <motion.div
                    aria-hidden
                    className={cn("absolute inset-0", backdropClassName)}
                    style={{
                      background: `radial-gradient(circle at ${backdropGradientPosition}, ${hexToRgba(selected.gradientColor ?? gradientColor, 0.28)}, ${hexToRgba(visual.surfaceDark, 0.88)} 58%)`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration }}
                    onClick={() => {
                      if (closeOnBackdropClick) close();
                    }}
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label={ariaLabel}
                    aria-labelledby={titleId}
                    layoutId={morph ? `modal-card-${selected.id}` : undefined}
                    className={cn(
                      "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-card shadow-card",
                      modalClassName,
                    )}
                    style={{ backgroundColor: visual.surfaceDark, color: visual.onDark }}
                    initial={
                      morph || duration === 0
                        ? false
                        : animationVariant === "slide"
                          ? { opacity: 0, y: 28 }
                          : { opacity: 0, scale: 0.96 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      morph
                        ? undefined
                        : animationVariant === "slide"
                          ? { opacity: 0, y: 16 }
                          : { opacity: 0, scale: 0.98 }
                    }
                    transition={duration === 0 ? { duration: 0 } : spring}
                  >
                    <div className="relative min-h-[12rem] overflow-hidden sm:min-h-[14rem]">
                      <CardFace
                        card={selected}
                        color={selected.gradientColor ?? gradientColor}
                        large
                        showTitle={false}
                      />
                      {showCloseButton ? (
                        <button
                          ref={closeRef}
                          type="button"
                          onClick={close}
                          className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--color-surface-dark) 55%, transparent)",
                            color: visual.onDark,
                          }}
                          aria-label="Fechar"
                        >
                          <X className="size-4" strokeWidth={1.75} />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 px-6 py-6">
                      <p id={titleId} className="font-display text-2xl font-semibold leading-snug tracking-display">
                        {selected.title}
                      </p>
                      <p className="max-w-[42ch] text-body-lg" style={{ color: visual.mutedOnDark }}>
                        {selected.description}
                      </p>
                      {selected.href ? (
                        <Link href={selected.href} className={cn(buttonVariants(), "w-fit")} onClick={close}>
                          {selected.cta ?? "Abrir"}
                        </Link>
                      ) : null}
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

function CardFace({
  card,
  color,
  large = false,
  showTitle = true,
}: {
  card: ModalCardData;
  color: string;
  large?: boolean;
  showTitle?: boolean;
}) {
  return (
    <>
      {card.imageUrl ? (
        <Image
          src={card.imageUrl}
          alt=""
          fill
          className="pointer-events-none object-cover"
          sizes="(min-width: 768px) 40vw, 100vw"
          unoptimized
        />
      ) : null}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: card.imageUrl
            ? `linear-gradient(180deg, transparent 20%, ${hexToRgba(visual.surfaceDark, 0.88)} 100%)`
            : `radial-gradient(120% 80% at 80% -10%, ${hexToRgba(color, 0.55)}, transparent 58%), radial-gradient(90% 70% at 0% 110%, ${hexToRgba(visual.accentFrom, 0.28)}, transparent 50%)`,
        }}
        aria-hidden
      />
      <span className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-6">
        {card.kicker ? (
          <span
            className={cn(
              "font-display font-bold leading-none tracking-display opacity-40",
              large ? "text-6xl" : "text-5xl md:text-6xl",
            )}
          >
            {card.kicker}
          </span>
        ) : (
          <span />
        )}
        {showTitle ? (
          <span
            className={cn(
              "font-display font-semibold leading-snug tracking-display",
              large ? "text-2xl" : "text-xl md:text-2xl",
            )}
          >
            {card.title}
          </span>
        ) : (
          <span />
        )}
      </span>
    </>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
