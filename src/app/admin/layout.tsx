import Link from "next/link";
import { requireRole } from "@/lib/admin";
import { podeAcessar, type SecaoPainel } from "@/lib/admin-permissoes";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; secao: SecaoPainel }[] = [
  { href: "/admin", label: "Visão geral", secao: "visao-geral" },
  { href: "/admin/eventos", label: "Eventos", secao: "eventos" },
  { href: "/admin/organizadores", label: "Organizadores", secao: "organizadores" },
  { href: "/admin/anuncios", label: "Anúncios", secao: "anuncios" },
  { href: "/admin/comentarios", label: "Comentários", secao: "comentarios" },
  { href: "/admin/historico", label: "Histórico", secao: "historico" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin", "moderador"]);

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <p className="text-sm text-muted-foreground">Painel interno · {user.tipo === "admin" ? "Admin" : "Moderação"}</p>
      <h1 className="mt-1 text-2xl font-medium tracking-display">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-2">
        {links
          .filter((link) => podeAcessar(user.tipo, link.secao))
          .map((link) => (
            <Link key={link.href} href={link.href} className={cn("rounded-pill bg-card px-3 py-1.5 text-sm shadow-card")}>
              {link.label}
            </Link>
          ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
