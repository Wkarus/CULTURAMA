"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  Flag,
  FolderTree,
  History,
  LayoutDashboard,
  Megaphone,
  Menu as MenuIcon,
  MessageSquareWarning,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { focoAdmin } from "@/components/admin/estilos";
import type { SecaoPainel } from "@/lib/admin-permissoes";
import type { ItemNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

const ICONES: Record<SecaoPainel, LucideIcon> = {
  "visao-geral": LayoutDashboard,
  revisao: ClipboardCheck,
  eventos: CalendarDays,
  categorias: FolderTree,
  organizadores: BadgeCheck,
  usuarios: Users,
  comentarios: MessageSquareWarning,
  denuncias: Flag,
  anuncios: Megaphone,
  historico: History,
};

function ativo(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Itens({ itens, onNavegar }: { itens: ItemNav[]; onNavegar?: () => void }) {
  const pathname = usePathname() ?? "";
  return (
    <ul className="grid gap-1">
      {itens.map((item) => {
        const Icone = ICONES[item.secao];
        const atual = ativo(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavegar}
              aria-current={atual ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors",
                atual
                  ? "bg-[color-mix(in_srgb,var(--color-on-dark)_9%,transparent)] text-on-dark"
                  : "text-muted-on-dark hover:bg-[color-mix(in_srgb,var(--color-on-dark)_5%,transparent)] hover:text-on-dark",
                focoAdmin,
              )}
            >
              {atual ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent-gradient" aria-hidden /> : null}
              <Icone className={cn("size-[18px] shrink-0", atual ? "text-accent-hover" : "")} strokeWidth={1.75} aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent-gradient px-1.5 text-[0.7rem] font-semibold tabular-nums text-on-dark">
                  {item.badge > 99 ? "99+" : item.badge}
                  <span className="sr-only"> pendentes</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar({ itens, papel }: { itens: ItemNav[]; papel: "admin" | "moderador" }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname() ?? "";
  const atual = itens.find((item) => ativo(pathname, item.href));
  const totalPendencias = itens.reduce((soma, item) => soma + (item.badge ?? 0), 0);
  const rotuloPapel = papel === "admin" ? "Admin" : "Moderação";

  return (
    <>
      <aside className="hidden lg:block" aria-label="Seções do painel">
        <div className="sticky top-20 grid gap-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-on-dark">{rotuloPapel}</p>
          <nav>
            <Itens itens={itens} />
          </nav>
        </div>
      </aside>

      <Dialog.Root open={aberto} onOpenChange={setAberto}>
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Dialog.Trigger
            className={cn(
              "chip-dark inline-flex h-10 items-center gap-2 rounded-pill pl-3 pr-4 text-sm font-medium text-on-dark",
              focoAdmin,
            )}
          >
            <MenuIcon className="size-4" aria-hidden />
            {atual?.label ?? "Seções"}
            {totalPendencias ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent-gradient px-1.5 text-[0.7rem] font-semibold tabular-nums">
                {totalPendencias > 99 ? "99+" : totalPendencias}
                <span className="sr-only"> pendências</span>
              </span>
            ) : null}
          </Dialog.Trigger>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-on-dark">{rotuloPapel}</span>
        </div>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--color-surface-dark)_75%,transparent)] backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
          <Dialog.Popup className="panel-dark fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col gap-6 overflow-y-auto p-4 text-on-dark shadow-card transition-transform duration-300 ease-out data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full motion-reduce:transition-none lg:hidden">
            <div className="flex items-center justify-between">
              <Dialog.Title className="px-3 font-display text-lg font-semibold tracking-display">Painel · {rotuloPapel}</Dialog.Title>
              <Dialog.Close aria-label="Fechar menu" className={cn("inline-flex size-10 items-center justify-center rounded-full", focoAdmin)}>
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <nav aria-label="Seções do painel">
              <Itens itens={itens} onNavegar={() => setAberto(false)} />
            </nav>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
