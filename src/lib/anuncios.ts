import type { AdSlotTipo, Prisma } from "@prisma/client";

/** Ativo e dentro do período. */
export function anuncioNoAr(agora: Date, tipo?: AdSlotTipo): Prisma.AdSlotWhereInput {
  return { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora }, ...(tipo ? { tipo } : {}) };
}

export function hrefDoAnuncio(id: string): string {
  return `/api/anuncios/${id}`;
}

/** Só redireciona para http(s); qualquer outra coisa vira null. */
export function linkSeguro(link: string): string | null {
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function calcularCtr(exibicoes: number, cliques: number): number | null {
  return exibicoes > 0 ? cliques / exibicoes : null;
}

export function formatarCtr(exibicoes: number, cliques: number): string {
  const ctr = calcularCtr(exibicoes, cliques);
  if (ctr === null) return "—";
  return `${(ctr * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

const ROBO = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;

/** Robôs e prefetch do Next não contam exibição. */
export function contaComoExibicao(cabecalhos: Headers): boolean {
  if (cabecalhos.get("next-router-prefetch") || cabecalhos.get("purpose") === "prefetch") return false;
  return !ROBO.test(cabecalhos.get("user-agent") ?? "");
}

export type StatusAnuncio = "no_ar" | "agendado" | "encerrado" | "pausado";

export function statusDoAnuncio(slot: { ativo: boolean; dataInicio: Date; dataFim: Date }, agora: Date): StatusAnuncio {
  if (slot.dataFim < agora) return "encerrado";
  if (!slot.ativo) return "pausado";
  return slot.dataInicio > agora ? "agendado" : "no_ar";
}
