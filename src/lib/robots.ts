/**
 * Leitura de robots.txt conforme a RFC 9309: grupos por user-agent (token do produto, sem diferenciar maiúsculas),
 * vale a regra de padrão mais longo, `allow` ganha empate, `*` casa qualquer trecho e `$` ancora o fim.
 */

type Regra = { permitir: boolean; padrao: string };
type Grupo = { agentes: string[]; regras: Regra[] };

const LIMITE_BYTES = 500 * 1024;

function lerGrupos(texto: string): Grupo[] {
  const grupos: Grupo[] = [];
  let atual: Grupo | null = null;
  let lendoAgentes = false;
  for (const bruta of texto.slice(0, LIMITE_BYTES).split(/\r\n|\r|\n/)) {
    const campo = bruta.replace(/#.*/, "").trim().match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!campo) continue;
    const nome = campo[1].toLowerCase();
    const valor = campo[2].trim();
    if (nome === "user-agent") {
      if (!atual || !lendoAgentes) {
        atual = { agentes: [], regras: [] };
        grupos.push(atual);
      }
      atual.agentes.push(valor.toLowerCase());
      lendoAgentes = true;
    } else if ((nome === "allow" || nome === "disallow") && atual) {
      lendoAgentes = false;
      if (valor) atual.regras.push({ permitir: nome === "allow", padrao: valor });
    }
  }
  return grupos;
}

function casa(padrao: string, caminho: string): boolean {
  const ancorado = padrao.endsWith("$");
  const corpo = (ancorado ? padrao.slice(0, -1) : padrao)
    .split("*")
    .map((parte) => parte.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${corpo}${ancorado ? "$" : ""}`).test(caminho);
}

/** Token do produto: "Culturama/0.1 (...)" → "culturama". */
export function tokenDoRobo(userAgent: string): string {
  return (userAgent.trim().split(/[\s/]/)[0] ?? "").toLowerCase();
}

export function robotsPermite(texto: string, userAgent: string, caminho: string): boolean {
  const grupos = lerGrupos(texto);
  const token = tokenDoRobo(userAgent);
  const meus = grupos.filter((g) => token && g.agentes.includes(token));
  const aplicaveis = meus.length ? meus : grupos.filter((g) => g.agentes.includes("*"));

  let melhor: Regra | null = null;
  for (const regra of aplicaveis.flatMap((g) => g.regras)) {
    if (!casa(regra.padrao, caminho)) continue;
    if (!melhor || regra.padrao.length > melhor.padrao.length || (regra.padrao.length === melhor.padrao.length && regra.permitir)) {
      melhor = regra;
    }
  }
  return melhor?.permitir ?? true;
}
