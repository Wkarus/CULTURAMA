export const OBSERVACAO_INDISPONIVEL = "Validação automática indisponível";

export const CODIGOS_RECUSA = [
  "DOCUMENTO_INVALIDO",
  "CNPJ_NAO_ENCONTRADO",
  "CNPJ_INATIVO",
  "DOCUMENTO_JA_CADASTRADO",
  "MENOR_DE_IDADE",
  "ARQUIVO_INVALIDO",
] as const;

export type CodigoRecusa = (typeof CODIGOS_RECUSA)[number];

export const MOTIVOS_MANUAIS = [
  {
    codigo: "DOCUMENTO_ILEGIVEL",
    rotulo: "Documento ilegível",
    como: "Envie um PDF, JPG ou PNG em que o documento dê para ler.",
  },
  {
    codigo: "DADOS_NAO_CONFEREM",
    rotulo: "Dados não conferem",
    como: "Confira se o nome e o documento são os mesmos do cadastro.",
  },
  {
    codigo: "FORA_DO_ESCOPO",
    rotulo: "Atividade fora do escopo do Culturama",
    como: "O Culturama publica eventos culturais. Ajuste a proposta ou fale com a gente.",
  },
  {
    codigo: "OUTRO",
    rotulo: "Outro",
    como: "Se tiver dúvidas, responda este e-mail.",
  },
] as const;

export type CodigoManual = (typeof MOTIVOS_MANUAIS)[number]["codigo"];

const TEXTOS_RECUSA: Record<CodigoRecusa, { motivo: string; como: string }> = {
  DOCUMENTO_INVALIDO: {
    motivo: "O número do documento informado não é válido.",
    como: "Confira se digitou todos os números corretamente.",
  },
  CNPJ_NAO_ENCONTRADO: {
    motivo: "Não encontramos esse CNPJ na base da Receita Federal.",
    como: "Confira o número ou envie o pedido com o CPF do responsável.",
  },
  CNPJ_INATIVO: {
    motivo: "Esse CNPJ não está ativo na Receita Federal.",
    como: "Use um CNPJ ativo ou o CPF do responsável.",
  },
  DOCUMENTO_JA_CADASTRADO: {
    motivo: "Esse documento já está vinculado a outra conta.",
    como: "Entre com a conta original ou fale com a gente respondendo este e-mail.",
  },
  MENOR_DE_IDADE: {
    motivo: "Só pessoas com 18 anos ou mais podem publicar eventos.",
    como: "Peça para um responsável maior de idade fazer o cadastro.",
  },
  ARQUIVO_INVALIDO: {
    motivo: "O arquivo do documento está ausente ou em um formato que não aceitamos.",
    como: "Envie um PDF, JPG ou PNG legível.",
  },
};

const LIMITE_ARQUIVO = 5 * 1024 * 1024;
const TIPOS_ARQUIVO = new Set(["application/pdf", "image/jpeg", "image/png"]);

export function textoRecusa(codigo: CodigoRecusa) {
  return TEXTOS_RECUSA[codigo];
}

export function motivoManual(codigo: string) {
  return MOTIVOS_MANUAIS.find((item) => item.codigo === codigo) ?? null;
}

export function documentoMascarado(tipo: string, documento: string) {
  const digitos = documento.replace(/\D/g, "");
  const fim = (digitos.slice(-4) || "").padStart(4, "•");
  return `${tipo} ••••${fim}`;
}

export function arquivoDocumentoInvalido(arquivo: unknown, obrigatorio: boolean) {
  if (!(arquivo instanceof File) || arquivo.size === 0) return obrigatorio;
  if (arquivo.size > LIMITE_ARQUIVO) return true;
  if (!TIPOS_ARQUIVO.has(arquivo.type)) return true;
  return false;
}

export type ConsultaPedido = "nao_aplica" | "ativa" | "nao_encontrado" | "inativo" | "indisponivel";

export type AvaliacaoPedido =
  | { destino: "recusado"; codigo: CodigoRecusa }
  | { destino: "fila"; observacao: string | null; checagem: string }
  | { destino: "aprovado"; checagem: string };

export function avaliarPedido(entrada: {
  perfil: "organizador" | "empresa";
  tipoDocumento: "CPF" | "CNPJ";
  documentoValido: boolean;
  documentoJaUsado: boolean;
  menorDeIdade: boolean;
  arquivoInvalido: boolean;
  consulta: ConsultaPedido;
  modoTeste: boolean;
}): AvaliacaoPedido {
  if (!entrada.documentoValido) return { destino: "recusado", codigo: "DOCUMENTO_INVALIDO" };

  const pulaReceita = entrada.modoTeste && entrada.perfil === "organizador";
  if (!pulaReceita && entrada.consulta === "nao_encontrado") {
    return { destino: "recusado", codigo: "CNPJ_NAO_ENCONTRADO" };
  }
  if (!pulaReceita && entrada.consulta === "inativo") {
    return { destino: "recusado", codigo: "CNPJ_INATIVO" };
  }
  if (entrada.documentoJaUsado) return { destino: "recusado", codigo: "DOCUMENTO_JA_CADASTRADO" };
  if (entrada.menorDeIdade) return { destino: "recusado", codigo: "MENOR_DE_IDADE" };
  if (entrada.arquivoInvalido) return { destino: "recusado", codigo: "ARQUIVO_INVALIDO" };

  if (!pulaReceita && entrada.consulta === "indisponivel") {
    return { destino: "fila", observacao: OBSERVACAO_INDISPONIVEL, checagem: OBSERVACAO_INDISPONIVEL };
  }

  if (entrada.perfil === "organizador" && entrada.tipoDocumento === "CNPJ" && entrada.consulta === "ativa" && !entrada.modoTeste) {
    return { destino: "aprovado", checagem: "CNPJ ativo na Receita Federal." };
  }

  const checagem =
    entrada.tipoDocumento === "CPF"
      ? "CPF com dígito válido, aguardando análise"
      : entrada.modoTeste
        ? "CNPJ com dígito válido, aguardando análise"
        : "CNPJ ativo na Receita Federal, aguardando análise";
  return { destino: "fila", observacao: null, checagem };
}

export function textoMotivoVisivel(codigo: string | null, texto: string | null) {
  if (codigo && codigo in TEXTOS_RECUSA) return TEXTOS_RECUSA[codigo as CodigoRecusa].motivo;
  const manual = codigo ? motivoManual(codigo) : null;
  const livre = texto?.trim();
  if (manual && livre) return `${manual.rotulo}. ${livre}`;
  if (manual) return manual.rotulo;
  return livre || "A equipe não informou um motivo.";
}
