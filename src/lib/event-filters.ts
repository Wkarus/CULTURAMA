import type { Prisma } from "@prisma/client";
import { haversineKm, hasValidCoords, parseCoord } from "@/lib/geo";

export type EventSearchParams = {
  categoria?: string;
  de?: string;
  ate?: string;
  preco?: string;
  distancia?: string;
  lat?: string;
  lng?: string;
};

export const DISTANCIAS_KM = [5, 10, 25, 50] as const;

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
    categoria: firstParam(params.categoria),
    de: firstParam(params.de),
    ate: firstParam(params.ate),
    preco: firstParam(params.preco),
    distancia: firstParam(params.distancia),
    lat: firstParam(params.lat),
    lng: firstParam(params.lng),
  };
}

export function eventWhereFromParams(params: EventSearchParams): Prisma.EventWhereInput {
  const agora = new Date();
  const de = parseDateBound(params.de, false);
  const ate = parseDateBound(params.ate, true);
  const inicio = de && de > agora ? de : agora;

  return {
    status: "publicado",
    ...(params.categoria ? { categoriaId: params.categoria } : {}),
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

function filterByDistance<T extends { latitude: number; longitude: number }>(
  events: T[],
  params: EventSearchParams,
): T[] {
  const km = Number(params.distancia);
  const lat = parseCoord(params.lat);
  const lng = parseCoord(params.lng);
  if (lat === null || lng === null || !DISTANCIAS_KM.includes(km as (typeof DISTANCIAS_KM)[number])) {
    return events;
  }

  return events.filter((event) => {
    if (!hasValidCoords(event.latitude, event.longitude)) return false;
    return haversineKm({ lat, lng }, { lat: event.latitude, lng: event.longitude }) <= km;
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
