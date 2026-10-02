export type PapelPainel = "admin" | "moderador";

export type SecaoPainel =
  | "visao-geral"
  | "revisao"
  | "eventos"
  | "categorias"
  | "organizadores"
  | "usuarios"
  | "comentarios"
  | "denuncias"
  | "anuncios"
  | "historico";

const SECOES_MODERADOR = new Set<SecaoPainel>(["revisao", "eventos", "comentarios", "denuncias"]);

export function podeAcessar(papel: PapelPainel, secao: SecaoPainel): boolean {
  return papel === "admin" || SECOES_MODERADOR.has(secao);
}

/** Ações que só o admin faz mesmo dentro de seções que o moderador vê. */
export function podeExcluirEvento(papel: PapelPainel): boolean {
  return papel === "admin";
}

export function inicioDoPainel(papel: PapelPainel): string {
  return papel === "admin" ? "/admin" : "/admin/eventos";
}
