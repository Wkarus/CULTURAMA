import type { SlugCategoria } from "./categorias-dados";

/**
 * `terms.linguagem` do Mapas Culturais → slug da categoria do Culturama (ver `categorias-dados.ts`).
 * Para mapear uma linguagem nova, acrescente uma linha. A comparação ignora acento e maiúsculas.
 * A ordem é a prioridade: quando o evento tem várias linguagens, a primeira desta lista vira a categoria principal.
 * Linguagem fora da lista cai em "Outros" e aparece em `linguagensNaoMapeadas` no histórico do admin.
 */
export const LINGUAGEM_PARA_CATEGORIA: Record<string, SlugCategoria> = {
  "Curso ou Oficina": "oficinas",
  "Livro e Literatura": "literatura",
  Cinema: "cinema-e-audiovisual",
  Audiovisual: "cinema-e-audiovisual",
  Teatro: "teatro",
  "Artes Circenses": "circo",
  "Hip Hop": "rap-e-rima",
  Dança: "danca",
  Exposição: "exposicoes",
  "Artes Visuais": "arte-e-exposicao",
  "Música Erudita": "classica-e-concertos",
  "Cultura Tradicional": "cultura-popular",
  "Cultura Indígena": "cultura-popular",
  "Música Popular": "musica",
  Outros: "outros",
};

export const CATEGORIA_PADRAO: SlugCategoria = "outros";

function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const PRIORIDADE = new Map(Object.entries(LINGUAGEM_PARA_CATEGORIA).map(([linguagem, slug], i) => [chave(linguagem), { slug, i }]));

export type CategoriasDoEvento = {
  principal: SlugCategoria;
  /** Todas as categorias encontradas, na ordem de prioridade, sem repetir. */
  todas: SlugCategoria[];
  naoMapeadas: string[];
};

export function mapearLinguagens(linguagens: string[]): CategoriasDoEvento {
  const achadas: { slug: SlugCategoria; i: number }[] = [];
  const naoMapeadas: string[] = [];
  for (const linguagem of linguagens) {
    const regra = PRIORIDADE.get(chave(linguagem));
    if (regra) achadas.push(regra);
    else if (linguagem.trim()) naoMapeadas.push(linguagem.trim());
  }
  const todas = [...new Set(achadas.sort((a, b) => a.i - b.i).map((a) => a.slug))];
  const principal = todas.find((slug) => slug !== CATEGORIA_PADRAO) ?? CATEGORIA_PADRAO;
  return { principal, todas: todas.length ? todas : [CATEGORIA_PADRAO], naoMapeadas };
}
