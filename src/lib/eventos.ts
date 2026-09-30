import type { EventStatus, RestricaoIdade } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const RESTRICOES: { value: RestricaoIdade; label: string }[] = [
  { value: "livre", label: "Livre" },
  { value: "doze", label: "12+" },
  { value: "quatorze", label: "14+" },
  { value: "dezesseis", label: "16+" },
  { value: "dezoito", label: "18+" },
];

export function formatEventoQuando(date: Date): string {
  return date.toLocaleString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEventoCurto(date: Date): string {
  const dia = date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  const hora = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia.replace(/\./g, "")} · ${hora}`;
}

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

export function uniqueByCapa<T extends { titulo: string; imagemCapa: string | null }>(events: T[]): T[] {
  const seenTitle = new Set<string>();
  const seenImage = new Set<string>();
  const unique: T[] = [];

  for (const event of events) {
    const titleKey = event.titulo.trim().toLowerCase();
    const imageKey = event.imagemCapa?.split("?")[0]?.trim() ?? "";
    if (seenTitle.has(titleKey)) continue;
    if (imageKey && seenImage.has(imageKey)) continue;
    seenTitle.add(titleKey);
    if (imageKey) seenImage.add(imageKey);
    unique.push(event);
  }

  return unique;
}

export function nomeCurtoEvento(titulo: string, max = 32): string {
  const base = titulo.split("|")[0].split(" - ")[0].trim();
  if (base.length <= max) return base;
  const cut = base.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > 12 ? cut.slice(0, space) : cut).trim();
}

export function cidadeDeEndereco(endereco: string): string {
  const parts = endereco
    .split(",")
    .map((part) => part.replace(/\d{5}-?\d{3}/g, "").replace(/\s*-?\s*[A-Z]{2}\s*$/i, "").trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? endereco.trim();
}

export async function getOrganizerForUser(userId: string) {
  return prisma.organizer.findUnique({ where: { userId } });
}

export function podePublicar(statusVerificacao: string): boolean {
  return statusVerificacao === "aprovado";
}
