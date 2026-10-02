import type { DenunciaMotivo, DenunciaStatus } from "@prisma/client";

export const MOTIVOS_DENUNCIA: Record<DenunciaMotivo, string> = {
  falso: "Informação falsa",
  improprio: "Conteúdo impróprio",
  ja_aconteceu: "Já aconteceu",
  outro: "Outro motivo",
};

export const STATUS_DENUNCIA: Record<DenunciaStatus, string> = {
  aberta: "Aberta",
  descartada: "Descartada",
  resolvida: "Resolvida",
};

export type ResolucaoDenuncia = "descartar" | "despublicar" | "remover_comentario";

export const ROTULO_RESOLUCAO: Record<ResolucaoDenuncia, string> = {
  descartar: "Descartada",
  despublicar: "Evento despublicado",
  remover_comentario: "Comentário removido",
};

export function ehMotivoDenuncia(valor: string): valor is DenunciaMotivo {
  return valor in MOTIVOS_DENUNCIA;
}

/** Valida o que vem do formulário de denúncia. "Outro" exige texto. */
export function lerDenuncia(formData: FormData): { motivo: DenunciaMotivo; texto: string | null } | { error: string } {
  const motivo = String(formData.get("motivo") ?? "");
  const texto = String(formData.get("texto") ?? "").trim().slice(0, 500) || null;
  if (!ehMotivoDenuncia(motivo)) return { error: "Escolha o motivo da denúncia." };
  if (motivo === "outro" && (!texto || texto.length < 3)) return { error: "Conte em poucas palavras o que está errado." };
  return { motivo, texto };
}
