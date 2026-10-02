import type { Prisma } from "@prisma/client";
import type { UsuarioPainel } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const ACOES_LOG = {
  "evento.moderar": "Moderou evento",
  "organizador.decidir": "Decidiu organizador",
  "anuncio.criar": "Criou anúncio",
  "anuncio.editar": "Editou anúncio",
  "anuncio.alternar": "Ativou/pausou anúncio",
  "comentario.ocultar": "Ocultou comentário",
} as const;

export type AcaoLog = keyof typeof ACOES_LOG;

export type AlvoLog = "evento" | "organizador" | "anuncio" | "comentario" | "usuario" | "categoria" | "denuncia" | "sistema";

export function rotuloAcao(acao: string): string {
  return acao in ACOES_LOG ? ACOES_LOG[acao as AcaoLog] : acao;
}

export async function registrarLog(
  autor: Pick<UsuarioPainel, "id" | "nome">,
  acao: AcaoLog,
  alvoTipo: AlvoLog,
  alvoId: string | null,
  detalhes?: Prisma.InputJsonObject,
) {
  await prisma.adminLog.create({
    data: { autorId: autor.id, autorNome: autor.nome, acao, alvoTipo, alvoId, detalhes },
  });
}
