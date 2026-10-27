import { corDaCategoria } from "@/lib/busca-eventos";
import { CATEGORIAS_ARVORE } from "@/lib/categorias-dados";
import { iconeLucide } from "@/lib/perfil";
import { cn } from "@/lib/utils";

/** Mãe da categoria pela taxonomia fixa: a cor vem sempre da mãe, como nos blocos da página Eventos. */
function slugDaMae(slug: string | undefined): string {
  if (!slug) return "outros";
  const mae = CATEGORIAS_ARVORE.find((m) => m.slug === slug || m.filhas.some((f) => f.slug === slug));
  return mae?.slug ?? "outros";
}

/** Capa de evento sem imagem: cor e ícone da categoria, no mesmo desenho dos blocos de /eventos. */
export function CapaCategoria({
  categoria,
  rotulo = false,
  className,
}: {
  categoria: { slug: string; nome: string; icone?: string | null } | null;
  /** Mostra o nome da categoria no canto (página do evento); o card já tem a categoria abaixo da capa. */
  rotulo?: boolean;
  className?: string;
}) {
  const Icone = iconeLucide(categoria?.icone);
  return (
    <div
      className={cn("relative size-full overflow-hidden", className)}
      style={{ backgroundColor: corDaCategoria(slugDaMae(categoria?.slug)) }}
      aria-hidden={!rotulo}
    >
      <Icone
        className="pointer-events-none absolute -bottom-[12%] -right-[8%] size-[70%] rotate-[18deg] text-[color-mix(in_srgb,var(--color-on-dark)_82%,transparent)]"
        strokeWidth={1.1}
        aria-hidden
      />
      {rotulo ? (
        <p className="absolute bottom-0 left-0 p-6 font-display text-display text-on-dark">{categoria?.nome ?? "Evento"}</p>
      ) : null}
    </div>
  );
}
