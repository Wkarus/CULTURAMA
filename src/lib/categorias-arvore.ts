/** Funções puras sobre a lista de categorias. Sem Prisma: podem rodar no cliente. */

export type CategoriaBase = {
  id: string;
  nome: string;
  slug: string;
  icone: string;
  parentId: string | null;
  ordem: number;
};

export type MaeComFilhas<T extends CategoriaBase> = T & { filhas: T[] };

const porOrdem = (a: CategoriaBase, b: CategoriaBase) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR");

export function montarArvore<T extends CategoriaBase>(lista: T[]): MaeComFilhas<T>[] {
  return lista
    .filter((c) => !c.parentId)
    .sort(porOrdem)
    .map((mae) => ({ ...mae, filhas: lista.filter((c) => c.parentId === mae.id).sort(porOrdem) }));
}

/** Aceita slug (formato atual), id ou nome (links e interesses antigos). */
export function acharCategoria<T extends CategoriaBase>(lista: T[], valor: string | null | undefined): T | undefined {
  if (!valor) return undefined;
  const chave = valor.trim().toLowerCase();
  return (
    lista.find((c) => c.slug === chave) ??
    lista.find((c) => c.id === valor) ??
    lista.find((c) => c.nome.toLowerCase() === chave)
  );
}

/** Ids que um filtro de categoria cobre: a mãe inclui todas as filhas. `null` quando não há filtro. */
export function idsDaCategoria(lista: CategoriaBase[], valor: string | null | undefined): string[] | null {
  if (!valor) return null;
  const cat = acharCategoria(lista, valor);
  if (!cat) return [];
  return [cat.id, ...lista.filter((c) => c.parentId === cat.id).map((c) => c.id)];
}

/** Ids de categoria cobertos pelos interesses: escolher a mãe conta como todas as filhas. */
export function expandirInteresses(lista: CategoriaBase[], interesses: string[]): Set<string> {
  const ids = new Set<string>();
  for (const valor of interesses) {
    for (const id of idsDaCategoria(lista, valor) ?? []) ids.add(id);
  }
  return ids;
}

/**
 * Deixa os interesses na forma canônica: só slugs conhecidos, sem filha cuja mãe já está marcada,
 * e com a mãe no lugar quando todas as filhas foram marcadas.
 */
export function normalizarInteresses(lista: CategoriaBase[], valores: string[]): string[] {
  const marcadas = new Set<string>();
  for (const valor of valores) {
    const cat = acharCategoria(lista, valor);
    if (cat) marcadas.add(cat.id);
  }

  const resultado: string[] = [];
  for (const mae of montarArvore(lista)) {
    const filhasMarcadas = mae.filhas.filter((f) => marcadas.has(f.id));
    if (marcadas.has(mae.id) || (mae.filhas.length > 0 && filhasMarcadas.length === mae.filhas.length)) {
      resultado.push(mae.slug);
    } else {
      resultado.push(...filhasMarcadas.map((f) => f.slug));
    }
  }
  return resultado;
}
