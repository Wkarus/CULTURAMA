"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Compartilhar do próprio Culturama: o link é sempre o da nossa página, nunca o da fonte.
 * No celular abre a folha de compartilhar do sistema; no computador, WhatsApp e copiar link.
 */
export function CompartilharEvento({ titulo, caminho }: { titulo: string; caminho: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = () => new URL(caminho, window.location.origin).toString();

  async function compartilhar() {
    if (navigator.share) {
      await navigator.share({ title: titulo, text: `${titulo} no Culturama`, url: url() }).catch(() => undefined);
      return;
    }
    copiar();
  }

  async function copiar() {
    await navigator.clipboard?.writeText(url()).catch(() => undefined);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${titulo} no Culturama: ${url()}`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-2">
      <p className="text-caption text-muted-foreground">Compartilhar</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={compartilhar} className={cn(buttonVariants({ variant: "outline" }), "gap-2 md:hidden")}>
          <Share2 className="size-4" aria-hidden />
          Compartilhar
        </button>
        <button type="button" onClick={whatsapp} className={cn(buttonVariants({ variant: "outline" }), "hidden gap-2 md:inline-flex")}>
          <Share2 className="size-4" aria-hidden />
          WhatsApp
        </button>
        <button type="button" onClick={copiar} className={cn(buttonVariants({ variant: "outline" }), "gap-2")} aria-live="polite">
          {copiado ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
          {copiado ? "Link copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
