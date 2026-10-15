/**
 * npm run mapas:importar                         importa todas as instâncias de MAPAS_CULTURAIS_INSTANCIAS
 * npm run mapas:importar -- --instancia=URL      só uma instância
 * npm run mapas:importar -- --simular            busca e normaliza sem gravar no banco (não precisa de DATABASE_URL)
 * npm run mapas:importar -- --simular --dias=180 --instancia=https://mapacultural.pb.gov.br
 */
import { ClienteMapas, coletarInstancia } from "../src/lib/mapas-culturais";
import { descreverRegiao, lerConfigMapas, normalizarUrlBase, type InstanciaMapas } from "../src/lib/mapas-culturais-config";

try {
  process.loadEnvFile(".env");
} catch {
  // sem .env: usa só as variáveis do ambiente
}

function argumento(nome: string): string | undefined {
  const achado = process.argv.find((arg) => arg === `--${nome}` || arg.startsWith(`--${nome}=`));
  if (!achado) return undefined;
  return achado.includes("=") ? achado.slice(achado.indexOf("=") + 1) : "";
}

async function simular() {
  const config = lerConfigMapas();
  const dias = Number(argumento("dias")) || config.dias;
  const pedida = argumento("instancia");
  const url = pedida ? normalizarUrlBase(pedida) : null;
  let instancias: InstanciaMapas[] = url ? config.instancias.filter((i) => i.url === url) : config.instancias;
  if (url && instancias.length === 0) instancias = [{ nome: new URL(url).hostname, url, fuso: "America/Sao_Paulo" }];
  if (instancias.length === 0) throw new Error("Defina MAPAS_CULTURAIS_INSTANCIAS ou passe --instancia=URL.");

  for (const instancia of instancias) {
    const inicio = Date.now();
    console.log(`\n== ${instancia.nome} (${instancia.url}) · próximos ${dias} dias · região: ${descreverRegiao(config.regiao)}`);
    try {
      const coleta = await coletarInstancia(new ClienteMapas(instancia, config), { dias, regiao: config.regiao });
      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
      console.log(`ocorrências: ${coleta.ocorrencias} · eventos normalizados: ${coleta.eventos.length} · fora da região: ${coleta.foraDaRegiao} · ${segundos}s`);
      console.log(`sem coordenadas na fonte: ${coleta.eventos.filter((e) => e.latitude === null).length}`);
      console.log(`encerrados (iriam como inativo): ${coleta.eventos.filter((e) => e.encerrado).length}`);
      if (coleta.linguagensNaoMapeadas.length) console.log(`linguagens sem mapeamento → Outros: ${coleta.linguagensNaoMapeadas.join(", ")}`);
      for (const erro of coleta.erros) console.log(`erro: ${erro}`);
      const porCategoria = new Map<string, number>();
      for (const e of coleta.eventos) porCategoria.set(e.categoriaSlug, (porCategoria.get(e.categoriaSlug) ?? 0) + 1);
      console.log("por categoria:", Object.fromEntries(porCategoria));
      const exemplo = coleta.eventos.find((e) => e.latitude !== null && e.imagemCapa) ?? coleta.eventos[0];
      if (exemplo) {
        console.log("exemplo normalizado:");
        console.log(JSON.stringify({ ...exemplo, fonte: "mapas_culturais", fonteInstancia: instancia.url, descricao: `${exemplo.descricao.slice(0, 160)}…` }, null, 2));
      }
    } catch (erro) {
      console.log(`falhou: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  }
}

async function importar() {
  const { importarMapasCulturais, detalhesDoLog } = await import("../src/lib/mapas-culturais-importer");
  const { registrarLog } = await import("../src/lib/admin-log");
  const { prisma } = await import("../src/lib/prisma");
  try {
    const resultado = await importarMapasCulturais({ apenas: argumento("instancia") });
    await registrarLog(null, "mapas.importar", "sistema", null, detalhesDoLog(resultado));
    console.log(JSON.stringify(detalhesDoLog(resultado), null, 2));
    if (!resultado.ok) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

(argumento("simular") !== undefined ? simular() : importar()).catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exitCode = 1;
});
