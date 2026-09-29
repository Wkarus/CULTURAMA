export type ModoRota = "driving" | "transit" | "walking";

export type PassoRota = {
  instrucao: string;
  distancia: string;
  duracao: string;
};

export type BoundsRota = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type RotaOk = {
  modo: ModoRota;
  label: string;
  duracao: string;
  distancia: string;
  polyline: string;
  bounds: BoundsRota;
  origem: { lat: number; lng: number; endereco: string };
  destino: { lat: number; lng: number; endereco: string };
  passos: PassoRota[];
};

export type RotaErro = { modo: ModoRota; label: string; erro: string };

export type RotaModo = RotaOk | RotaErro;

export function isRotaOk(modo: RotaModo): modo is RotaOk {
  return "polyline" in modo && "passos" in modo;
}

export function stripHtmlInstrucao(html: string): string {
  return html
    .replace(/<div[^>]*>/gi, ". ")
    .replace(/<\/div>/gi, "")
    .replace(/<br\s*\/?>/gi, ". ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "\u0027")
    .replace(/&quot;/g, "\u0022")
    .replace(/\s+/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}
