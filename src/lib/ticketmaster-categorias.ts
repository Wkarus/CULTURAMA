import { CATEGORIAS_ARVORE, type SlugCategoria } from "./categorias-dados";

type Nome = { name?: string };
export type TmClassificacao = {
  primary?: boolean;
  segment?: Nome;
  genre?: Nome;
  subGenre?: Nome;
  type?: Nome;
  subType?: Nome;
};

type Regra = { slug: SlugCategoria; teste: RegExp };

function normalizar(texto: string | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function valido(nome: Nome | undefined): string | undefined {
  const texto = nome?.name?.trim();
  return texto && normalizar(texto) !== "undefined" ? texto : undefined;
}

/** A ordem importa: a primeira regra que bate vence (ex.: "samba-rock" antes de "rock"). */
const REGRAS_POR_SEGMENTO: Record<string, { regras: Regra[]; mae: SlugCategoria }> = {
  music: {
    mae: "musica",
    regras: [
      { slug: "samba-rock", teste: /samba[- ]rock/ },
      { slug: "pagode", teste: /pagode/ },
      { slug: "samba", teste: /samba/ },
      { slug: "forro", teste: /forro/ },
      { slug: "eletronica", teste: /electronic|eletronic|techno|house|edm|\bdance\b/ },
      { slug: "classica-e-concertos", teste: /classical|classica|orchestra|orquestra|symphon|sinfoni|opera|chamber/ },
      { slug: "rock", teste: /rock|metal|punk|alternative|grunge/ },
      { slug: "sertanejo", teste: /sertanej|country/ },
      { slug: "rap-e-rima", teste: /hip[- ]?hop|\brap\b|\btrap\b/ },
      { slug: "festivais-de-musica", teste: /festival/ },
    ],
  },
  sports: {
    mae: "esportes",
    regras: [
      { slug: "corrida", teste: /running|marathon|athletics|track (and|&) field|corrida|maratona/ },
      { slug: "judo-e-lutas", teste: /martial|mma|boxing|wrestling|judo|jiu|karate|taekwondo|ufc|fight|luta/ },
      { slug: "natacao", teste: /swim|aquatic|natacao/ },
      { slug: "ciclismo", teste: /cycling|ciclismo|\bbike\b/ },
      { slug: "xadrez", teste: /chess|xadrez/ },
      { slug: "games", teste: /e-?sports?/ },
    ],
  },
  "arts & theatre": {
    mae: "artes-cenicas",
    regras: [
      { slug: "stand-up", teste: /comedy|stand[- ]?up|humor|comedia/ },
      { slug: "ballet-e-contemporanea", teste: /ballet|bale|contemporary|contemporanea|modern dance/ },
      { slug: "danca", teste: /dance|danca/ },
      { slug: "circo", teste: /circus|circo|specialty acts|magic|ilusion|illusion/ },
      { slug: "classica-e-concertos", teste: /opera|classical|orchestra/ },
      { slug: "exposicoes", teste: /fine art|visual art|exhibit|expos/ },
      { slug: "arte-e-exposicao", teste: /multimedia|art\b/ },
      { slug: "teatro", teste: /theat|teatro|musical|play|drama|puppet/ },
    ],
  },
  film: { mae: "arte-e-exposicao", regras: [] },
  miscellaneous: {
    mae: "feiras-e-gastronomia",
    regras: [
      { slug: "festivais-gastronomicos", teste: /food|drink|gastronom|culinar|beer|wine|cerveja|vinho/ },
      { slug: "anime", teste: /anime|manga/ },
      { slug: "comic-con", teste: /comic|ccxp|geek/ },
      { slug: "cosplay", teste: /cosplay/ },
      { slug: "games", teste: /gaming|games|video ?game/ },
      { slug: "encontros-de-carros", teste: /\bcars?\b|auto ?show|automotive|motor|carros/ },
      { slug: "feiras", teste: /fair|feira|expo|market|mercado/ },
    ],
  },
};

/** Palavras fortes no título refinam quando o gênero só levou à mãe (ou não veio gênero). */
const REGRAS_TITULO: Regra[] = [
  { slug: "roda-de-samba", teste: /roda de samba/ },
  { slug: "samba-de-raiz", teste: /samba de raiz/ },
  { slug: "samba-de-roda", teste: /samba de roda/ },
  { slug: "ensaios-de-escola-de-samba", teste: /ensaio.*escola de samba|escola de samba/ },
  { slug: "partido-alto", teste: /partido[- ]alto/ },
  { slug: "samba-rock", teste: /samba[- ]rock/ },
  { slug: "pagode", teste: /pagode/ },
  { slug: "samba", teste: /\bsamba\b/ },
  { slug: "forro", teste: /forro/ },
  { slug: "rap-e-rima", teste: /batalha de rima|\brap\b/ },
  { slug: "batalhas-e-campeonatos", teste: /batalha de danca|campeonato de danca|battle/ },
  { slug: "danca-de-salao", teste: /danca de salao|baile/ },
  { slug: "sertanejo", teste: /sertanej/ },
  { slug: "festivais-de-musica", teste: /\bfestival\b.*\bmusic|\bmusic.*\bfestival\b/ },
  { slug: "festivais-gastronomicos", teste: /festival gastronom|food festival|gastronom/ },
  { slug: "anime", teste: /\banime\b/ },
  { slug: "comic-con", teste: /comic ?con|ccxp/ },
  { slug: "cosplay", teste: /cosplay/ },
  { slug: "rpg-e-board-games", teste: /\brpg\b|board ?game|jogos de tabuleiro/ },
  { slug: "corrida", teste: /corrida|maratona|\brun\b/ },
  { slug: "xadrez", teste: /xadrez|chess/ },
  { slug: "judo-e-lutas", teste: /judo|\bufc\b|\bmma\b|jiu[- ]?jitsu|boxe/ },
  { slug: "natacao", teste: /natacao/ },
  { slug: "ciclismo", teste: /ciclismo|pedal/ },
  { slug: "stand-up", teste: /stand[- ]?up|comedia/ },
  { slug: "circo", teste: /\bcirco\b|circus/ },
  { slug: "museus", teste: /\bmuseu/ },
  { slug: "arte-de-rua", teste: /arte de rua|grafite|graffiti/ },
  { slug: "encontros-de-carros", teste: /encontro de carros|carros antigos/ },
];

/**
 * Cena nomeada no título vence o gênero genérico de outro segmento: "Samba nas Alturas" vem como
 * Arts & Theatre / Fine Art, mas é samba. Só fora de Música (lá o gênero já resolve) e de Esportes.
 */
const TITULO_VENCE = new Set<SlugCategoria>([
  "roda-de-samba",
  "samba-de-raiz",
  "samba-de-roda",
  "ensaios-de-escola-de-samba",
  "partido-alto",
  "samba-rock",
  "pagode",
  "samba",
  "rap-e-rima",
]);

const MAES = new Set<SlugCategoria>(CATEGORIAS_ARVORE.map((m) => m.slug));
const ESPORTES = new Set<SlugCategoria>(
  CATEGORIAS_ARVORE.find((m) => m.slug === "esportes")!.filhas.map((f) => f.slug),
);

/**
 * Subcategoria do Culturama para um evento da Ticketmaster.
 * Ordem: gênero/subgênero dentro do segmento, depois palavras do título, depois a mãe do segmento.
 * Sem segmento conhecido, cai em Música, que é a maior parte do catálogo da Ticketmaster no Brasil.
 */
export function mapCategoriaSlug(evento: { name?: string; classifications?: TmClassificacao[] }): SlugCategoria {
  const c = evento.classifications?.find((x) => x.primary) ?? evento.classifications?.[0];
  const segmento = REGRAS_POR_SEGMENTO[normalizar(valido(c?.segment))];
  const generos = normalizar([c?.genre, c?.subGenre, c?.type, c?.subType].map(valido).filter(Boolean).join(" | "));
  const titulo = normalizar(evento.name);

  if (segmento?.mae !== "musica" && segmento?.mae !== "esportes") {
    const cena = REGRAS_TITULO.find((r) => TITULO_VENCE.has(r.slug) && r.teste.test(titulo));
    if (cena) return cena.slug;
  }

  const conjuntos = segmento ? [segmento] : Object.values(REGRAS_POR_SEGMENTO);
  for (const { regras } of conjuntos) {
    const regra = generos ? regras.find((r) => r.teste.test(generos)) : undefined;
    if (regra && !MAES.has(regra.slug)) return regra.slug;
  }

  const porTitulo = REGRAS_TITULO.find((r) => r.teste.test(titulo));
  if (porTitulo && (segmento?.mae !== "esportes" || porTitulo.slug === "games" || ESPORTES.has(porTitulo.slug))) {
    return porTitulo.slug;
  }

  for (const { regras } of conjuntos) {
    const regra = generos ? regras.find((r) => r.teste.test(generos)) : undefined;
    if (regra) return regra.slug;
  }
  return segmento?.mae ?? "musica";
}
