import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireRole } from "@/lib/admin";
import { itensDoPainel } from "@/lib/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin", "moderador"]);
  const itens = await itensDoPainel(user.tipo);

  return (
    <div className="min-h-dvh bg-surface-dark pt-16 text-on-dark">
      <div className="mx-auto grid max-w-page gap-6 px-4 py-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
        <AdminSidebar itens={itens} papel={user.tipo} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
