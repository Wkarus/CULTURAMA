"use client";

import { useRef, type CSSProperties, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(236, 72, 153, 0.28)",
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);

  function setSpot(x: number, y: number, opacity: number) {
    const el = divRef.current;
    if (!el) return;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
    el.style.setProperty("--spot-o", String(opacity));
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpot(event.clientX - rect.left, event.clientY - rect.top, 0.7);
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpot(rect.width / 2, rect.height / 2, 0.7);
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSpot(0, 0, 0)}
      onFocus={handleFocus}
      onBlur={() => setSpot(0, 0, 0)}
      className={cn("relative overflow-hidden rounded-card", className)}
      style={
        {
          "--spot-x": "0px",
          "--spot-y": "0px",
          "--spot-o": "0",
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ease-out motion-reduce:hidden"
        style={{
          opacity: "var(--spot-o)",
          background: `radial-gradient(circle at var(--spot-x) var(--spot-y), ${spotlightColor}, transparent 72%)`,
        }}
      />
      {children}
    </div>
  );
}
