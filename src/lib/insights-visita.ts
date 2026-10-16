export const JANELA_VISITA_MS = 30 * 60 * 1000;

export type MarcaVisita = { e: string; t: string; a: number };

export function marcasVigentes(marcas: MarcaVisita[], agora: number): MarcaVisita[] {
  return marcas.filter((marca) => agora - marca.a >= 0 && agora - marca.a < JANELA_VISITA_MS);
}

/** Mesmo visitante, mesmo evento e mesmo tipo dentro de 30 minutos. */
export function visitaRepetida(marcas: MarcaVisita[], eventoId: string, tipo: string, agora: number): boolean {
  return marcasVigentes(marcas, agora).some((marca) => marca.e === eventoId && marca.t === tipo);
}
