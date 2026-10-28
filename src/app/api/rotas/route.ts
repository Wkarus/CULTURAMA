import { NextResponse } from "next/server";
import { z } from "zod";
import { isRotaOk, stripHtmlInstrucao, type ModoRota, type PassoRota, type RotaModo } from "@/lib/directions";
import { EVENTO_PUBLICO } from "@/lib/event-filters";
import { hasValidCoords } from "@/lib/geo";
import { ipDe, registrarTentativa } from "@/lib/limite";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  eventId: z.string().min(1),
  originLat: z.number().gte(-90).lte(90),
  originLng: z.number().gte(-180).lte(180),
});

const MODOS: { id: ModoRota; label: string }[] = [
  { id: "driving", label: "Carro" },
  { id: "transit", label: "Ônibus e metrô" },
  { id: "walking", label: "A pé" },
];

type GoogleLatLng = { lat?: number; lng?: number };

type GoogleStep = {
  html_instructions?: string;
  distance?: { text?: string };
  duration?: { text?: string };
  travel_mode?: string;
  steps?: GoogleStep[];
  transit_details?: {
    headsign?: string;
    num_stops?: number;
    arrival_stop?: { name?: string };
    departure_stop?: { name?: string };
    line?: { short_name?: string; name?: string; vehicle?: { name?: string; type?: string } };
  };
};

type GoogleDirections = {
  status?: string;
  routes?: {
    overview_polyline?: { points?: string };
    bounds?: { northeast?: GoogleLatLng; southwest?: GoogleLatLng };
    legs?: {
      duration?: { text?: string };
      distance?: { text?: string };
      start_address?: string;
      end_address?: string;
      start_location?: GoogleLatLng;
      end_location?: GoogleLatLng;
      steps?: GoogleStep[];
    }[];
  }[];
};

function passoDeStep(step: GoogleStep): PassoRota {
  const transit = step.transit_details;
  let instrucao = stripHtmlInstrucao(step.html_instructions ?? "");
  if (transit) {
    const veiculo = transit.line?.vehicle?.name;
    const linha = transit.line?.short_name || transit.line?.name;
    const ate = transit.arrival_stop?.name;
    const montada = [veiculo, linha].filter(Boolean).join(" ");
    if (montada) {
      instrucao = ate ? `${montada} até ${ate}` : montada;
    }
  }
  return {
    instrucao: instrucao || "Siga em frente",
    distancia: step.distance?.text ?? "",
    duracao: step.duration?.text ?? "",
  };
}

function achatarPassos(steps: GoogleStep[] | undefined): PassoRota[] {
  const saida: PassoRota[] = [];
  for (const step of steps ?? []) {
    if (step.steps?.length) {
      saida.push(...achatarPassos(step.steps));
    } else {
      saida.push(passoDeStep(step));
    }
  }
  return saida.slice(0, 48);
}

async function fetchModo(key: string, origin: string, destination: string, mode: ModoRota): Promise<RotaModo> {
  const label = MODOS.find((item) => item.id === mode)?.label ?? mode;
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("mode", mode);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("key", key);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return { modo: mode, label, erro: "A rota não respondeu agora." };
  }

  const payload = (await response.json()) as GoogleDirections;
  const route = payload.routes?.[0];
  const leg = route?.legs?.[0];
  const polyline = route?.overview_polyline?.points;
  const ne = route?.bounds?.northeast;
  const sw = route?.bounds?.southwest;

  if (
    payload.status !== "OK" ||
    !leg?.duration?.text ||
    !leg.distance?.text ||
    !polyline ||
    ne?.lat === undefined ||
    ne.lng === undefined ||
    sw?.lat === undefined ||
    sw.lng === undefined
  ) {
    return { modo: mode, label, erro: mode === "transit" ? "Sem linha pública nesta origem." : "Sem rota neste modal." };
  }

  return {
    modo: mode,
    label,
    duracao: leg.duration.text,
    distancia: leg.distance.text,
    polyline,
    bounds: { north: ne.lat, east: ne.lng, south: sw.lat, west: sw.lng },
    origem: {
      lat: leg.start_location?.lat ?? 0,
      lng: leg.start_location?.lng ?? 0,
      endereco: leg.start_address ?? "Você",
    },
    destino: {
      lat: leg.end_location?.lat ?? 0,
      lng: leg.end_location?.lng ?? 0,
      endereco: leg.end_address ?? "Evento",
    },
    passos: achatarPassos(leg.steps),
  };
}

export async function POST(request: Request) {
  const key = (process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)?.trim();
  if (!key) {
    return NextResponse.json({ error: "Defina GOOGLE_MAPS_API_KEY ou NEXT_PUBLIC_GOOGLE_MAPS_API_KEY." }, { status: 503 });
  }

  if (!(await registrarTentativa("rota", ipDe(request.headers)))) {
    return NextResponse.json({ error: "Muitas rotas pedidas em pouco tempo. Tente de novo daqui a pouco." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Origem ou evento inválidos." }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id: parsed.data.eventId, ...EVENTO_PUBLICO },
    select: { latitude: true, longitude: true },
  });
  if (!event || !hasValidCoords(event.latitude, event.longitude)) {
    return NextResponse.json({ error: "Este evento não tem coordenada para rota." }, { status: 404 });
  }

  const origin = `${parsed.data.originLat},${parsed.data.originLng}`;
  const destination = `${event.latitude},${event.longitude}`;
  const modos = await Promise.all(MODOS.map((modo) => fetchModo(key, origin, destination, modo.id)));

  if (!modos.some(isRotaOk)) {
    return NextResponse.json({ error: "Não achei rota a partir da sua posição." }, { status: 422 });
  }

  return NextResponse.json({ modos });
}

export const dynamic = "force-dynamic";
