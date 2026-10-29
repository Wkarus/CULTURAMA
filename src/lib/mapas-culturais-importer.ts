import type { Category, EventStatus, Prisma } from "@prisma/client";
import { semearCategorias } from "@/lib/categorias-dados";
import { geocodeEndereco } from "@/lib/geocode";
import { ClienteMapas, coletarInstancia, InstanciaPulada, type ColetaInstancia, type EventoNormalizado } from "@/lib/mapas-culturais";
import { CATEGORIA_PADRAO, LINGUAGEM_PARA_CATEGORIA } from "@/lib/mapas-culturais-categorias";
import { descreverRegiao, lerConfigMapas, normalizarUrlBase, type ConfigMapas } from "@/lib/mapas-culturais-config";
import { prisma } from "@/lib/prisma";

const FONTE = "mapas_culturais" as const;
/** Status que a importação controla. Os demais (cancelado = oculto, rascunho, adiado, em revisão) são decisão da equipe. */
const STATUS_DA_IMPORTACAO: EventStatus[] = ["importado", "publicado", "inativo"];
const PAUSA_GEOCODE_MS = 1100;

export type ResumoInstancia = {
  instancia: string;
  nome: string;
  ok: boolean;
  /** Pulada por robots.txt ou desafio anti-robô: nada gravado nem inativado. */
  pulada: boolean;
  ocorrencias: number;
  foraDaRegiao: number;
  recebidos: number;
  criados: number;
  atualizados: number;
  reativados: number;
  inativados: number;
  semCoordenadas: number;
  geocodificados: number;
  linguagensNaoMapeadas: string[];
  erros: string[];
};

export type ResultadoImportacao =
  | { ok: true; regiao: string; instancias: ResumoInstancia[]; importados: number }
  | { ok: false; message: string; regiao?: string; instancias: ResumoInstancia[] };

async function categoriasPorSlug(): Promise<Map<string, Category>> {
  const precisa = new Set<string>([CATEGORIA_PADRAO, ...Object.values(LINGUAGEM_PARA_CATEGORIA)]);
  let lista = await prisma.category.findMany();
  if ([...precisa].some((slug) => !lista.some((c) => c.slug === slug))) {
    await semearCategorias(prisma);
    lista = await prisma.category.findMany();
  }
  return new Map(lista.map((c) => [c.slug, c]));
}

function proximoStatus(atual: EventStatus | undefined, encerrado: boolean): EventStatus {
  if (!atual) return encerrado ? "inativo" : "importado";
  if (!STATUS_DA_IMPORTACAO.includes(atual)) return atual;
  if (encerrado) return "inativo";
  return atual === "inativo" ? "importado" : atual;
}

function conteudo(n: EventoNormalizado, categoriaId: string | undefined) {
  return {
    titulo: n.titulo,
    descricao: n.descricao,
    categoriaId,
    dataHora: n.dataHora,
    dataFim: n.dataFim,
    endereco: n.endereco,
    imagemCapa: n.imagemCapa,
    gratuito: n.gratuito,
    tags: n.tags,
    restricaoIdade: n.restricaoIdade,
    linkSaibaMais: n.linkSaibaMais,
    libras: n.libras,
    audiodescricao: n.audiodescricao,
    acessibilidade: n.acessibilidade,
    inscricoes: n.inscricoes,
    siteEvento: n.siteEvento,
    instagramEvento: n.instagramEvento,
  } satisfies Prisma.EventUncheckedUpdateInput;
}

async function gravarInstancia(coleta: ColetaInstancia, categorias: Map<string, Category>, config: ConfigMapas, agora: Date) {
  const instancia = coleta.instancia.url;
  const resumo: ResumoInstancia = {
    instancia,
    nome: coleta.instancia.nome,
    ok: true,
    pulada: false,
    ocorrencias: coleta.ocorrencias,
    foraDaRegiao: coleta.foraDaRegiao,
    recebidos: coleta.eventos.length,
    criados: 0,
    atualizados: 0,
    reativados: 0,
    inativados: 0,
    semCoordenadas: 0,
    geocodificados: 0,
    linguagensNaoMapeadas: coleta.linguagensNaoMapeadas,
    erros: [...coleta.erros],
  };

  const existentes = new Map(
    (
      await prisma.event.findMany({
        where: { fonte: FONTE, fonteInstancia: instancia },
        select: { id: true, idExterno: true, status: true, editadoPelaEquipe: true, endereco: true, latitude: true, longitude: true },
      })
    ).map((e) => [e.idExterno ?? "", e]),
  );

  let geocodesRestantes = config.geocodeMax;
  for (const n of coleta.eventos) {
    try {
      const atual = existentes.get(n.idExterno);
      const status = proximoStatus(atual?.status, n.encerrado);
      const categoriaId = (categorias.get(n.categoriaSlug) ?? categorias.get(CATEGORIA_PADRAO))?.id;

      let coords = n.latitude !== null && n.longitude !== null ? { lat: n.latitude, lng: n.longitude } : null;
      const coordsAntigas = atual && !(atual.latitude === 0 && atual.longitude === 0) && atual.endereco === n.endereco;
      if (!coords && coordsAntigas) coords = { lat: atual.latitude, lng: atual.longitude };
      if (!coords && n.enderecoGeocodificavel && geocodesRestantes > 0) {
        geocodesRestantes -= 1;
        await new Promise((resolve) => setTimeout(resolve, PAUSA_GEOCODE_MS));
        coords = await geocodeEndereco(`${n.enderecoGeocodificavel}, Brasil`).catch(() => null);
        if (coords) resumo.geocodificados += 1;
      }
      if (!coords) resumo.semCoordenadas += 1;

      if (!atual) {
        await prisma.event.create({
          data: {
            ...conteudo(n, categoriaId),
            fonte: FONTE,
            fonteInstancia: instancia,
            idExterno: n.idExterno,
            latitude: coords?.lat ?? 0,
            longitude: coords?.lng ?? 0,
            status,
            sincronizadoEm: agora,
          },
        });
        resumo.criados += 1;
        continue;
      }

      await prisma.event.update({
        where: { id: atual.id },
        data: atual.editadoPelaEquipe
          ? { status, sincronizadoEm: agora }
          : {
              ...conteudo(n, categoriaId),
              ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
              status,
              sincronizadoEm: agora,
            },
      });
      resumo.atualizados += 1;
      if (atual.status === "inativo" && status === "importado") resumo.reativados += 1;
      if (atual.status !== "inativo" && status === "inativo") resumo.inativados += 1;
    } catch (erro) {
      resumo.erros.push(`evento ${n.idExterno}: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  }

  const vistos = coleta.eventos.map((n) => n.idExterno);
  const sumidos: Prisma.EventWhereInput[] = coleta.parcial ? [] : [{ idExterno: { notIn: vistos } }];
  const { count } = await prisma.event.updateMany({
    where: {
      fonte: FONTE,
      fonteInstancia: instancia,
      status: { in: ["importado", "publicado"] },
      OR: [...sumidos, { dataFim: { lt: agora } }, { dataFim: null, dataHora: { lt: agora } }],
    },
    data: { status: "inativo" },
  });
  resumo.inativados += count;
  return resumo;
}

function resumoDeFalha(coletaFalhou: { url: string; nome: string }, erro: unknown): ResumoInstancia {
  return {
    instancia: coletaFalhou.url,
    nome: coletaFalhou.nome,
    ok: false,
    pulada: erro instanceof InstanciaPulada,
    ocorrencias: 0,
    foraDaRegiao: 0,
    recebidos: 0,
    criados: 0,
    atualizados: 0,
    reativados: 0,
    inativados: 0,
    semCoordenadas: 0,
    geocodificados: 0,
    linguagensNaoMapeadas: [],
    erros: [erro instanceof Error ? erro.message : String(erro)],
  };
}

/**
 * Importa as instâncias de `MAPAS_CULTURAIS_INSTANCIAS` (ou só `apenas`, se vier).
 * Uma instância fora do ar não impede as outras; nela nada é inativado.
 */
export async function importarMapasCulturais(opcoes: { apenas?: string } = {}): Promise<ResultadoImportacao> {
  const config = lerConfigMapas();
  const filtro = opcoes.apenas ? normalizarUrlBase(opcoes.apenas) : null;
  const instancias = filtro ? config.instancias.filter((i) => i.url === filtro) : config.instancias;
  if (instancias.length === 0) {
    return {
      ok: false,
      message: filtro ? `Instância ${opcoes.apenas} não está em MAPAS_CULTURAIS_INSTANCIAS.` : "Defina MAPAS_CULTURAIS_INSTANCIAS no .env.",
      instancias: [],
    };
  }

  const categorias = await categoriasPorSlug();
  const agora = new Date();
  const regiao = descreverRegiao(config.regiao);
  const resumos: ResumoInstancia[] = [];
  for (const instancia of instancias) {
    try {
      const coleta = await coletarInstancia(new ClienteMapas(instancia, config), { dias: config.dias, regiao: config.regiao }, agora);
      resumos.push(await gravarInstancia(coleta, categorias, config, agora));
    } catch (erro) {
      resumos.push(resumoDeFalha(instancia, erro));
    }
    const ultimo = resumos[resumos.length - 1];
    for (const erro of ultimo.erros) console.warn(`[mapas-culturais] ${instancia.nome}: ${erro}`);
    if (ultimo.foraDaRegiao) console.info(`[mapas-culturais] ${instancia.nome}: ${ultimo.foraDaRegiao} eventos fora da região (${regiao}) ignorados`);
    if (ultimo.linguagensNaoMapeadas.length) {
      console.warn(`[mapas-culturais] ${instancia.nome}: linguagens sem mapeamento → Outros: ${ultimo.linguagensNaoMapeadas.join(", ")}`);
    }
  }

  const importados = resumos.reduce((soma, r) => soma + r.criados + r.atualizados, 0);
  if (resumos.every((r) => !r.ok)) {
    return { ok: false, message: resumos.map((r) => `${r.nome}: ${r.erros[0]}`).join(" | "), regiao, instancias: resumos };
  }
  return { ok: true, regiao, instancias: resumos, importados };
}

/** Versão enxuta do resultado para `admin_logs.detalhes` (JSON). */
export function detalhesDoLog(resultado: ResultadoImportacao): Prisma.InputJsonObject {
  return {
    ok: resultado.ok,
    ...(resultado.ok ? { importados: resultado.importados } : { erro: resultado.message }),
    ...(resultado.regiao ? { regiao: resultado.regiao } : {}),
    instancias: resultado.instancias.map((r) => ({
      nome: r.nome,
      instancia: r.instancia,
      ok: r.ok,
      pulada: r.pulada,
      foraDaRegiao: r.foraDaRegiao,
      criados: r.criados,
      atualizados: r.atualizados,
      reativados: r.reativados,
      inativados: r.inativados,
      semCoordenadas: r.semCoordenadas,
      linguagensNaoMapeadas: r.linguagensNaoMapeadas,
      erros: r.erros.slice(0, 20),
    })),
  };
}
