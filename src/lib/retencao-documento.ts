import type { StatusVerificacao } from "@prisma/client";

/**
 * LGPD, minimização: o arquivo de CPF/CNPJ só serve para a verificação. Depois da decisão da equipe
 * (ou da recusa automática) ele fica guardado por este prazo, para contestação, e então é apagado.
 * O número do documento continua, mascarado no painel, para impedir cadastro duplicado.
 */
export const RETENCAO_DOCUMENTO_DIAS = 30;

export function documentoVencido(
  organizer: { statusVerificacao: StatusVerificacao; dataVerificacao: Date | null; documentoUrl: string },
  agora = new Date(),
): boolean {
  if (!organizer.documentoUrl || organizer.statusVerificacao === "pendente" || !organizer.dataVerificacao) return false;
  return agora.getTime() - organizer.dataVerificacao.getTime() > RETENCAO_DOCUMENTO_DIAS * 24 * 60 * 60 * 1000;
}
