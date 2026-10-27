/** Imports relativos: este módulo também roda pelo script `npm run mapas:importar` (tsx). */
import { hasValidCoords } from "./geo";

export type InstanciaMapas = {
  nome: string;
  /** URL base normalizada, sem barra no fim. É o valor gravado em `events.fonte_instancia`. */
  url: string;
  /** Fuso IANA das datas da instância (as ocorrências vêm em horário local). */
  fuso: string;
  /**
   * Só dados factuais (título, data, local, categoria, link): sem imagem e sem descrição da fonte.
   * Para instâncias ainda sem autorização formal; as imagens e os textos podem ter autor.
   */
  basico?: true;
};

export type FiltroRegiao = {
  /** Siglas aceitas; `null` = qualquer estado. */
  ufs: string[] | null;
  raio: { lat: number; lng: number; km: number } | null;
};

export type ConfigMapas = {
  instancias: InstanciaMapas[];
  regiao: FiltroRegiao;
  dias: number;
  pausaMs: number;
  timeoutMs: number;
  tentativas: number;
  userAgent: string;
  geocodeMax: number;
};

const FUSO_PADRAO = "America/Sao_Paulo";
const ROBO = "CulturamaBot/1.0";

/**
 * Sempre o mesmo robô identificado; só o contato é configurável (`MAPAS_CULTURAIS_CONTATO`: URL ou e-mail).
 * Não aceitar User-Agent livre: nunca se passar por navegador.
 */
export function userAgentDoRobo(contato: string | undefined): string {
  const limpo = (contato ?? "").replace(/[()\r\n]/g, "").trim().slice(0, 200);
  return limpo ? `${ROBO} (+${limpo})` : `${ROBO} (agregador de eventos culturais)`;
}

function inteiro(raw: string | undefined, padrao: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao;
}

function fusoValido(fuso: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: fuso });
    return true;
  } catch {
    return false;
  }
}

export function normalizarUrlBase(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/**
 * `MAPAS_CULTURAIS_INSTANCIAS`: entradas separadas por `;` ou quebra de linha, cada uma `Nome|URL`, `Nome|URL|Fuso`
 * ou com `|basico` no fim (`Nome|URL|basico`, `Nome|URL|Fuso|basico`). Entradas sem URL válida são ignoradas.
 */
export function lerInstancias(raw: string | undefined): InstanciaMapas[] {
  const vistas = new Set<string>();
  const instancias: InstanciaMapas[] = [];
  for (const entrada of (raw ?? "").split(/[;\n]/)) {
    const [nomeRaw, urlRaw, ...resto] = entrada.split("|").map((parte) => parte.trim());
    const url = urlRaw ? normalizarUrlBase(urlRaw) : null;
    if (!url || vistas.has(url)) continue;
    vistas.add(url);
    const basico = resto.some((parte) => /^b[aá]sico$/i.test(parte));
    const fusoRaw = resto.find((parte) => !/^b[aá]sico$/i.test(parte));
    const fuso = fusoRaw && fusoValido(fusoRaw) ? fusoRaw : FUSO_PADRAO;
    instancias.push({ nome: nomeRaw || new URL(url).hostname, url, fuso, ...(basico ? { basico: true as const } : {}) });
  }
  return instancias;
}

export const UFS_BRASIL = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

/** `lat,lng,km`, com ponto decimal: "-23.5505,-46.6333,50". Inválido = sem raio. */
function lerRaio(raw: string | undefined): FiltroRegiao["raio"] {
  const partes = (raw ?? "").split(",").map((parte) => parte.trim()).filter(Boolean).map(Number);
  if (partes.length !== 3) return null;
  const [lat, lng, km] = partes;
  if (!hasValidCoords(lat, lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !(km > 0)) return null;
  return { lat, lng, km: Math.min(km, 5000) };
}

/**
 * `MAPAS_CULTURAIS_UFS`: siglas separadas por vírgula ("SP,RJ") ou `*` para todos os estados.
 * `MAPAS_CULTURAIS_RAIO`: `lat,lng,km`. Com os dois, o evento precisa passar nos dois.
 * Sem nenhum dos dois: todo o Brasil. Quem limita por distância é o usuário, no Perto de mim.
 */
export function lerRegiao(env: NodeJS.ProcessEnv = process.env): FiltroRegiao {
  const raio = lerRaio(env.MAPAS_CULTURAIS_RAIO);
  const brutoUfs = env.MAPAS_CULTURAIS_UFS?.trim();
  if (!brutoUfs || /^(\*|todos)$/i.test(brutoUfs)) return { ufs: null, raio };
  const ufs = [...new Set(brutoUfs.toUpperCase().split(/[\s,;]+/))].filter((uf) => UFS_BRASIL.includes(uf));
  return { ufs: ufs.length ? ufs : null, raio };
}

export function descreverRegiao(filtro: FiltroRegiao): string {
  const partes = [
    filtro.ufs ? `estado${filtro.ufs.length > 1 ? "s" : ""} ${filtro.ufs.join(", ")}` : "",
    filtro.raio ? `até ${filtro.raio.km} km de ${filtro.raio.lat},${filtro.raio.lng}` : "",
  ].filter(Boolean);
  return partes.join(" e ") || "todo o Brasil";
}

export function lerConfigMapas(env: NodeJS.ProcessEnv = process.env): ConfigMapas {
  return {
    instancias: lerInstancias(env.MAPAS_CULTURAIS_INSTANCIAS),
    regiao: lerRegiao(env),
    dias: inteiro(env.MAPAS_CULTURAIS_DIAS, 60, 1, 365),
    pausaMs: inteiro(env.MAPAS_CULTURAIS_PAUSA_MS, 1000, 200, 30_000),
    timeoutMs: inteiro(env.MAPAS_CULTURAIS_TIMEOUT_MS, 20_000, 2_000, 120_000),
    tentativas: inteiro(env.MAPAS_CULTURAIS_TENTATIVAS, 3, 0, 6),
    userAgent: userAgentDoRobo(env.MAPAS_CULTURAIS_CONTATO),
    geocodeMax: inteiro(env.MAPAS_CULTURAIS_GEOCODE_MAX, 25, 0, 500),
  };
}

/** Nome para exibir ("SP Cultura"); se a instância saiu da config, cai no domínio. */
export function nomeDaInstancia(url: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = normalizarUrlBase(url);
  const achada = base ? lerInstancias(env.MAPAS_CULTURAIS_INSTANCIAS).find((i) => i.url === base) : undefined;
  if (achada) return achada.nome;
  try {
    return new URL(url).hostname;
  } catch {
    return "Mapas Culturais";
  }
}

/** Domínios das instâncias, para o proxy `/api/imagem` aceitar as capas importadas. */
export function dominiosDasInstancias(env: NodeJS.ProcessEnv = process.env): string[] {
  return lerInstancias(env.MAPAS_CULTURAIS_INSTANCIAS).map((i) => new URL(i.url).hostname.toLowerCase());
}
