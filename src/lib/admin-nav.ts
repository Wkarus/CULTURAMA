import { podeAcessar, type PapelPainel, type SecaoPainel } from "@/lib/admin-permissoes";
import { prisma } from "@/lib/prisma";

export type ItemNav = { href: string; label: string; secao: SecaoPainel; badge?: number };

const ITENS: Omit<ItemNav, "badge">[] = [
  { href: "/admin", label: "Visão geral", secao: "visao-geral" },
  { href: "/admin/revisao", label: "Revisão", secao: "revisao" },
  { href: "/admin/eventos", label: "Eventos", secao: "eventos" },
  { href: "/admin/categorias", label: "Categorias", secao: "categorias" },
  { href: "/admin/organizadores", label: "Organizadores", secao: "organizadores" },
  { href: "/admin/usuarios", label: "Usuários", secao: "usuarios" },
  { href: "/admin/denuncias", label: "Denúncias", secao: "denuncias" },
  { href: "/admin/comentarios", label: "Comentários", secao: "comentarios" },
  { href: "/admin/anuncios", label: "Anúncios", secao: "anuncios" },
  { href: "/admin/historico", label: "Histórico", secao: "historico" },
];

export async function contarPendencias() {
  const [revisao, organizadores, comentarios, denuncias] = await Promise.all([
    prisma.event.count({ where: { status: "em_revisao" } }),
    prisma.organizer.count({ where: { statusVerificacao: "pendente" } }),
    prisma.comment.count({ where: { oculto: false, denuncias: { some: { status: "aberta" } } } }),
    prisma.denuncia.count({ where: { status: "aberta" } }),
  ]);
  return { revisao, organizadores, comentarios, denuncias };
}

export async function itensDoPainel(papel: PapelPainel): Promise<ItemNav[]> {
  const pendencias = await contarPendencias();
  const badges: Partial<Record<SecaoPainel, number>> = {
    revisao: pendencias.revisao,
    organizadores: pendencias.organizadores,
    comentarios: pendencias.comentarios,
    denuncias: pendencias.denuncias,
  };
  return ITENS.filter((item) => podeAcessar(papel, item.secao)).map((item) => ({ ...item, badge: badges[item.secao] }));
}
