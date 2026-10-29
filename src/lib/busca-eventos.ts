import type { EventSearchParams } from "@/lib/event-filters";

const FUSO = "America/Sao_Paulo";
const CHAVES = ["q", "categoria", "de", "ate", "preco", "distancia", "lat", "lng", "acessivel"] as const;

export function diaISO(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function calendario(date: Date): { ano: number; mes: number; dia: number; semana: number } {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(date)
      .map((parte) => [parte.type, parte.value]),
  );
  const semana = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[partes.weekday ?? ""] ?? 0;
  return { ano: Number(partes.year), mes: Number(partes.month), dia: Number(partes.day), semana };
}

function isoMaisDias(ano: number, mes: number, dia: number, dias: number): string {
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  const m = String(data.getUTCMonth() + 1).padStart(2, "0");
  const d = String(data.getUTCDate()).padStart(2, "0");
  return `${data.getUTCFullYear()}-${m}-${d}`;
}

/** Sábado e domingo deste fim de semana. No domingo, inclui o sábado que já passou. */
export function fimDeSemana(agora = new Date()): { de: string; ate: string } {
  const { ano, mes, dia, semana } = calendario(agora);
  const ateSabado = semana === 0 ? -1 : 6 - semana;
  const de = isoMaisDias(ano, mes, dia, ateSabado);
  return { de, ate: isoMaisDias(ano, mes, dia, ateSabado + 1) };
}

export function ehHoje(params: EventSearchParams, agora = new Date()): boolean {
  const hoje = diaISO(agora);
  return params.de === hoje && params.ate === hoje;
}

export function ehFimDeSemana(params: EventSearchParams, agora = new Date()): boolean {
  const fim = fimDeSemana(agora);
  return params.de === fim.de && params.ate === fim.ate;
}

export function corDaCategoria(slug: string): string {
  return /^[a-z0-9-]+$/.test(slug) ? `var(--cat-${slug}, var(--cat-outros))` : "var(--cat-outros)";
}

/** Monta a query da lista ou do mapa. Valor `null` apaga a chave. `todos` e `todas` não entram na URL. */
export function hrefBusca(base: "/eventos" | "/mapa", params: EventSearchParams, patch: Partial<Record<(typeof CHAVES)[number], string | null>> = {}): string {
  const next = new URLSearchParams();
  for (const chave of CHAVES) {
    const valor = chave in patch ? patch[chave] : params[chave];
    const limpo = (valor ?? "").trim();
    if (!limpo || limpo === "todos" || limpo === "todas") continue;
    next.set(chave, limpo);
  }
  const query = next.toString();
  return query ? `${base}?${query}` : base;
}

export function temFiltro(params: EventSearchParams): boolean {
  return CHAVES.some((chave) => {
    const valor = (params[chave] ?? "").trim();
    return Boolean(valor) && valor !== "todos" && valor !== "todas";
  });
}
