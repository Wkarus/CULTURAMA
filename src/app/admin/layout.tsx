import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/organizadores", label: "Organizadores" },
  { href: "/admin/anuncios", label: "Anúncios" },
  { href: "/admin/comentarios", label: "Comentários" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <p className="text-sm text-muted-foreground">Painel interno</p>
      <h1 className="mt-1 text-2xl font-medium tracking-display">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={cn("rounded-pill bg-card px-3 py-1.5 text-sm shadow-card")}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
