"use client";

import { useEffect } from "react";
import { registrarClique } from "@/actions/insights";

export function RegistrarVisualizacao({ eventoId }: { eventoId: string }) {
  useEffect(() => {
    void registrarClique(eventoId, "visualizacao");
  }, [eventoId]);
  return null;
}
