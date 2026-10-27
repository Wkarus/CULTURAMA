import type { EventFonte, EventStatus, RestricaoIdade } from "@prisma/client";
import { eventWhereFromParams } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

export const RESTRICOES: { value: RestricaoIdade; label: string }[] = [
  { value: "livre", label: "Livre" },
  { value: "doze", label: "12+" },
  { value: "quatorze", label: "14+" },
  { value: "dezesseis", label: "16+" },
  { value: "dezoito", label: "18+" },
];

const FUSO_EVENTO = "America/Sao_Paulo";

export type DataCard = { mes: string; dia: string; quando: string };

/** Bloco de data e linha "Sex, 22h" do card, sempre no horário de São Paulo. */
export function dataDoCard(date: Date): DataCard {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: FUSO_EVENTO,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((parte) => [parte.type, parte.value]),
  );
  const semanaBruta = (partes.weekday ?? "").replace(".", "");
  const semana = semanaBruta ? semanaBruta.charAt(0).toUpperCase() + semanaBruta.slice(1) : "";
  const minuto = partes.minute ?? "00";
  const horario = minuto === "00" ? `${Number(partes.hour)}h` : `${Number(partes.hour)}h${minuto}`;
  return {
    mes: (partes.month ?? "").replace(".", "").slice(0, 3).toUpperCase(),
    dia: partes.day ?? "",
    quando: `${semana}, ${horario}`,
  };
}

/** Selo do card: só 16+ e 18+. Livre, 12+ e 14+ ficam para a página do evento. */
export function seloRestricaoCard(value: RestricaoIdade): "16+" | "18+" | null {
  if (value === "dezoito") return "18+";
  if (value === "dezesseis") return "16+";
  return null;
}

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
    em_revisao: "Em revisão",
    importado: "Importado",
    inativo: "Inativo",
  };
  return map[value];
}

/** Selo curto do card (componente cliente: sem acesso à config das instâncias). */
export function seloDaFonte(fonte: EventFonte): string {
  if (fonte === "ticketmaster") return "via Ticketmaster";
  if (fonte === "mapas_culturais") return "via Mapas Culturais";
  return "Na rua";
}

/**
 * Vitrine da home: eventos com foto primeiro e, dentro de cada grupo, um de cada fonte e categoria por vez,
 * para a fileira não virar oito capas iguais da mesma fonte. A ordem por data se mantém dentro de cada combinação.
 * As fotos ocupam no máximo 3/4 dos lugares: quando só uma fonte tem foto, as outras ainda aparecem no fim.
 */
export function misturarVitrine<T extends { imagemCapa: string | null; fonte: string; categoriaId: string | null }>(
  events: T[],
  quantidade: number,
): T[] {
  const intercalar = (lista: T[]) => {
    const grupos = new Map<string, T[]>();
    for (const event of lista) {
      const chave = `${event.fonte}|${event.categoriaId ?? ""}`;
      grupos.set(chave, [...(grupos.get(chave) ?? []), event]);
    }
    const filas = [...grupos.values()];
    const saida: T[] = [];
    for (let i = 0; filas.some((fila) => i < fila.length); i++) {
      for (const fila of filas) if (i < fila.length) saida.push(fila[i]);
    }
    return saida;
  };
  const fotos = intercalar(events.filter((e) => e.imagemCapa));
  const primeiras = fotos.slice(0, Math.ceil(quantidade * 0.75));
  const resto = intercalar([...fotos.slice(primeiras.length), ...events.filter((e) => !e.imagemCapa)]);
  const outrasFontes = resto.filter((e) => !primeiras.some((p) => p.fonte === e.fonte));
  const mesmaFonte = resto.filter((e) => primeiras.some((p) => p.fonte === e.fonte));
  return [...primeiras, ...outrasFontes, ...mesmaFonte].slice(0, quantidade);
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
    .map((part) => part.replace(/\d{5}-?\d{3}/g, "").replace(/\s+-\s*[A-Z]{2}\s*$/, "").trim())
    .filter((part) => part && !/^[A-Z]{2}$/.test(part));
  return parts[parts.length - 1] ?? endereco.trim();
}

/** "Local · bairro" (ou cidade, quando a fonte não tem bairro). */
export function linhaDoLocal(event: { endereco: string; fonte: EventFonte }): string {
  const partes = event.endereco.split(",").map((parte) => parte.trim()).filter(Boolean);
  const nome = partes[0] ?? "";
  if (partes.length < 2 || nome === "Brasil") return nome === "Brasil" ? "" : nome;
  const extra = localDoEvento(event);
  if (!extra || extra.toLowerCase() === nome.toLowerCase()) return nome;
  return `${nome} · ${extra}`;
}

/** Bairro quando o endereço segue "…, 123 - Bairro, Cidade"; senão a cidade. Ticketmaster grava "Local, rua, Cidade, Estado". */
export function localDoEvento(event: { endereco: string; fonte: EventFonte }): string | null {
  const endereco = event.endereco.trim();
  const bairro = endereco.match(/,\s*\d+[A-Za-z]?\s*-\s*([^,]+?)\s*,/);
  if (bairro) return bairro[1];
  const parts = endereco
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (event.fonte === "ticketmaster" && parts.length >= 3) return parts[parts.length - 2];
  const cidade = cidadeDeEndereco(endereco);
  return cidade && cidade !== "Brasil" ? cidade : null;
}

/** Só a cidade ("Santo André", "São Paulo"), sem bairro. Ticketmaster grava "Local, rua, Cidade, Estado". */
export function cidadeDoEvento(event: { endereco: string; fonte: EventFonte }): string | null {
  const parts = event.endereco
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  // Só o nome do local ("MorumBis", "Cine Lido"): a fonte não disse a cidade.
  if (parts.length < 2) return null;
  const cidade = event.fonte === "ticketmaster" && parts.length >= 3 ? parts[parts.length - 2] : cidadeDeEndereco(event.endereco);
  return cidade && cidade !== "Brasil" ? cidade : null;
}

export async function capasDecorativas(quantidade = 3): Promise<{ id: string; imagemCapa: string }[]> {
  try {
    const events = await prisma.event.findMany({
      where: { ...eventWhereFromParams({}), imagemCapa: { not: null } },
      select: { id: true, titulo: true, imagemCapa: true },
      orderBy: { dataHora: "asc" },
      take: quantidade * 4,
    });
    return uniqueByCapa(events)
      .slice(0, quantidade)
      .flatMap((event) => (event.imagemCapa ? [{ id: event.id, imagemCapa: event.imagemCapa }] : []));
  } catch {
    return [];
  }
}

export async function getOrganizerForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nome: true, tipo: true, suspensoEm: true },
  });
  if (user?.tipo === "admin" && !user.suspensoEm) {
    const { garantirOrganizadorAdmin } = await import("@/lib/admin-email");
    return garantirOrganizadorAdmin(prisma, userId, user.nome);
  }
  return prisma.organizer.findUnique({ where: { userId }, include: { user: { select: { suspensoEm: true } } } });
}

export function podePublicar(statusVerificacao: string): boolean {
  return statusVerificacao === "aprovado";
}

/** Organizador em análise não publica direto, mas pode mandar o evento para a fila de revisão. */
export function podeEnviarParaRevisao(statusVerificacao: string): boolean {
  return statusVerificacao === "pendente";
}

export function botoesDoOrganizador(statusVerificacao: string): {
  intencoes: ("rascunho" | "publicar" | "revisao")[];
  aviso?: string;
} {
  if (podePublicar(statusVerificacao)) return { intencoes: ["rascunho", "publicar"] };
  if (podeEnviarParaRevisao(statusVerificacao)) {
    return {
      intencoes: ["rascunho", "revisao"],
      aviso: "Verificação pendente: salve como rascunho ou envie para a equipe revisar. Aprovado, o evento vai ao ar.",
    };
  }
  return { intencoes: ["rascunho"], aviso: "Seu cadastro de organizador não foi aprovado. Você pode guardar rascunhos." };
}
