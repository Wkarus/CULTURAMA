import type { EventFonte, EventStatus, Prisma } from "@prisma/client";
import { haversineKm, hasValidCoords, parseCoord } from "@/lib/geo";

export type EventSearchParams = {
  q?: string;
  categoria?: string;
  de?: string;
  ate?: string;
  preco?: string;
  distancia?: string;
  lat?: string;
  lng?: string;
  /** "1": só eventos com Libras, audiodescrição ou espaço acessível. */
  acessivel?: string;
};

/** Raio do Perto de mim, ajustado pelo usuário no controle de arrastar. É o único limite geográfico da busca. */
export const RAIO_KM = { min: 1, max: 50, padrao: 10 } as const;

/** Raio válido do filtro, ou `null` quando ausente ou fora da faixa. */
export function raioDoFiltro(distancia: string | undefined): number | null {
  const km = Number(distancia);
  return Number.isInteger(km) && km >= RAIO_KM.min && km <= RAIO_KM.max ? km : null;
}

/** Centro e raio do Perto de mim, quando o usuário mandou a posição. */
function pertoDeMim(params: EventSearchParams): { lat: number; lng: number; km: number } | null {
  const km = raioDoFiltro(params.distancia);
  const lat = parseCoord(params.lat);
  const lng = parseCoord(params.lng);
  return km !== null && lat !== null && lng !== null ? { lat, lng, km } : null;
}

/** Caixa em volta do círculo, para o banco já trazer só o entorno; o corte exato é o haversine depois. */
function caixaDoRaio({ lat, lng, km }: { lat: number; lng: number; km: number }): Prisma.EventWhereInput {
  const dLat = km / 111;
  const dLng = km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return {
    latitude: { gte: lat - dLat, lte: lat + dLat },
    longitude: { gte: lng - dLng, lte: lng + dLng },
  };
}

function parseDateBound(raw: string | undefined, endOfDay: boolean): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const suffix = endOfDay ? "T23:59:59.999-03:00" : "T00:00:00.000-03:00";
  const date = new Date(`${raw}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function normalizeSearchParams(params: Record<string, string | string[] | undefined>): EventSearchParams {
  return {
    q: firstParam(params.q),
    categoria: firstParam(params.categoria),
    de: firstParam(params.de),
    ate: firstParam(params.ate),
    preco: firstParam(params.preco),
    distancia: firstParam(params.distancia),
    lat: firstParam(params.lat),
    lng: firstParam(params.lng),
    acessivel: firstParam(params.acessivel),
  };
}

/** `importado` fica no ar sem revisão; a equipe tira do ar pelo painel. */
export const STATUS_NO_AR = ["publicado", "importado"] as const satisfies readonly EventStatus[];

export function estaNoAr(status: EventStatus): boolean {
  return (STATUS_NO_AR as readonly EventStatus[]).includes(status);
}

/** Status para tirar do ar: evento importado vira `cancelado` (oculto), que a sincronização respeita. */
export function statusFora(fonte: EventFonte): EventStatus {
  return fonte === "interno" ? "rascunho" : "cancelado";
}

/** No ar e sem organizador suspenso. Eventos da equipe e das fontes externas não têm organizador. */
export const EVENTO_PUBLICO = {
  status: { in: [...STATUS_NO_AR] },
  NOT: {
    organizer: { is: { OR: [{ suspensoEm: { not: null } }, { user: { is: { suspensoEm: { not: null } } } }] } },
  },
} satisfies Prisma.EventWhereInput;

/** `categoriaIds` vem de `idsDaCategoria`: a mãe já chega expandida com as filhas. */
export function eventWhereFromParams(params: EventSearchParams, categoriaIds?: string[] | null): Prisma.EventWhereInput {
  const agora = new Date();
  const de = parseDateBound(params.de, false);
  const ate = parseDateBound(params.ate, true);
  const inicio = de && de > agora ? de : agora;
  const perto = pertoDeMim(params);

  return {
    ...EVENTO_PUBLICO,
    ...(categoriaIds ? { categoriaId: { in: categoriaIds } } : {}),
    ...(perto ? caixaDoRaio(perto) : {}),
    ...(params.preco === "gratuito" ? { gratuito: true } : params.preco === "pago" ? { gratuito: false } : {}),
    ...(params.acessivel === "1" ? { OR: [{ libras: true }, { audiodescricao: true }, { NOT: { acessibilidade: { isEmpty: true } } }] } : {}),
    dataHora: {
      gte: inicio,
      ...(ate ? { lte: ate } : {}),
    },
  };
}

export function filterPublishedEvents<T extends { latitude: number; longitude: number; gratuito: boolean }>(
  events: T[],
  params: EventSearchParams,
): T[] {
  const byPrice =
    params.preco === "gratuito"
      ? events.filter((event) => event.gratuito)
      : params.preco === "pago"
        ? events.filter((event) => !event.gratuito)
        : events;
  return filterByDistance(byPrice, params);
}

/** Busca livre por título, local ou categoria. `q` vazio não altera a lista. */
export function filtraBusca<T extends { titulo: string; endereco: string; category?: { nome: string; parent?: { nome: string } | null } | null }>(
  events: T[],
  q: string | undefined,
): T[] {
  const termo = (q ?? "").trim().toLocaleLowerCase("pt-BR");
  if (!termo) return events;
  return events.filter((event) =>
    [event.titulo, event.endereco, event.category?.nome, event.category?.parent?.nome]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(termo),
  );
}

function filterByDistance<T extends { latitude: number; longitude: number }>(
  events: T[],
  params: EventSearchParams,
): T[] {
  const perto = pertoDeMim(params);
  if (!perto) return events;

  return events.filter((event) => {
    if (!hasValidCoords(event.latitude, event.longitude)) return false;
    return haversineKm(perto, { lat: event.latitude, lng: event.longitude }) <= perto.km;
  });
}

export function toMapEvent(event: {
  id: string;
  titulo: string;
  endereco: string;
  latitude: number;
  longitude: number;
  fonte: string;
  dataHora: Date;
  gratuito: boolean;
  imagemCapa: string | null;
  category: { nome: string } | null;
}) {
  return {
    id: event.id,
    titulo: event.titulo,
    endereco: event.endereco,
    latitude: event.latitude,
    longitude: event.longitude,
    fonte: event.fonte,
    dataIso: event.dataHora.toISOString(),
    gratuito: event.gratuito,
    imagemCapa: event.imagemCapa,
    categoria: event.category?.nome ?? null,
  };
}

export type MapEventPin = ReturnType<typeof toMapEvent>;
