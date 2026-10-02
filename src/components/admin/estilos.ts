import { cn } from "@/lib/utils";

export const focoAdmin =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

export const campoAdmin = "auth-field h-10 w-full min-w-0 rounded-control px-3 text-sm";

export const areaAdmin = "auth-field w-full rounded-control px-3 py-2 text-sm";

export const rotuloAdmin = "grid gap-1.5 text-sm font-medium text-on-dark";

export const dicaAdmin = "text-xs font-normal text-muted-on-dark";

type Variante = "primario" | "secundario" | "perigo" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-accent-gradient text-on-dark shadow-cta hover:brightness-110",
  secundario: "chip-dark text-on-dark hover:bg-[color-mix(in_srgb,var(--color-on-dark)_14%,transparent)]",
  perigo:
    "border border-[color-mix(in_srgb,var(--color-danger-fg)_45%,transparent)] text-danger hover:bg-[color-mix(in_srgb,var(--color-danger-fg)_12%,transparent)]",
  fantasma: "text-muted-on-dark hover:bg-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] hover:text-on-dark",
};

export function botaoAdmin(variante: Variante = "primario", tamanho: "md" | "sm" = "md") {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-pill font-medium transition disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    tamanho === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-[0.8rem]",
    VARIANTES[variante],
    focoAdmin,
  );
}

export const painelAdmin = "panel-dark rounded-card shadow-card";
