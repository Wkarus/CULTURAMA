import { NextResponse } from "next/server";
import { z } from "zod";
import { hasValidCoords } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  eventId: z.string().min(1),
  originLat: z.number().gte(-90).lte(90),
  originLng: z.number().gte(-180).lte(180),
});

type Modo = "driving" | "transit" | "walking";

const MODOS: { id: Modo; label: string }[] = [
  { id: "driving", label: "Carro" },
  { id: "transit", label: "Ônibus e metrô" },
  { id: "walking", label: "A pé" },
];

type Leg = { modo: string; label: string; duracao: string; distancia: string } | { modo: string; label: string; erro: string };

async function fetchModo(key: string, origin: string, destination: string, mode: Modo): Promise<Leg> {
  const label = MODOS.find((item) => item.id === mode)?.label ?? mode;
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("mode", mode);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("key", key);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return { modo: mode, label, erro: "A rota não respondeu agora." };
  }

  const payload = (await response.json()) as {
    status?: string;
    routes?: { legs?: { duration?: { text?: string }; distance?: { text?: string } }[] }[];
  };

  const leg = payload.routes?.[0]?.legs?.[0];
  if (payload.status !== "OK" || !leg?.duration?.text || !leg.distance?.text) {
    return { modo: mode, label, erro: mode === "transit" ? "Sem linha pública nesta origem." : "Sem rota neste modal." };
  }

  return { modo: mode, label, duracao: leg.duration.text, distancia: leg.distance.text };
}

export async function POST(request: Request) {
  const key = (process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)?.trim();
  if (!key) {
    return NextResponse.json({ error: "Defina GOOGLE_MAPS_API_KEY ou NEXT_PUBLIC_GOOGLE_MAPS_API_KEY." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Origem ou evento inválidos." }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id: parsed.data.eventId, status: "publicado" },
    select: { latitude: true, longitude: true },
  });
  if (!event || !hasValidCoords(event.latitude, event.longitude)) {
    return NextResponse.json({ error: "Este evento não tem coordenada para rota." }, { status: 404 });
  }

  const origin = `${parsed.data.originLat},${parsed.data.originLng}`;
  const destination = `${event.latitude},${event.longitude}`;
  const modos = await Promise.all(MODOS.map((modo) => fetchModo(key, origin, destination, modo.id)));

  return NextResponse.json({ modos });
}

export const dynamic = "force-dynamic";
