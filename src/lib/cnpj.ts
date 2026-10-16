function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCnpj(value: string): string {
  return onlyDigits(value);
}

function digitoCnpj(base: string, pesos: number[]): number {
  const total = base.split("").reduce((soma, digito, indice) => soma + Number(digito) * pesos[indice], 0);
  const resto = total % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d1 = digitoCnpj(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cnpj[12])) return false;
  const d2 = digitoCnpj(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cnpj[13]);
}

export function modoTesteOrganizador() {
  return process.env.ORGANIZADOR_MODO_TESTE === "true";
}

export type ConsultaCnpj =
  | { resultado: "ativa"; razaoSocial: string }
  | { resultado: "nao_encontrado" }
  | { resultado: "inativo" }
  | { resultado: "indisponivel" }
  | { resultado: "invalido" };

export async function lookupCnpj(value: string): Promise<ConsultaCnpj> {
  const cnpj = normalizeCnpj(value);
  if (!isValidCnpj(cnpj)) return { resultado: "invalido" };

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status === 404) return { resultado: "nao_encontrado" };
    if (!response.ok) return { resultado: "indisponivel" };

    const data = (await response.json()) as {
      razao_social?: string;
      descricao_situacao_cadastral?: string;
    };
    const situacao = (data.descricao_situacao_cadastral ?? "").trim().toUpperCase();
    if (!situacao) return { resultado: "indisponivel" };
    if (situacao !== "ATIVA") return { resultado: "inativo" };
    return { resultado: "ativa", razaoSocial: data.razao_social ?? "" };
  } catch {
    return { resultado: "indisponivel" };
  }
}
