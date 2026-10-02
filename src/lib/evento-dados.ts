import type { RestricaoIdade } from "@prisma/client";
import { ensureCategorias } from "@/lib/categorias";
import { geocodeEndereco } from "@/lib/geocode";
import { hasValidCoords } from "@/lib/geo";
import { salvarImagem } from "@/lib/upload";

const RESTRICOES = new Set<RestricaoIdade>(["livre", "doze", "quatorze", "dezesseis", "dezoito"]);

export type DadosEvento = {
  titulo: string;
  descricao: string;
  categoriaId: string;
  dataHora: Date;
  endereco: string;
  latitude: number;
  longitude: number;
  linkSaibaMais: string | null;
  linkIngresso: string | null;
  gratuito: boolean;
  restricaoIdade: RestricaoIdade;
  tags: string[];
};

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/** Território brasileiro com folga; evita pino solto no oceano por engano. */
export function coordNoBrasil(lat: number, lng: number): boolean {
  return hasValidCoords(lat, lng) && lat >= -34.5 && lat <= 6 && lng >= -74.5 && lng <= -28.5;
}

/** Valida o formulário de evento (organizador e admin) e envia a capa. Pino manual vale mais que o geocode do endereço. */
export async function lerDadosEvento(
  formData: FormData,
): Promise<{ ok: true; dados: DadosEvento; imagemCapa?: string } | { ok: false; error: string }> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoriaId = String(formData.get("categoriaId") ?? "");
  const dataHoraRaw = String(formData.get("dataHora") ?? "");
  const endereco = String(formData.get("endereco") ?? "").trim();
  const linkSaibaMais = String(formData.get("linkSaibaMais") ?? "").trim() || null;
  const linkIngresso = String(formData.get("linkIngresso") ?? "").trim() || null;
  const gratuito = formData.get("gratuito") === "true";
  const restricaoIdade = String(formData.get("restricaoIdade") ?? "livre") as RestricaoIdade;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const arquivo = formData.get("imagemCapa");
  const pinManual = formData.get("pinManual") === "1";
  const latPin = Number(formData.get("latitude"));
  const lngPin = Number(formData.get("longitude"));

  if (!titulo || !descricao || !endereco || !dataHoraRaw) {
    return { ok: false, error: "Preencha título, descrição, data e endereço." };
  }
  if (!RESTRICOES.has(restricaoIdade)) {
    return { ok: false, error: "Restrição de idade inválida." };
  }

  const categorias = await ensureCategorias();
  if (!categorias.some((c) => c.id === categoriaId)) {
    return { ok: false, error: "Escolha uma categoria." };
  }

  const dataHora = new Date(dataHoraRaw);
  if (Number.isNaN(dataHora.getTime())) {
    return { ok: false, error: "Data e hora inválidas." };
  }

  let geo: { lat: number; lng: number } | null = null;
  if (pinManual) {
    if (!coordNoBrasil(latPin, lngPin)) return { ok: false, error: "O pino precisa ficar dentro do Brasil." };
    geo = { lat: latPin, lng: lngPin };
  } else {
    geo = await geocodeEndereco(`${endereco}, Brasil`);
    if (!geo) {
      return { ok: false, error: "Não achei esse endereço. Inclua rua, número e cidade, ou arraste o pino no mapa." };
    }
  }

  let imagemCapa: string | undefined;
  if (arquivo instanceof File && arquivo.size > 0) {
    const saved = await salvarImagem(arquivo);
    if (!saved.ok) return { ok: false, error: saved.message };
    imagemCapa = saved.url;
  }

  return {
    ok: true,
    imagemCapa,
    dados: {
      titulo,
      descricao,
      categoriaId,
      dataHora,
      endereco,
      latitude: geo.lat,
      longitude: geo.lng,
      linkSaibaMais,
      linkIngresso,
      gratuito,
      restricaoIdade,
      tags,
    },
  };
}
