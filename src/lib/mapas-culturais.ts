import type { RestricaoIdade } from "@prisma/client";
import type { SlugCategoria } from "./categorias-dados";
import { hasValidCoords, haversineKm } from "./geo";
import { mapearLinguagens } from "./mapas-culturais-categorias";
import { UFS_BRASIL, type ConfigMapas, type FiltroRegiao, type InstanciaMapas } from "./mapas-culturais-config";
import { robotsPermite } from "./robots";

/**
 * Cliente da API pública do Mapas Culturais (só endpoints `/api/`).
 * Campos conferidos em mapacultural.pb.gov.br: `findOccurrences` devolve uma linha por ocorrência já expandida;
 * `findByLocation` volta vazio quando o espaço não tem coordenada, por isso não é usado.
 * Nunca pedir `owner`, `relatedAgents`, telefones, e-mails ou documentos: o `@select` abaixo é a lista fechada do que entra.
 */

const POR_PAGINA = 200;
const MAX_PAGINAS = 100;
const IDS_POR_LOTE = 40;

/** Acessibilidade e links do próprio evento. `telefonePublico` fica de fora de propósito: costuma ser celular pessoal. */
const CAMPOS_EXTRAS = "traducaoLibras,descricaoSonora,site,instagram";
const CAMPOS_EVENTO = `id,name,subTitle,shortDescription,longDescription,classificacaoEtaria,singleUrl,terms,registrationInfo,${CAMPOS_EXTRAS}`;
const ARQUIVOS_EVENTO = "(avatar.avatarBig,header.header,gallery):url";
/** Instância `basico`: nem pede descrições e imagens à API. */
const CAMPOS_EVENTO_BASICO = `id,name,classificacaoEtaria,singleUrl,terms,${CAMPOS_EXTRAS}`;
const CAMPOS_ESPACO = "id,name,endereco,En_Nome_Logradouro,En_Num,En_Bairro,En_Municipio,En_Estado,location,acessibilidade,acessibilidade_fisica";

type DataApi = string | { date?: string } | null | undefined;

export type OcorrenciaApi = {
  id?: number;
  event_id?: number;
  occurrence_id?: number;
  starts_on?: DataApi;
  starts_at?: DataApi;
  ends_on?: DataApi;
  ends_at?: DataApi;
  /** `description` já vem pronto em português ("Toda segunda e quarta de 01 de Abril a 22 de Dezembro das 19:00 às 22:00"). */
  rule?: { startsOn?: string; startsAt?: string; endsAt?: string; description?: string; price?: string; priceInfo?: string; spaceId?: number | string };
  space?: { id?: number } | number | null;
  _reccurrence_string?: string;
};

export type EventoApi = {
  id: number;
  name?: string | null;
  subTitle?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  classificacaoEtaria?: string | null;
  singleUrl?: string | null;
  terms?: { linguagem?: string[]; tag?: string[] } | null;
  registrationInfo?: string | null;
  /** "Sim" quando o evento tem o recurso. */
  traducaoLibras?: string | null;
  descricaoSonora?: string | null;
  site?: string | null;
  instagram?: string | null;
  "@files:avatar.avatarBig"?: { url?: string } | null;
  "@files:header.header"?: { url?: string } | null;
  "@files:gallery"?: { url?: string }[] | { url?: string } | null;
};

export type EspacoApi = {
  id: number;
  name?: string | null;
  endereco?: string | null;
  En_Nome_Logradouro?: string | null;
  En_Num?: string | null;
  En_Bairro?: string | null;
  En_Municipio?: string | null;
  En_Estado?: string | null;
  location?: { latitude?: string | number; longitude?: string | number } | null;
  /** "Sim" / "Não". */
  acessibilidade?: string | null;
  /** Lista de recursos ("Rampa de acesso", "Banheiros adaptados"…); algumas instâncias mandam texto separado por ";". */
  acessibilidade_fisica?: string[] | string | null;
};

export type EventoNormalizado = {
  idExterno: string;
  titulo: string;
  descricao: string;
  dataHora: Date;
  dataFim: Date | null;
  local: string | null;
  endereco: string;
  /** Endereço bom o bastante para geocodificar (tem rua ou cidade). */
  enderecoGeocodificavel: string | null;
  latitude: number | null;
  longitude: number | null;
  categoriaSlug: SlugCategoria;
  categoriasSlugs: SlugCategoria[];
  linguagens: string[];
  linguagensNaoMapeadas: string[];
  tags: string[];
  restricaoIdade: RestricaoIdade;
  gratuito: boolean;
  linkSaibaMais: string | null;
  imagemCapa: string | null;
  libras: boolean;
  audiodescricao: boolean;
  acessibilidade: string[];
  inscricoes: string | null;
  siteEvento: string | null;
  instagramEvento: string | null;
  sessoes: Sessao[];
  galeria: string[];
  /** Todas as ocorrências já terminaram. */
  encerrado: boolean;
};

// ---------------------------------------------------------------- HTTP

export class ErroMapas extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** A instância não deve ser consultada (robots.txt ou desafio anti-robô): a coleta para na hora, sem nova tentativa. */
export class InstanciaPulada extends ErroMapas {}

export const AVISO_DESAFIO =
  "A instância respondeu com desafio anti-robô (Cloudflare); instância pulada. Só importar com autorização formal do gestor.";

/** Desafio vem como 403, 429 ou 503; nunca é resolvido nem contornado. */
function ehDesafio(resposta: Response, corpo: string): boolean {
  return Boolean(resposta.headers.get("cf-mitigated")) || /cf_chl|challenge-platform|Just a moment|Attention Required/i.test(corpo);
}

type Fetch = typeof fetch;
const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ClienteMapas {
  private ultimaChamada = 0;

  constructor(
    readonly instancia: InstanciaMapas,
    readonly config: Pick<ConfigMapas, "pausaMs" | "timeoutMs" | "tentativas" | "userAgent">,
    private readonly fetcher: Fetch = fetch,
    private readonly dormir: (ms: number) => Promise<unknown> = esperar,
  ) {}

  url(caminho: string, params: Record<string, string>): URL {
    const url = new URL(`${this.instancia.url}/api/${caminho}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url;
  }

  private async aguardarVez() {
    const falta = this.ultimaChamada + this.config.pausaMs - Date.now();
    if (falta > 0) await this.dormir(falta);
    this.ultimaChamada = Date.now();
  }

  /** robots.txt da raiz do domínio. `null` = inacessível (rede, 429 ou 5xx em todas as tentativas). */
  async robots(): Promise<{ status: number; corpo: string; desafio: boolean } | null> {
    const url = new URL("/robots.txt", this.instancia.url);
    for (let tentativa = 0; tentativa <= this.config.tentativas; tentativa++) {
      await this.aguardarVez();
      try {
        const resposta = await this.fetcher(url, {
          headers: { "User-Agent": this.config.userAgent, Accept: "text/plain" },
          cache: "no-store",
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });
        const corpo = await resposta.text().catch(() => "");
        if (ehDesafio(resposta, corpo)) return { status: resposta.status, corpo: "", desafio: true };
        if (resposta.status !== 429 && resposta.status < 500) {
          return { status: resposta.status, corpo: resposta.ok ? corpo : "", desafio: false };
        }
      } catch {
        // rede: tenta de novo
      }
      if (tentativa < this.config.tentativas) await this.dormir(backoff(tentativa));
    }
    return null;
  }

  /** Pausa entre chamadas, timeout por chamada e retry com backoff exponencial em rede, 429 e 5xx. */
  async json<T>(caminho: string, params: Record<string, string>): Promise<T> {
    const url = this.url(caminho, params);
    let ultimoErro: unknown;
    for (let tentativa = 0; tentativa <= this.config.tentativas; tentativa++) {
      await this.aguardarVez();

      let resposta: Response;
      try {
        resposta = await this.fetcher(url, {
          headers: { "User-Agent": this.config.userAgent, Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });
      } catch (erro) {
        ultimoErro = erro;
        await this.dormir(backoff(tentativa));
        continue;
      }

      if (resposta.redirected && !new URL(resposta.url).pathname.startsWith("/api/")) {
        throw new ErroMapas(`A instância redirecionou para ${new URL(resposta.url).origin}; atualize a URL em MAPAS_CULTURAIS_INSTANCIAS.`);
      }
      const tipo = resposta.headers.get("content-type") ?? "";
      if (resposta.headers.get("cf-mitigated") || !tipo.includes("json")) {
        const corpo = await resposta.text().catch(() => "");
        if (ehDesafio(resposta, corpo)) throw new InstanciaPulada(AVISO_DESAFIO, resposta.status);
        if (resposta.ok) throw new ErroMapas(`Resposta não é JSON em ${caminho} (${tipo || "sem content-type"})`, resposta.status);
      }
      if (resposta.ok) return (await resposta.json()) as T;
      ultimoErro = new ErroMapas(`HTTP ${resposta.status} em ${caminho}`, resposta.status);
      if (resposta.status !== 429 && resposta.status < 500) throw ultimoErro;
      const retryAfter = Number(resposta.headers.get("retry-after"));
      await this.dormir(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : backoff(tentativa));
    }
    throw ultimoErro instanceof Error ? ultimoErro : new ErroMapas(`Falha em ${caminho}`);
  }
}

function backoff(tentativa: number): number {
  return 1000 * 2 ** tentativa + Math.floor(Math.random() * 250);
}

const CAMINHOS_DA_API = ["/api/", "/api/event/findOccurrences", "/api/event/find", "/api/space/find"];

/**
 * Motivo para pular a instância, ou `null` se pode importar. RFC 9309: 4xx = sem restrições;
 * inacessível = tudo bloqueado.
 */
export async function bloqueioDoRobots(cliente: ClienteMapas): Promise<string | null> {
  const resposta = await cliente.robots();
  if (!resposta) return "robots.txt inacessível (sem resposta ou erro do servidor); por precaução a instância foi pulada";
  if (resposta.desafio) return AVISO_DESAFIO;
  if (resposta.status >= 400) return null;
  const base = new URL(cliente.instancia.url).pathname.replace(/\/+$/, "");
  const bloqueado = CAMINHOS_DA_API.map((caminho) => base + caminho).find(
    (caminho) => !robotsPermite(resposta.corpo, cliente.config.userAgent, caminho),
  );
  return bloqueado ? `robots.txt bloqueia ${bloqueado} para robôs; instância pulada` : null;
}

// ---------------------------------------------------------------- Busca

function diaIso(data: Date, fuso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
}

/** Todas as ocorrências do período, página por página até a última. */
export async function listarOcorrencias(cliente: ClienteMapas, de: Date, ate: Date): Promise<OcorrenciaApi[]> {
  const fuso = cliente.instancia.fuso;
  const vistas = new Set<string>();
  const todas: OcorrenciaApi[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const linhas = await cliente.json<OcorrenciaApi[]>("event/findOccurrences", {
      "@from": diaIso(de, fuso),
      "@to": diaIso(ate, fuso),
      "@select": "id",
      "@order": "id ASC",
      "@limit": String(POR_PAGINA),
      "@page": String(pagina),
    });
    if (!Array.isArray(linhas)) throw new ErroMapas("Resposta inesperada de findOccurrences");
    for (const linha of linhas) {
      const chaveLinha = linha._reccurrence_string ?? `${linha.occurrence_id}.${texto(linha.starts_on)}.${texto(linha.starts_at)}`;
      if (vistas.has(chaveLinha)) continue;
      vistas.add(chaveLinha);
      todas.push(linha);
    }
    if (linhas.length < POR_PAGINA) return todas;
  }
  throw new ErroMapas(`Mais de ${MAX_PAGINAS} páginas de ocorrências; reduza MAPAS_CULTURAIS_DIAS.`);
}

function lotes<T>(itens: T[], tamanho: number): T[][] {
  const saida: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) saida.push(itens.slice(i, i + tamanho));
  return saida;
}

export type ResultadoLotes<T> = { itens: T[]; falhas: { ids: number[]; erro: string }[] };

/** Busca por `id=IN(...)` em lotes; um lote que falha não derruba os outros, mas desafio anti-robô encerra a instância. */
async function buscarPorIds<T>(cliente: ClienteMapas, entidade: string, ids: number[], params: Record<string, string>): Promise<ResultadoLotes<T>> {
  const resultado: ResultadoLotes<T> = { itens: [], falhas: [] };
  for (const lote of lotes([...new Set(ids)], IDS_POR_LOTE)) {
    try {
      const itens = await cliente.json<T[]>(`${entidade}/find`, { ...params, id: `IN(${lote.join(",")})` });
      if (!Array.isArray(itens)) throw new ErroMapas(`Resposta inesperada de ${entidade}/find`);
      resultado.itens.push(...itens);
    } catch (erro) {
      if (erro instanceof InstanciaPulada) throw erro;
      resultado.falhas.push({ ids: lote, erro: erro instanceof Error ? erro.message : String(erro) });
    }
  }
  return resultado;
}

export function buscarEventos(cliente: ClienteMapas, ids: number[]) {
  const params: Record<string, string> = cliente.instancia.basico
    ? { "@select": CAMPOS_EVENTO_BASICO }
    : { "@select": CAMPOS_EVENTO, "@files": ARQUIVOS_EVENTO };
  return buscarPorIds<EventoApi>(cliente, "event", ids, params);
}

export function buscarEspacos(cliente: ClienteMapas, ids: number[]) {
  return buscarPorIds<EspacoApi>(cliente, "space", ids, { "@select": CAMPOS_ESPACO });
}

// ---------------------------------------------------------------- Normalização

function texto(valor: DataApi): string {
  if (!valor) return "";
  return typeof valor === "string" ? valor : (valor.date ?? "");
}

function limpo(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\s+/g, " ").trim();
}

const sim = (valor: string | null | undefined) => /^\s*sim\s*$/i.test(valor ?? "");

/** Recursos do espaço; com só "Sim" e sem lista, vira um selo genérico. "Não" e vazio não entram. */
export function acessibilidadeDoEspaco(espaco: EspacoApi | undefined): string[] {
  const bruto = espaco?.acessibilidade_fisica;
  const lista = (Array.isArray(bruto) ? bruto : (bruto ?? "").split(/[;\n]/))
    .map(limpo)
    .filter((item) => item && !/^n[aã]o$/i.test(item));
  const recursos = [...new Set(lista)].slice(0, 8).map((item) => item.slice(0, 60));
  if (recursos.length) return recursos;
  return sim(espaco?.acessibilidade) ? ["Espaço acessível"] : [];
}

/** Só http(s); sem esquema ganha https. Nada de javascript: nem link quebrado. */
export function linkExterno(valor: string | null | undefined): string | null {
  const texto = limpo(valor);
  if (!texto) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    return /^https?:$/.test(url.protocol) && url.hostname.includes(".") ? url.toString().slice(0, 300) : null;
  } catch {
    return null;
  }
}

/** Aceita "@perfil", "perfil" ou o link inteiro do Instagram. */
export function linkInstagram(valor: string | null | undefined): string | null {
  const texto = limpo(valor);
  if (!texto) return null;
  if (/instagram\.com/i.test(texto)) return linkExterno(texto);
  const perfil = texto.replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(perfil) ? `https://www.instagram.com/${perfil}/` : null;
}

/** Converte horário de parede do fuso da instância para UTC (sem depender do fuso do servidor). */
export function localParaUtc(dia: string, hora: string, fuso: string): Date | null {
  const d = dia.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const h = hora.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!d) return null;
  const [ano, mes, diaN] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [hh, mm, ss] = h ? [Number(h[1]), Number(h[2]), Number(h[3] ?? 0)] : [0, 0, 0];
  if (hh > 23 || mm > 59) return null;
  const chute = Date.UTC(ano, mes - 1, diaN, hh, mm, ss);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: fuso,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(new Date(chute))
      .map((p) => [p.type, Number(p.value)]),
  );
  const comoUtc = Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second);
  const resultado = new Date(chute - (comoUtc - chute));
  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

type Ocorrencia = { inicio: Date; fim: Date | null; espacoId: number | null; preco: string };

/**
 * Muitas instâncias gravam `ends_at` igual ao início e põem o horário real só no texto ("das 10:00 às 22:00").
 * Fim antes do início no texto quer dizer que passa da meia-noite.
 */
export function lerOcorrencia(linha: OcorrenciaApi, fuso: string): Ocorrencia | null {
  const dia = texto(linha.starts_on) || linha.rule?.startsOn || "";
  const hora = texto(linha.starts_at) || linha.rule?.startsAt || "00:00";
  const inicio = localParaUtc(dia, hora.includes(" ") ? hora.split(" ")[1] : hora, fuso);
  if (!inicio) return null;

  let fim: Date | null = null;
  const fimHora = texto(linha.ends_at) || linha.rule?.endsAt || "";
  const fimDia = texto(linha.ends_on) || dia;
  if (fimHora) {
    const candidato = localParaUtc(fimDia, fimHora.includes(" ") ? fimHora.split(" ")[1] : fimHora, fuso);
    if (candidato && candidato > inicio) fim = candidato;
  }
  if (!fim) {
    const faixa = linha.rule?.description?.match(/das\s+(\d{1,2}:\d{2})\s+(?:à|a)s\s+(\d{1,2}:\d{2})/i);
    const candidato = faixa ? localParaUtc(dia, faixa[2], fuso) : null;
    if (candidato) fim = candidato > inicio ? candidato : new Date(candidato.getTime() + 24 * 3600_000);
  }

  const espaco = typeof linha.space === "object" && linha.space ? linha.space.id : linha.space;
  const espacoId = Number(espaco ?? linha.rule?.spaceId);
  return { inicio, fim, espacoId: Number.isFinite(espacoId) ? espacoId : null, preco: linha.rule?.price ?? "" };
}

const GRATUITO = /gratuit|gr[aá]tis|entrada franca|\bfree\b|^\s*(r\$\s*)?0+([.,]0+)?\s*$/i;

export function restricaoDe(classificacao: string | null | undefined): RestricaoIdade {
  const anos = Number(classificacao?.match(/\d+/)?.[0]);
  if (!Number.isFinite(anos) || anos <= 0) return "livre";
  if (anos >= 18) return "dezoito";
  if (anos >= 16) return "dezesseis";
  if (anos >= 14) return "quatorze";
  return "doze";
}

function coordenadas(espaco: EspacoApi | undefined): { lat: number; lng: number } | null {
  const lat = Number(espaco?.location?.latitude);
  const lng = Number(espaco?.location?.longitude);
  if (!hasValidCoords(lat, lng)) return null;
  if (lat < -34.5 || lat > 6 || lng < -74.5 || lng > -28.5) return null;
  return { lat, lng };
}

const UF_POR_NOME: Record<string, string> = {
  acre: "AC", alagoas: "AL", amazonas: "AM", amapa: "AP", bahia: "BA", ceara: "CE", "distrito federal": "DF",
  "espirito santo": "ES", goias: "GO", maranhao: "MA", "minas gerais": "MG", "mato grosso do sul": "MS",
  "mato grosso": "MT", para: "PA", paraiba: "PB", pernambuco: "PE", piaui: "PI", parana: "PR", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", rondonia: "RO", roraima: "RR", "rio grande do sul": "RS", "santa catarina": "SC",
  sergipe: "SE", "sao paulo": "SP", tocantins: "TO",
};

function siglaUf(valor: string | null | undefined): string | null {
  const bruto = limpo(valor);
  if (UFS_BRASIL.includes(bruto.toUpperCase())) return bruto.toUpperCase();
  const nome = bruto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return UF_POR_NOME[nome] ?? null;
}

/** `En_Estado` ou, se vazio, a última sigla de UF no endereço livre ("... João Pessoa/PB - CEP ..."). */
export function ufDoEspaco(espaco: EspacoApi): string | null {
  const direta = siglaUf(espaco.En_Estado);
  if (direta) return direta;
  const siglas = [...limpo(espaco.endereco).matchAll(/(?:^|[\s/,-])([A-Z]{2})(?=$|[\s/,-])/g)]
    .map((m) => m[1])
    .filter((sigla) => UFS_BRASIL.includes(sigla));
  return siglas[siglas.length - 1] ?? null;
}

export function filtraRegiao(filtro: FiltroRegiao): boolean {
  return filtro.ufs !== null || filtro.raio !== null;
}

/** Sem estado ou sem coordenada conhecidos, o espaço fica de fora quando o filtro pede esse dado. */
export function dentroDaRegiao(espaco: EspacoApi | undefined, filtro: FiltroRegiao): boolean {
  if (!filtraRegiao(filtro)) return true;
  if (!espaco) return false;
  if (filtro.ufs) {
    const uf = ufDoEspaco(espaco);
    if (!uf || !filtro.ufs.includes(uf)) return false;
  }
  if (filtro.raio) {
    const ponto = coordenadas(espaco);
    if (!ponto || haversineKm(ponto, filtro.raio) > filtro.raio.km) return false;
  }
  return true;
}

/** "Local, Rua, 12 - Bairro, Cidade - UF": formato que `localDoEvento` já sabe ler. */
export function montarEndereco(espaco: EspacoApi | undefined): { local: string | null; endereco: string | null } {
  if (!espaco) return { local: null, endereco: null };
  const local = limpo(espaco.name) || null;
  const rua = [limpo(espaco.En_Nome_Logradouro), limpo(espaco.En_Num)].filter(Boolean).join(", ");
  const bairro = limpo(espaco.En_Bairro);
  const cidade = [limpo(espaco.En_Municipio), limpo(espaco.En_Estado)].filter(Boolean).join(" - ");
  const estruturado = rua ? [bairro ? `${rua} - ${bairro}` : rua, cidade].filter(Boolean).join(", ") : "";
  return { local, endereco: estruturado || limpo(espaco.endereco) || cidade || null };
}

function linkDaFonte(url: string | null | undefined, instancia: InstanciaMapas): string | null {
  try {
    const link = new URL(url ?? "");
    return link.host === new URL(instancia.url).host && /^https?:$/.test(link.protocol) ? link.toString() : null;
  } catch {
    return null;
  }
}

/** Uma sessão por regra de ocorrência, como o "Datas e horários" das instâncias. Fica no JSON `events.sessoes`. */
export type Sessao = {
  regra: string;
  /** Próxima vez que acontece (ISO), para ordenar e para o evento recorrente não mostrar data já passada. */
  proxima: string;
  local: string | null;
  endereco: string | null;
  preco: string | null;
  info: string | null;
};

/**
 * Evento recorrente chega como várias linhas com a mesma regra; agrupa por `occurrence_id` e guarda a próxima data.
 * Sem texto de regra, monta "Dia 12 de abril às 10:00". No máximo 8 sessões, da mais próxima para a mais distante.
 */
export function sessoesDe(linhas: OcorrenciaApi[], espacos: Map<number, EspacoApi>, fuso: string, agora = new Date()): Sessao[] {
  const porRegra = new Map<string, { linha: OcorrenciaApi; ocorrencia: Ocorrencia }>();
  for (const linha of linhas) {
    const ocorrencia = lerOcorrencia(linha, fuso);
    if (!ocorrencia) continue;
    const chave = String(linha.occurrence_id ?? linha.rule?.description ?? ocorrencia.inicio.toISOString());
    const atual = porRegra.get(chave);
    const termina = (o: Ocorrencia) => (o.fim ?? o.inicio).getTime();
    const melhor =
      !atual ||
      (termina(ocorrencia) >= agora.getTime() && (termina(atual.ocorrencia) < agora.getTime() || ocorrencia.inicio < atual.ocorrencia.inicio));
    if (melhor) porRegra.set(chave, { linha, ocorrencia });
  }
  return [...porRegra.values()]
    .sort((a, b) => a.ocorrencia.inicio.getTime() - b.ocorrencia.inicio.getTime())
    .slice(0, 8)
    .map(({ linha, ocorrencia }) => {
      const { local, endereco } = montarEndereco(ocorrencia.espacoId !== null ? espacos.get(ocorrencia.espacoId) : undefined);
      const regra =
        limpo(linha.rule?.description) ||
        `Dia ${ocorrencia.inicio.toLocaleString("pt-BR", { timeZone: fuso, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).replace(",", " às")}`;
      return {
        regra: regra.slice(0, 200),
        proxima: ocorrencia.inicio.toISOString(),
        local,
        endereco,
        preco: limpo(ocorrencia.preco) || null,
        info: limpo(linha.rule?.priceInfo).slice(0, 200) || null,
      };
    });
}

/** Lê `events.sessoes` (JSON do banco) com tolerância: item malformado é descartado em vez de quebrar a página. */
export function lerSessoes(valor: unknown): Sessao[] {
  if (!Array.isArray(valor)) return [];
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return valor.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const s = item as Record<string, unknown>;
    const regra = texto(s.regra);
    const proxima = texto(s.proxima);
    if (!regra || !proxima || Number.isNaN(new Date(proxima).getTime())) return [];
    return [{ regra, proxima, local: texto(s.local), endereco: texto(s.endereco), preco: texto(s.preco), info: texto(s.info) }];
  });
}

/** Fotos da galeria (só http/https), sem repetir e sem passar de 8. */
export function galeriaDe(evento: EventoApi): string[] {
  const bruto = evento["@files:gallery"];
  const lista = Array.isArray(bruto) ? bruto : bruto ? [bruto] : [];
  return [...new Set(lista.map((f) => f?.url ?? "").filter((url) => /^https?:\/\//.test(url)))].slice(0, 8);
}

function imagemDe(evento: EventoApi): string | null {
  for (const arquivo of [evento["@files:avatar.avatarBig"], evento["@files:header.header"]]) {
    if (arquivo?.url && /^https?:\/\//.test(arquivo.url)) return arquivo.url;
  }
  return null;
}

function descricaoDe(evento: EventoApi, titulo: string): string {
  const partes = [evento.subTitle, evento.shortDescription, evento.longDescription]
    .map((parte) => (parte ?? "").replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim())
    .filter(Boolean);
  const unicas = partes.filter((parte, i) => partes.indexOf(parte) === i);
  return (unicas.join("\n\n") || titulo).slice(0, 5000);
}

/** Texto padrão do modo `basico`: nada escrito pela fonte, só o convite para a página original. */
export function descricaoBasica(instancia: InstanciaMapas): string {
  return `Evento divulgado em ${instancia.nome}. Veja a descrição completa, imagens e detalhes na página original do evento.`;
}

/** Evento + ocorrências do período → linha da tabela `events`. Lança erro se faltar o essencial. */
export function normalizarEvento(
  evento: EventoApi,
  linhas: OcorrenciaApi[],
  espacos: Map<number, EspacoApi>,
  instancia: InstanciaMapas,
  agora = new Date(),
): EventoNormalizado {
  const titulo = limpo(evento.name);
  if (!evento.id || !titulo) throw new Error(`evento ${evento.id ?? "?"} sem id ou título`);

  const ocorrencias = linhas
    .map((linha) => lerOcorrencia(linha, instancia.fuso))
    .filter((o): o is Ocorrencia => o !== null)
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  if (ocorrencias.length === 0) throw new Error(`evento ${evento.id} sem ocorrência com data válida`);

  const termino = (o: Ocorrencia) => o.fim ?? o.inicio;
  const vigentes = ocorrencias.filter((o) => termino(o) >= agora);
  const proxima = vigentes[0] ?? ocorrencias[ocorrencias.length - 1];
  const ultimoFim = new Date(Math.max(...ocorrencias.map((o) => termino(o).getTime())));

  const espaco = proxima.espacoId !== null ? espacos.get(proxima.espacoId) : undefined;
  const { local, endereco } = montarEndereco(espaco);
  const coords = coordenadas(espaco);

  const linguagens = [...new Set((evento.terms?.linguagem ?? []).map(limpo).filter(Boolean))];
  const categorias = mapearLinguagens(linguagens);
  const tags = [...new Set([...linguagens, ...(evento.terms?.tag ?? []).map(limpo).filter(Boolean)])].slice(0, 12);
  const precos = ocorrencias.map((o) => o.preco.trim()).filter(Boolean);

  return {
    idExterno: String(evento.id),
    titulo: titulo.slice(0, 300),
    descricao: instancia.basico ? descricaoBasica(instancia) : descricaoDe(evento, titulo),
    dataHora: proxima.inicio,
    dataFim: ultimoFim > proxima.inicio ? ultimoFim : null,
    local,
    endereco: [local, endereco].filter(Boolean).join(", ") || instancia.nome,
    enderecoGeocodificavel: endereco && (espaco?.En_Municipio || /\d/.test(endereco)) ? [local, endereco].filter(Boolean).join(", ") : null,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    categoriaSlug: categorias.principal,
    categoriasSlugs: categorias.todas,
    linguagens,
    linguagensNaoMapeadas: categorias.naoMapeadas,
    tags,
    restricaoIdade: restricaoDe(evento.classificacaoEtaria),
    gratuito: precos.length > 0 && precos.every((preco) => GRATUITO.test(preco)),
    linkSaibaMais: linkDaFonte(evento.singleUrl, instancia),
    imagemCapa: instancia.basico ? null : imagemDe(evento),
    libras: sim(evento.traducaoLibras),
    audiodescricao: sim(evento.descricaoSonora),
    acessibilidade: acessibilidadeDoEspaco(espaco),
    inscricoes: instancia.basico ? null : limpo(evento.registrationInfo).slice(0, 300) || null,
    siteEvento: linkExterno(evento.site),
    instagramEvento: linkInstagram(evento.instagram),
    sessoes: sessoesDe(linhas, espacos, instancia.fuso, agora),
    galeria: instancia.basico ? [] : galeriaDe(evento),
    encerrado: vigentes.length === 0,
  };
}

// ---------------------------------------------------------------- Coleta de uma instância

export type ColetaInstancia = {
  instancia: InstanciaMapas;
  eventos: EventoNormalizado[];
  ocorrencias: number;
  /** Eventos do período sem nenhuma ocorrência dentro do filtro de região. */
  foraDaRegiao: number;
  /** Algum lote falhou: não dá para afirmar que um evento "sumiu" da fonte. */
  parcial: boolean;
  erros: string[];
  linguagensNaoMapeadas: string[];
};

/**
 * Lê o robots.txt, busca e normaliza; não grava nada. Espaços vêm antes dos eventos para que só os eventos
 * da região sejam pedidos à API. Erro de um evento vai para `erros` e a coleta segue.
 */
export async function coletarInstancia(
  cliente: ClienteMapas,
  opcoes: { dias: number; regiao: FiltroRegiao },
  agora = new Date(),
): Promise<ColetaInstancia> {
  const instancia = cliente.instancia;
  const bloqueio = await bloqueioDoRobots(cliente);
  if (bloqueio) throw new InstanciaPulada(bloqueio);

  const ate = new Date(agora.getTime() + opcoes.dias * 24 * 3600_000);
  const linhas = await listarOcorrencias(cliente, agora, ate);
  const lidas = linhas.map((linha) => ({
    linha,
    eventoId: Number(linha.event_id ?? linha.id),
    espacoId: lerOcorrencia(linha, instancia.fuso)?.espacoId ?? null,
  }));

  const erros: string[] = [];
  const espacos = await buscarEspacos(
    cliente,
    lidas.map((l) => l.espacoId).filter((id): id is number => id !== null),
  );
  for (const falha of espacos.falhas) erros.push(`espaços ${falha.ids.join(",")}: ${falha.erro}`);
  const espacoPorId = new Map(espacos.itens.map((e) => [Number(e.id), e]));

  const todosOsEventos = new Set<number>();
  const porEvento = new Map<number, OcorrenciaApi[]>();
  for (const { linha, eventoId, espacoId } of lidas) {
    if (!Number.isFinite(eventoId)) continue;
    todosOsEventos.add(eventoId);
    if (!dentroDaRegiao(espacoId !== null ? espacoPorId.get(espacoId) : undefined, opcoes.regiao)) continue;
    porEvento.set(eventoId, [...(porEvento.get(eventoId) ?? []), linha]);
  }

  const eventos = await buscarEventos(cliente, [...porEvento.keys()]);
  for (const falha of eventos.falhas) erros.push(`eventos ${falha.ids.join(",")}: ${falha.erro}`);

  const normalizados: EventoNormalizado[] = [];
  const naoMapeadas = new Set<string>();
  for (const evento of eventos.itens) {
    try {
      const n = normalizarEvento(evento, porEvento.get(Number(evento.id)) ?? [], espacoPorId, instancia, agora);
      n.linguagensNaoMapeadas.forEach((l) => naoMapeadas.add(l));
      normalizados.push(n);
    } catch (erro) {
      erros.push(erro instanceof Error ? erro.message : String(erro));
    }
  }

  return {
    instancia,
    eventos: normalizados,
    ocorrencias: linhas.length,
    foraDaRegiao: todosOsEventos.size - porEvento.size,
    parcial: eventos.falhas.length > 0 || (filtraRegiao(opcoes.regiao) && espacos.falhas.length > 0),
    erros,
    linguagensNaoMapeadas: [...naoMapeadas].sort(),
  };
}
