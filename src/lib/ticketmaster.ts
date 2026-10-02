import type { RestricaoIdade } from "@prisma/client";
import { ensureCategorias } from "@/lib/categorias";
import { prisma } from "@/lib/prisma";
import { mapCategoriaSlug, type TmClassificacao } from "@/lib/ticketmaster-categorias";

type TmEvent = {
  id: string;
  name?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  dates?: { start?: { dateTime?: string; localDate?: string; localTime?: string } };
  images?: { url: string; width?: number }[];
  classifications?: TmClassificacao[];
  priceRanges?: { min?: number; max?: number }[];
  _embedded?: {
    venues?: {
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { name?: string };
      country?: { countryCode?: string };
      location?: { latitude?: string; longitude?: string };
    }[];
  };
};

function parseDataHora(event: TmEvent): Date | null {
  const start = event.dates?.start;
  if (start?.dateTime) {
    const d = new Date(start.dateTime);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (start?.localDate) {
    const d = new Date(`${start.localDate}T${start.localTime ?? "20:00:00"}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function fetchPage(key: string, params: Record<string, string>): Promise<{ events: TmEvent[]; totalPages: number }> {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", key);
  url.searchParams.set("size", "50");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return { events: [], totalPages: 0 };
  const payload = (await response.json()) as {
    _embedded?: { events?: TmEvent[] };
    page?: { totalPages?: number };
  };
  return {
    events: payload._embedded?.events ?? [],
    totalPages: payload.page?.totalPages ?? 1,
  };
}

async function fetchAllBrasil(key: string): Promise<TmEvent[]> {
  const byId = new Map<string, TmEvent>();
  const first = await fetchPage(key, { countryCode: "BR", page: "0" });
  for (const item of first.events) {
    if (item.id) byId.set(item.id, item);
  }

  const pages = Math.min(first.totalPages, 8);
  for (let page = 1; page < pages; page += 1) {
    const next = await fetchPage(key, { countryCode: "BR", page: String(page) });
    for (const item of next.events) {
      if (item.id) byId.set(item.id, item);
    }
  }

  return [...byId.values()];
}

export async function syncTicketmaster(): Promise<{ ok: true; upserted: number } | { ok: false; message: string }> {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  if (!key) {
    return { ok: false, message: "Defina TICKETMASTER_API_KEY no .env." };
  }

  const events = await fetchAllBrasil(key);
  const categorias = await ensureCategorias();
  const porSlug = new Map(categorias.map((c) => [c.slug, c]));
  const syncedIds: string[] = [];

  let upserted = 0;
  for (const item of events) {
    const dataHora = parseDataHora(item);
    if (!dataHora || !item.name) continue;

    const venue = item._embedded?.venues?.[0];
    const endereco =
      [venue?.name, venue?.address?.line1, venue?.city?.name, venue?.state?.name].filter(Boolean).join(", ") || "Brasil";
    const lat = Number(venue?.location?.latitude);
    const lng = Number(venue?.location?.longitude);
    const image = item.images?.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url;
    const category = porSlug.get(mapCategoriaSlug(item)) ?? porSlug.get("musica");
    const classificacao = item.classifications?.find((c) => c.primary) ?? item.classifications?.[0];
    const tags = Array.from(
      new Set(
        [classificacao?.genre?.name, classificacao?.subGenre?.name, classificacao?.segment?.name].filter(
          (nome): nome is string => !!nome && nome !== "Undefined",
        ),
      ),
    );
    const descricao = item.info || item.pleaseNote || item.name;
    const restricaoIdade: RestricaoIdade = "livre";
    const ranges = item.priceRanges ?? [];
    const gratuito = ranges.length > 0 && ranges.every((range) => (range.min ?? 1) === 0 && (range.max ?? 1) === 0);

    await prisma.event.upsert({
      where: { idExterno: item.id },
      create: {
        fonte: "ticketmaster",
        idExterno: item.id,
        titulo: item.name,
        descricao,
        categoriaId: category?.id,
        dataHora,
        endereco,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
        imagemCapa: image,
        linkIngresso: item.url,
        gratuito,
        tags,
        restricaoIdade,
        linkSaibaMais: item.url,
        status: "publicado",
      },
      update: {
        titulo: item.name,
        descricao,
        categoriaId: category?.id,
        dataHora,
        endereco,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
        imagemCapa: image,
        linkIngresso: item.url,
        gratuito,
        tags,
        linkSaibaMais: item.url,
      },
    });
    syncedIds.push(item.id);
    upserted += 1;
  }

  if (syncedIds.length > 0) {
    await prisma.event.deleteMany({
      where: {
        fonte: "ticketmaster",
        NOT: { idExterno: { in: syncedIds } },
      },
    });
  }

  return { ok: true, upserted };
}
