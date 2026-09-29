function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCnpj(value: string): string {
  return onlyDigits(value);
}

export type CnpjLookup =
  | { ok: true; razaoSocial: string; situacao: string }
  | { ok: false; message: string };

export async function lookupCnpj(value: string): Promise<CnpjLookup> {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) {
    return { ok: false, message: "CNPJ precisa ter 14 dígitos." };
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return { ok: false, message: "CNPJ não encontrado na Receita Federal." };
  }

  if (!response.ok) {
    return { ok: false, message: "Não foi possível validar o CNPJ agora. Tente de novo." };
  }

  const data = (await response.json()) as {
    razao_social?: string;
    descricao_situacao_cadastral?: string;
  };

  const situacao = (data.descricao_situacao_cadastral ?? "").toUpperCase();
  if (situacao && situacao !== "ATIVA") {
    return { ok: false, message: `CNPJ não está ativo (situação: ${data.descricao_situacao_cadastral}).` };
  }

  return {
    ok: true,
    razaoSocial: data.razao_social ?? "",
    situacao: data.descricao_situacao_cadastral ?? "ATIVA",
  };
}
