import type { EventStatus, RestricaoIdade } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const RESTRICOES: { value: RestricaoIdade; label: string }[] = [
  { value: "livre", label: "Livre" },
  { value: "doze", label: "12+" },
  { value: "quatorze", label: "14+" },
  { value: "dezesseis", label: "16+" },
  { value: "dezoito", label: "18+" },
];

export function labelRestricao(value: RestricaoIdade): string {
  return RESTRICOES.find((item) => item.value === value)?.label ?? value;
}

export function labelStatus(value: EventStatus): string {
  const map: Record<EventStatus, string> = {
    rascunho: "Rascunho",
    publicado: "Publicado",
    cancelado: "Cancelado",
    adiado: "Adiado",
  };
  return map[value];
}

export async function getOrganizerForUser(userId: string) {
  return prisma.organizer.findUnique({ where: { userId } });
}

export function podePublicar(statusVerificacao: string): boolean {
  return statusVerificacao === "aprovado";
}
