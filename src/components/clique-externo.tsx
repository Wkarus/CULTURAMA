"use client";

import type { ReactNode } from "react";
import { registrarClique } from "@/actions/insights";

export function CliqueExterno({
  href,
  eventoId,
  tipo,
  className,
  children,
}: {
  href: string;
  eventoId: string;
  tipo: "como_chegar" | "ingresso";
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => {
        void registrarClique(eventoId, tipo);
      }}
    >
      {children}
    </a>
  );
}
