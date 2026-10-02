import type { Prisma } from "@prisma/client";
import type { UsuarioPainel } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const ACOES_LOG = {
  "evento.moderar": "Moderou evento",
  "evento.criar": "Criou evento",
  "evento.editar": "Editou evento",
  "evento.publicar": "Publicou evento",
  "evento.despublicar": "Despublicou evento",
  "evento.destacar": "Mudou destaque na home",
  "evento.excluir": "Excluiu evento",
  "revisao.aprovar": "Aprovou na revisão",
  "revisao.recusar": "Recusou na revisão",
  "revisao.ajuste": "Pediu ajuste na revisão",
  "categoria.criar": "Criou categoria",
  "categoria.editar": "Editou categoria",
  "categoria.reordenar": "Reordenou categoria",
  "categoria.excluir": "Excluiu categoria",
  "organizador.decidir": "Decidiu organizador",
  "organizador.suspender": "Suspendeu organizador",
  "organizador.reativar": "Reativou organizador",
  "usuario.suspender": "Suspendeu usuário",
  "usuario.reativar": "Reativou usuário",
  "usuario.papel": "Mudou papel de usuário",
  "usuario.excluir": "Excluiu conta e dados (LGPD)",
  "anuncio.criar": "Criou anúncio",
  "anuncio.editar": "Editou anúncio",
  "anuncio.alternar": "Ativou/pausou anúncio",
  "comentario.ocultar": "Ocultou comentário",
  "denuncia.descartar": "Descartou denúncia",
  "denuncia.despublicar": "Despublicou evento por denúncia",
  "denuncia.remover_comentario": "Removeu comentário por denúncia",
  "ticketmaster.sincronizar": "Sincronizou Ticketmaster",
} as const;

export type AcaoLog = keyof typeof ACOES_LOG;

export type AlvoLog = "evento" | "organizador" | "anuncio" | "comentario" | "usuario" | "categoria" | "denuncia" | "sistema";

export const AUTOR_CRON = "Sistema (cron)";

export function rotuloAcao(acao: string): string {
  return acao in ACOES_LOG ? ACOES_LOG[acao as AcaoLog] : acao;
}

/** `autor` nulo = ação automática (cron). */
export async function registrarLog(
  autor: Pick<UsuarioPainel, "id" | "nome"> | null,
  acao: AcaoLog,
  alvoTipo: AlvoLog,
  alvoId: string | null,
  detalhes?: Prisma.InputJsonObject,
) {
  await prisma.adminLog.create({
    data: { autorId: autor?.id ?? null, autorNome: autor?.nome ?? AUTOR_CRON, acao, alvoTipo, alvoId, detalhes },
  });
}
