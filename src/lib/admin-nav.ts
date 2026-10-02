import { podeAcessar, type PapelPainel, type SecaoPainel } from "@/lib/admin-permissoes";
import { prisma } from "@/lib/prisma";

export type ItemNav = { href: string; label: string; secao: SecaoPainel; badge?: number };

const ITENS: Omit<ItemNav, "badge">[] = [
  { href: "/admin", label: "Visão geral", secao: "visao-geral" },
  { href: "/admin/eventos", label: "Eventos", secao: "eventos" },
  { href: "/admin/organizadores", label: "Organizadores", secao: "organizadores" },
  { href: "/admin/comentarios", label: "Comentários", secao: "comentarios" },
  { href: "/admin/anuncios", label: "Anúncios", secao: "anuncios" },
  { href: "/admin/historico", label: "Histórico", secao: "historico" },
];

export async function contarPendencias() {
  const [organizadores, comentarios] = await Promise.all([
    prisma.organizer.count({ where: { statusVerificacao: "pendente" } }),
    prisma.comment.count({ where: { oculto: false, reports: { some: {} } } }),
  ]);
  return { organizadores, comentarios };
}

export async function itensDoPainel(papel: PapelPainel): Promise<ItemNav[]> {
  const pendencias = await contarPendencias();
  const badges: Partial<Record<SecaoPainel, number>> = {
    organizadores: pendencias.organizadores,
    comentarios: pendencias.comentarios,
  };
  return ITENS.filter((item) => podeAcessar(papel, item.secao)).map((item) => ({ ...item, badge: badges[item.secao] }));
}
