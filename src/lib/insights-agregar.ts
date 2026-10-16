export const MINIMO_PESSOAS = 20;

export const PESO_INTERACAO = {
  visualizacao: 1,
  favorito: 3,
  como_chegar: 5,
  ingresso: 5,
} as const;

export type TipoInsight = keyof typeof PESO_INTERACAO;

export type FaixaInsight = "ate_17" | "de_18_a_24" | "de_25_a_34" | "de_35_a_44" | "de_45_a_54" | "de_55_ou_mais";

export const ROTULO_FAIXA: Record<FaixaInsight, string> = {
  ate_17: "Até 17",
  de_18_a_24: "18–24",
  de_25_a_34: "25–34",
  de_35_a_44: "35–44",
  de_45_a_54: "45–54",
  de_55_ou_mais: "55+",
};

export const FAIXAS_ORDEM: FaixaInsight[] = [
  "ate_17",
  "de_18_a_24",
  "de_25_a_34",
  "de_35_a_44",
  "de_45_a_54",
  "de_55_ou_mais",
];

export type FiltrosInsights = {
  dias: 7 | 30 | 90;
  regiao: string | null;
  categoria: string | null;
};

export type LinhaInsight = {
  eventoId: string;
  titulo: string;
  tipo: TipoInsight;
  data: Date;
  categoria: string;
  bairro: string;
  cidade: string;
  faixa: FaixaInsight | null;
  coorte: string | null;
  patrocinado: boolean;
  temOrganizador: boolean;
};

export type MetricaPessoas = number | "insuficiente";

export type PainelInsights = {
  demo: boolean;
  total: number;
  categoriaEmAlta: string | null;
  maiorCrescimento: { categoria: string; variacao: number | null } | null;
  ranking: { eventoId: string; titulo: string; indice: number; categoria: string; regiao: string }[];
  crescimento: { categoria: string; atual: number; anterior: number; variacao: number | null }[];
  bairros: { nome: string; indice: number }[];
  bairrosInsuficientes: boolean;
  faixas: { faixa: FaixaInsight; rotulo: string; pessoas: MetricaPessoas }[];
  tambemCurte: { categoria: string; pessoas: number }[] | "insuficiente";
  oportunidades: { eventoId: string; titulo: string; indice: number; categoria: string }[];
  regioes: string[];
  categorias: string[];
};

const DIA = 86_400_000;

export function lerFiltros(origem: URLSearchParams | { dias?: string; regiao?: string; categoria?: string }): FiltrosInsights {
  const ler = (nome: "dias" | "regiao" | "categoria") => (origem instanceof URLSearchParams ? origem.get(nome) : (origem[nome] ?? null));
  const diasRaw = Number(ler("dias"));
  const dias = diasRaw === 7 || diasRaw === 90 ? diasRaw : 30;
  const regiao = (ler("regiao") ?? "").trim() || null;
  const categoria = (ler("categoria") ?? "").trim() || null;
  return { dias, regiao, categoria };
}

function noIntervalo(data: Date, inicio: Date, fim: Date, fimInclusivo = true) {
  return data >= inicio && (fimInclusivo ? data <= fim : data < fim);
}

function casaFiltro(linha: LinhaInsight, filtros: FiltrosInsights) {
  if (filtros.categoria && linha.categoria !== filtros.categoria) return false;
  if (!filtros.regiao) return true;
  return linha.cidade === filtros.regiao || linha.bairro === filtros.regiao;
}

function regiaoDaLinha(linha: LinhaInsight) {
  if (linha.bairro && linha.cidade) return `${linha.bairro}, ${linha.cidade}`;
  return linha.bairro || linha.cidade || "Sem região";
}

function pessoasDe(coortes: Set<string>): MetricaPessoas {
  return coortes.size >= MINIMO_PESSOAS ? coortes.size : "insuficiente";
}

export function agregar(linhas: LinhaInsight[], filtros: FiltrosInsights, demo: boolean, agora = new Date()): PainelInsights {
  const fim = agora;
  const inicio = new Date(fim.getTime() - filtros.dias * DIA);
  const inicioAnterior = new Date(inicio.getTime() - filtros.dias * DIA);
  const janelaOpcoes = new Date(fim.getTime() - 90 * DIA);

  const opcoes = linhas.filter((linha) => noIntervalo(linha.data, janelaOpcoes, fim));
  const regioes = [...new Set(opcoes.flatMap((linha) => [linha.cidade, linha.bairro].filter(Boolean)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const categorias = [...new Set(opcoes.map((linha) => linha.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const atual = linhas.filter((linha) => noIntervalo(linha.data, inicio, fim) && casaFiltro(linha, filtros));
  const anterior = linhas.filter((linha) => noIntervalo(linha.data, inicioAnterior, inicio, false) && casaFiltro(linha, filtros));

  const porCategoria = (lista: LinhaInsight[]) => {
    const mapa = new Map<string, number>();
    for (const linha of lista) mapa.set(linha.categoria, (mapa.get(linha.categoria) ?? 0) + 1);
    return mapa;
  };
  const contasAtuais = porCategoria(atual);
  const contasAnteriores = porCategoria(anterior);

  const categoriaEmAlta = [...contasAtuais.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))[0]?.[0] ?? null;

  const nomes = new Set([...contasAtuais.keys(), ...contasAnteriores.keys()]);
  const crescimento = [...nomes]
    .map((categoria) => {
      const agoraTotal = contasAtuais.get(categoria) ?? 0;
      const antes = contasAnteriores.get(categoria) ?? 0;
      const variacao = antes > 0 ? (agoraTotal - antes) / antes : null;
      return { categoria, atual: agoraTotal, anterior: antes, variacao };
    })
    .sort((a, b) => b.atual - a.atual || a.categoria.localeCompare(b.categoria, "pt-BR"));

  const comBase = crescimento.filter((item) => item.variacao !== null);
  const maiorBase = comBase.sort((a, b) => (b.variacao ?? 0) - (a.variacao ?? 0))[0];
  const maiorNova = crescimento.filter((item) => item.variacao === null && item.atual > 0).sort((a, b) => b.atual - a.atual)[0];
  const maiorCrescimento = maiorBase
    ? { categoria: maiorBase.categoria, variacao: maiorBase.variacao }
    : maiorNova
      ? { categoria: maiorNova.categoria, variacao: null }
      : null;

  const eventos = new Map<string, { titulo: string; indice: number; categoria: string; regiao: string; patrocinado: boolean; temOrganizador: boolean }>();
  for (const linha of atual) {
    const item = eventos.get(linha.eventoId) ?? {
      titulo: linha.titulo,
      indice: 0,
      categoria: linha.categoria,
      regiao: regiaoDaLinha(linha),
      patrocinado: linha.patrocinado,
      temOrganizador: linha.temOrganizador,
    };
    item.indice += PESO_INTERACAO[linha.tipo];
    item.patrocinado = item.patrocinado || linha.patrocinado;
    item.temOrganizador = item.temOrganizador || linha.temOrganizador;
    eventos.set(linha.eventoId, item);
  }

  const ranking = [...eventos.entries()]
    .map(([eventoId, item]) => ({ eventoId, titulo: item.titulo, indice: item.indice, categoria: item.categoria, regiao: item.regiao }))
    .sort((a, b) => b.indice - a.indice || a.titulo.localeCompare(b.titulo, "pt-BR"))
    .slice(0, 10);

  const bairrosMapa = new Map<string, { indice: number; coortes: Set<string> }>();
  for (const linha of atual) {
    const nome = linha.bairro || linha.cidade;
    if (!nome) continue;
    const item = bairrosMapa.get(nome) ?? { indice: 0, coortes: new Set<string>() };
    item.indice += PESO_INTERACAO[linha.tipo];
    if (linha.coorte) item.coortes.add(linha.coorte);
    bairrosMapa.set(nome, item);
  }
  const bairrosTodos = [...bairrosMapa.entries()];
  const bairros = bairrosTodos
    .filter(([, item]) => item.coortes.size >= MINIMO_PESSOAS)
    .map(([nome, item]) => ({ nome, indice: item.indice }))
    .sort((a, b) => b.indice - a.indice || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, 8);

  const faixas = FAIXAS_ORDEM.map((faixa) => {
    const coortes = new Set(atual.filter((linha) => linha.faixa === faixa && linha.coorte).map((linha) => linha.coorte as string));
    return { faixa, rotulo: ROTULO_FAIXA[faixa], pessoas: pessoasDe(coortes) };
  }).filter((item) => atual.some((linha) => linha.faixa === item.faixa));

  const referencia = filtros.categoria ?? categoriaEmAlta;
  let tambemCurte: PainelInsights["tambemCurte"] = "insuficiente";
  if (referencia) {
    const publico = new Set(atual.filter((linha) => linha.categoria === referencia && linha.coorte).map((linha) => linha.coorte as string));
    if (publico.size >= MINIMO_PESSOAS) {
      const outras = new Map<string, Set<string>>();
      for (const linha of atual) {
        if (!linha.coorte || linha.categoria === referencia || !publico.has(linha.coorte)) continue;
        const grupo = outras.get(linha.categoria) ?? new Set<string>();
        grupo.add(linha.coorte);
        outras.set(linha.categoria, grupo);
      }
      const lista = [...outras.entries()]
        .filter(([, grupo]) => grupo.size >= MINIMO_PESSOAS)
        .map(([categoria, grupo]) => ({ categoria, pessoas: grupo.size }))
        .sort((a, b) => b.pessoas - a.pessoas || a.categoria.localeCompare(b.categoria, "pt-BR"));
      tambemCurte = lista.length > 0 ? lista : "insuficiente";
    }
  }

  const oportunidades = [...eventos.entries()]
    .filter(([, item]) => !item.patrocinado && item.temOrganizador && item.indice > 0)
    .map(([eventoId, item]) => ({ eventoId, titulo: item.titulo, indice: item.indice, categoria: item.categoria }))
    .sort((a, b) => b.indice - a.indice || a.titulo.localeCompare(b.titulo, "pt-BR"))
    .slice(0, 6);

  return {
    demo,
    total: atual.length,
    categoriaEmAlta,
    maiorCrescimento,
    ranking,
    crescimento,
    bairros,
    bairrosInsuficientes: bairros.length === 0 && bairrosTodos.length > 0,
    faixas,
    tambemCurte,
    oportunidades,
    regioes,
    categorias,
  };
}

function celula(valor: string | number) {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function linhaCsv(colunas: (string | number)[]) {
  return colunas.map(celula).join(",");
}

export function paraCsv(painel: PainelInsights): string {
  const linhas: string[] = [];
  if (painel.demo) linhas.push("# Dados de demonstração");
  linhas.push(linhaCsv(["secao", "nome", "valor"]));
  linhas.push(linhaCsv(["resumo", "interacoes", painel.total]));
  linhas.push(linhaCsv(["resumo", "categoria_em_alta", painel.categoriaEmAlta ?? ""]));
  linhas.push(
    linhaCsv([
      "resumo",
      "maior_crescimento",
      painel.maiorCrescimento ? `${painel.maiorCrescimento.categoria};${painel.maiorCrescimento.variacao ?? "nova"}` : "",
    ]),
  );
  for (const item of painel.ranking) linhas.push(linhaCsv(["ranking", item.titulo, item.indice]));
  for (const item of painel.crescimento) linhas.push(linhaCsv(["crescimento", item.categoria, item.variacao ?? "nova"]));
  if (painel.bairrosInsuficientes) linhas.push(linhaCsv(["bairros", "dados insuficientes", ""]));
  for (const item of painel.bairros) linhas.push(linhaCsv(["bairros", item.nome, item.indice]));
  for (const item of painel.faixas) linhas.push(linhaCsv(["faixa", item.rotulo, item.pessoas === "insuficiente" ? "dados insuficientes" : item.pessoas]));
  if (painel.tambemCurte === "insuficiente") linhas.push(linhaCsv(["tambem_curte", "dados insuficientes", ""]));
  else for (const item of painel.tambemCurte) linhas.push(linhaCsv(["tambem_curte", item.categoria, item.pessoas]));
  for (const item of painel.oportunidades) linhas.push(linhaCsv(["oportunidade", item.titulo, item.indice]));
  return `\uFEFF${linhas.join("\n")}\n`;
}
