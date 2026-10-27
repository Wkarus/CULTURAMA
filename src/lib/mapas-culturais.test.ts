import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIAS_ARVORE } from "./categorias-dados";
import {
  ClienteMapas,
  coletarInstancia,
  dentroDaRegiao,
  ErroMapas,
  InstanciaPulada,
  listarOcorrencias,
  localParaUtc,
  lerOcorrencia,
  montarEndereco,
  normalizarEvento,
  restricaoDe,
  ufDoEspaco,
  type EspacoApi,
  type EventoApi,
  type OcorrenciaApi,
} from "./mapas-culturais";
import { LINGUAGEM_PARA_CATEGORIA, mapearLinguagens } from "./mapas-culturais-categorias";
import { descreverRegiao, lerConfigMapas, lerInstancias, lerRegiao, nomeDaInstancia, userAgentDoRobo } from "./mapas-culturais-config";
import { robotsPermite } from "./robots";

const PB = { nome: "Mapa Cultural da Paraíba", url: "https://mapacultural.pb.gov.br", fuso: "America/Recife" };

/** Trechos reais de mapacultural.pb.gov.br (out/2026). */
const OCORRENCIAS_197: OcorrenciaApi[] = [
  {
    id: 197,
    occurrence_id: 35,
    event_id: 197,
    starts_on: "2026-11-26",
    starts_at: "10:00:00",
    ends_on: null,
    ends_at: "10:00:00",
    rule: { startsOn: "2026-11-26", startsAt: "10:00", endsAt: "10:00", description: "Dia 26 de Novembro de 2026 das 10:00 às 22:00", price: "Gratuito", spaceId: 684 },
    space: { id: 684 },
    _reccurrence_string: "35.2026-11-26.10:00:00..10:00:00",
  },
  {
    id: 197,
    occurrence_id: 36,
    event_id: 197,
    starts_on: "2026-11-27",
    starts_at: "10:00:00",
    ends_on: null,
    ends_at: "10:00:00",
    rule: { description: "Dia 27 de Novembro de 2026 das 10:00 às 00:30", price: "Gratuito", spaceId: 684 },
    space: { id: 684 },
    _reccurrence_string: "36.2026-11-27.10:00:00..10:00:00",
  },
  {
    id: 197,
    occurrence_id: 37,
    event_id: 197,
    starts_on: "2026-11-28",
    starts_at: "10:00:00",
    ends_on: null,
    ends_at: "10:00:00",
    rule: { description: "Dia 28 de Novembro de 2026 às 10:00", price: "Gratuito", spaceId: 684 },
    space: { id: 684 },
    _reccurrence_string: "37.2026-11-28.10:00:00..10:00:00",
  },
];

const EVENTO_197: EventoApi = {
  id: 197,
  name: "Festival Literário Internacional da Paraíba - FliParaíba",
  shortDescription: "Festival literário com mesas, lançamentos e oficinas.",
  classificacaoEtaria: "Livre",
  singleUrl: "https://mapacultural.pb.gov.br/evento/197/",
  terms: { tag: [], linguagem: ["Livro e Literatura", "Música Erudita", "Música Popular", "Cultura Tradicional"] },
  "@files:avatar.avatarBig": { url: "https://mapacultural.pb.gov.br/files/event/197/file/53632/avatar.jpg" },
  "@files:header.header": { url: "https://mapacultural.pb.gov.br/files/event/197/file/53636/header.png" },
};

const ESPACOS = new Map<number, EspacoApi>([
  [684, { id: 684, name: "Mosteiro de São Bento", location: { latitude: "0", longitude: "0" }, endereco: null }],
  [
    6,
    {
      id: 6,
      name: "Fundação Casa de José Américo",
      location: { latitude: "-7.1496168", longitude: "-34.7969867" },
      endereco: "Avenida Cabo Branco, 3336 - Cabo Branco - João Pessoa/PB - CEP: 58045-010",
      En_Nome_Logradouro: "Avenida Cabo Branco",
      En_Num: "3336",
      En_Bairro: "Cabo Branco",
      En_Municipio: "João Pessoa",
      En_Estado: "PB",
    },
  ],
]);

const ANTES = new Date("2026-10-14T12:00:00-03:00");

test("horário local do fuso da instância vira UTC", () => {
  assert.equal(localParaUtc("2026-11-26", "10:00:00", "America/Recife")?.toISOString(), "2026-11-26T13:00:00.000Z");
  assert.equal(localParaUtc("2026-11-26", "10:00", "America/Manaus")?.toISOString(), "2026-11-26T14:00:00.000Z");
  assert.equal(localParaUtc("data ruim", "10:00", "America/Recife"), null);
});

test("fim vem do texto quando ends_at repete o início, e passa da meia-noite", () => {
  const dia26 = lerOcorrencia(OCORRENCIAS_197[0], PB.fuso);
  assert.equal(dia26?.fim?.toISOString(), "2026-11-27T01:00:00.000Z");
  const dia27 = lerOcorrencia(OCORRENCIAS_197[1], PB.fuso);
  assert.equal(dia27?.fim?.toISOString(), "2026-11-28T03:30:00.000Z");
  assert.equal(lerOcorrencia(OCORRENCIAS_197[2], PB.fuso)?.fim, null);
  assert.equal(dia26?.espacoId, 684);
});

test("evento real da Paraíba normalizado", () => {
  const n = normalizarEvento(EVENTO_197, OCORRENCIAS_197, ESPACOS, PB, ANTES);
  assert.equal(n.idExterno, "197");
  assert.equal(n.dataHora.toISOString(), "2026-11-26T13:00:00.000Z");
  assert.equal(n.dataFim?.toISOString(), "2026-11-28T13:00:00.000Z");
  assert.equal(n.categoriaSlug, "literatura", "festival literário com música continua sendo literatura");
  assert.deepEqual(n.categoriasSlugs, ["literatura", "classica-e-concertos", "cultura-popular", "musica"]);
  assert.deepEqual(n.linguagensNaoMapeadas, []);
  assert.deepEqual(n.tags, ["Livro e Literatura", "Música Erudita", "Música Popular", "Cultura Tradicional"]);
  assert.equal(n.endereco, "Mosteiro de São Bento");
  assert.equal(n.latitude, null, "0,0 da fonte não vira pino no oceano");
  assert.equal(n.enderecoGeocodificavel, null, "só o nome do espaço não basta para geocodificar");
  assert.equal(n.gratuito, true);
  assert.equal(n.restricaoIdade, "livre");
  assert.equal(n.linkSaibaMais, "https://mapacultural.pb.gov.br/evento/197/");
  assert.match(n.imagemCapa ?? "", /avatar\.jpg$/);
  assert.equal(n.encerrado, false);
});

test("próxima ocorrência e encerrado dependem de agora", () => {
  const noMeio = normalizarEvento(EVENTO_197, OCORRENCIAS_197, ESPACOS, PB, new Date("2026-11-27T12:00:00-03:00"));
  assert.equal(noMeio.dataHora.toISOString(), "2026-11-27T13:00:00.000Z");
  const depois = normalizarEvento(EVENTO_197, OCORRENCIAS_197, ESPACOS, PB, new Date("2026-12-01T00:00:00-03:00"));
  assert.equal(depois.encerrado, true);
});

test("endereço estruturado no formato que localDoEvento lê, com coordenada", () => {
  const ocorrencia: OcorrenciaApi = { ...OCORRENCIAS_197[0], space: { id: 6 }, rule: { description: "", price: "R$ 15,00" } };
  const n = normalizarEvento({ ...EVENTO_197, classificacaoEtaria: "10 anos" }, [ocorrencia], ESPACOS, PB, ANTES);
  assert.equal(n.endereco, "Fundação Casa de José Américo, Avenida Cabo Branco, 3336 - Cabo Branco, João Pessoa - PB");
  assert.equal(n.latitude, -7.1496168);
  assert.equal(n.gratuito, false);
  assert.equal(n.restricaoIdade, "doze", "10 anos arredonda para a faixa mais restrita");
  assert.deepEqual(montarEndereco(undefined), { local: null, endereco: null });
});

test("evento quebrado lança erro em vez de gravar lixo", () => {
  assert.throws(() => normalizarEvento({ id: 1, name: "  " }, OCORRENCIAS_197, ESPACOS, PB, ANTES), /sem id ou título/);
  assert.throws(() => normalizarEvento(EVENTO_197, [{ starts_on: "x" }], ESPACOS, PB, ANTES), /sem ocorrência/);
});

test("link de outro domínio não vira 'saiba mais'", () => {
  const n = normalizarEvento({ ...EVENTO_197, singleUrl: "https://golpe.example/evento/197" }, OCORRENCIAS_197, ESPACOS, PB, ANTES);
  assert.equal(n.linkSaibaMais, null);
});

test("classificação etária", () => {
  assert.equal(restricaoDe("Livre"), "livre");
  assert.equal(restricaoDe("12 anos"), "doze");
  assert.equal(restricaoDe("14 anos"), "quatorze");
  assert.equal(restricaoDe("16 anos"), "dezesseis");
  assert.equal(restricaoDe("18 anos"), "dezoito");
  assert.equal(restricaoDe(null), "livre");
});

test("mapeamento de linguagens: principal pela prioridade, sem acento, resto em Outros", () => {
  assert.equal(mapearLinguagens(["Música Popular", "Hip Hop"]).principal, "rap-e-rima");
  assert.equal(mapearLinguagens(["Cultura Tradicional", "Curso ou Oficina"]).principal, "oficinas");
  assert.equal(mapearLinguagens(["danca"]).principal, "danca");
  assert.equal(mapearLinguagens(["Audiovisual"]).principal, "cinema-e-audiovisual");
  assert.equal(mapearLinguagens(["Outros", "Teatro"]).principal, "teatro");
  const nada = mapearLinguagens(["Rádio", "Palestra, Debate ou Encontro"]);
  assert.equal(nada.principal, "outros");
  assert.deepEqual(nada.naoMapeadas, ["Rádio", "Palestra, Debate ou Encontro"]);
  assert.equal(mapearLinguagens([]).principal, "outros");
});

test("todo destino do mapeamento existe na árvore de categorias", () => {
  const slugs = new Set(CATEGORIAS_ARVORE.flatMap((m) => [m.slug, ...m.filhas.map((f) => f.slug)]));
  for (const [linguagem, slug] of Object.entries(LINGUAGEM_PARA_CATEGORIA)) assert.ok(slugs.has(slug), `${linguagem} → ${slug}`);
});

test("config de instâncias", () => {
  const lista = lerInstancias("SP Cultura|https://spcultura.prefeitura.sp.gov.br/;PB|https://mapacultural.pb.gov.br|America/Recife;lixo;X|ftp://a");
  assert.deepEqual(lista, [
    { nome: "SP Cultura", url: "https://spcultura.prefeitura.sp.gov.br", fuso: "America/Sao_Paulo" },
    { nome: "PB", url: "https://mapacultural.pb.gov.br", fuso: "America/Recife" },
  ]);
  const env = { MAPAS_CULTURAIS_INSTANCIAS: "SP Cultura|https://spcultura.prefeitura.sp.gov.br" } as unknown as NodeJS.ProcessEnv;
  assert.equal(nomeDaInstancia("https://spcultura.prefeitura.sp.gov.br/", env), "SP Cultura");
  assert.equal(nomeDaInstancia("https://mapa.cultura.gov.br", env), "mapa.cultura.gov.br");
});

function clienteFalso(respostas: ((url: URL) => Response)[]) {
  const chamadas: URL[] = [];
  const pausas: number[] = [];
  const fetcher = (async (url: URL) => {
    chamadas.push(url);
    const proxima = respostas.shift();
    if (!proxima) throw new Error("sem resposta");
    return proxima(url);
  }) as unknown as typeof fetch;
  const cliente = new ClienteMapas(PB, { pausaMs: 0, timeoutMs: 1000, tentativas: 2, userAgent: "Culturama/teste" }, fetcher, async (ms) => {
    pausas.push(ms);
  });
  return { cliente, chamadas, pausas };
}

const json = (corpo: unknown, status = 200) => () =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });

const desafio = (status: number) => () =>
  new Response("<!DOCTYPE html><title>Just a moment...</title>", { status, headers: { "content-type": "text/html" } });

test("desafio anti-robô (403, 429 ou 503) pula a instância, sem retentar", async () => {
  for (const status of [403, 429, 503]) {
    const { cliente, chamadas } = clienteFalso([desafio(status), desafio(status)]);
    await assert.rejects(cliente.json("event/findOccurrences", {}), (erro) => erro instanceof InstanciaPulada && /anti-robô/.test(erro.message));
    assert.equal(chamadas.length, 1, `HTTP ${status}`);
  }
  const cabecalho = clienteFalso([() => new Response("", { status: 403, headers: { "cf-mitigated": "challenge" } })]);
  await assert.rejects(cabecalho.cliente.json("event/find", {}), InstanciaPulada);
});

test("User-Agent é sempre o robô identificado; só o contato muda", () => {
  assert.equal(userAgentDoRobo(undefined), "CulturamaBot/1.0 (agregador de eventos culturais)");
  assert.equal(userAgentDoRobo("contato@culturama.app"), "CulturamaBot/1.0 (+contato@culturama.app)");
  assert.equal(userAgentDoRobo("x) Mozilla/5.0 (Windows"), "CulturamaBot/1.0 (+x Mozilla/5.0 Windows)");
  const env = { MAPAS_CULTURAIS_USER_AGENT: "Mozilla/5.0 Chrome/130" } as unknown as NodeJS.ProcessEnv;
  assert.match(lerConfigMapas(env).userAgent, /^CulturamaBot\/1\.0 /, "User-Agent livre não é aceito");
});

test("retry com backoff em 503 e desiste em 404", async () => {
  const { cliente, chamadas, pausas } = clienteFalso([json({}, 503), json([{ id: 1 }])]);
  assert.deepEqual(await cliente.json("event/find", {}), [{ id: 1 }]);
  assert.equal(chamadas.length, 2);
  assert.ok(pausas[0] >= 1000);

  const nao = clienteFalso([json({}, 404)]);
  await assert.rejects(nao.cliente.json("event/find", {}), (erro) => erro instanceof ErroMapas && erro.status === 404);
  assert.equal(nao.chamadas.length, 1);
});

test("paginação de findOccurrences segue até a página incompleta", async () => {
  const pagina = (n: number, quantos: number) =>
    json(Array.from({ length: quantos }, (_, i) => ({ event_id: n * 1000 + i, _reccurrence_string: `${n}.${i}` })));
  const { cliente, chamadas } = clienteFalso([pagina(1, 200), pagina(2, 200), pagina(3, 7)]);
  const linhas = await listarOcorrencias(cliente, ANTES, new Date("2026-12-13T00:00:00-03:00"));
  assert.equal(linhas.length, 407);
  assert.equal(chamadas.length, 3);
  assert.equal(chamadas[0].pathname, "/api/event/findOccurrences");
  assert.equal(chamadas[0].searchParams.get("@from"), "2026-10-14");
  assert.equal(chamadas[0].searchParams.get("@to"), "2026-12-13");
  assert.equal(chamadas[2].searchParams.get("@page"), "3");
});

const UA = "CulturamaBot/1.0 (+contato@culturama.app)";

test("robots.txt: grupo próprio vence o *, regra mais longa vence, allow ganha empate", () => {
  assert.equal(robotsPermite("", UA, "/api/"), true);
  assert.equal(robotsPermite("User-agent: *\nDisallow: /api/", UA, "/api/event/find"), false);
  assert.equal(robotsPermite("User-agent: *\nDisallow: /", UA, "/api/"), false);
  assert.equal(robotsPermite("User-agent: *\nDisallow:", UA, "/api/"), true, "Disallow vazio libera tudo");
  assert.equal(robotsPermite("User-agent: *\nDisallow: /admin\n", UA, "/api/"), true);
  assert.equal(robotsPermite("User-agent: *\nDisallow: /api/\n\nUser-agent: CulturamaBot\nAllow: /", UA, "/api/"), true);
  assert.equal(robotsPermite("User-agent: CulturamaBot\nDisallow: /api/", UA, "/api/"), false);
  assert.equal(robotsPermite("User-agent: Googlebot\nDisallow: /", UA, "/api/"), true, "regra de outro robô não vale");
  assert.equal(robotsPermite("User-agent: *\nDisallow: /\nAllow: /api/", UA, "/api/space/find"), true);
  assert.equal(robotsPermite("User-agent: *\nDisallow: /*find$", UA, "/api/event/find"), false);
  assert.equal(robotsPermite("User-agent: *\nDisallow: /*find$", UA, "/api/event/findOccurrences"), true);
  assert.equal(robotsPermite("user-agent: a\nuser-agent: *\ndisallow: /api # sem api", UA, "/api/"), false);
});

function clientePorRota(rotas: Record<string, () => Response>) {
  const chamadas: URL[] = [];
  const fetcher = (async (url: URL) => {
    chamadas.push(url);
    const rota = rotas[url.pathname];
    if (!rota) throw new Error(`sem rota ${url.pathname}`);
    return rota();
  }) as unknown as typeof fetch;
  const cliente = new ClienteMapas(PB, { pausaMs: 0, timeoutMs: 1000, tentativas: 1, userAgent: UA }, fetcher, async () => {});
  return { cliente, chamadas };
}

const texto = (corpo: string, status = 200) => () => new Response(corpo, { status, headers: { "content-type": "text/plain" } });
const TODOS = { ufs: null, raio: null };

test("robots.txt bloqueando /api/ pula a instância sem nenhuma chamada à API", async () => {
  const { cliente, chamadas } = clientePorRota({ "/robots.txt": texto("User-agent: *\nDisallow: /api/") });
  await assert.rejects(coletarInstancia(cliente, { dias: 60, regiao: TODOS }, ANTES), (erro) => erro instanceof InstanciaPulada && /\/api\//.test(erro.message));
  assert.deepEqual(chamadas.map((c) => c.pathname), ["/robots.txt"]);
});

test("robots.txt inacessível também pula; 404 libera", async () => {
  const fora = clientePorRota({ "/robots.txt": texto("", 503) });
  await assert.rejects(coletarInstancia(fora.cliente, { dias: 60, regiao: TODOS }, ANTES), InstanciaPulada);
  assert.ok(fora.chamadas.every((c) => c.pathname === "/robots.txt"));

  const sem = clientePorRota({
    "/robots.txt": texto("<html>não encontrado</html>", 404),
    "/api/event/findOccurrences": json([]),
    "/api/space/find": json([]),
    "/api/event/find": json([]),
  });
  const coleta = await coletarInstancia(sem.cliente, { dias: 60, regiao: TODOS }, ANTES);
  assert.equal(coleta.eventos.length, 0);
});

test("desafio no robots.txt ou no meio da coleta encerra a instância sem mais chamadas", async () => {
  const noRobots = clientePorRota({ "/robots.txt": desafio(403) });
  await assert.rejects(coletarInstancia(noRobots.cliente, { dias: 60, regiao: TODOS }, ANTES), (erro) => erro instanceof InstanciaPulada && /anti-robô/.test(erro.message));
  assert.deepEqual(noRobots.chamadas.map((c) => c.pathname), ["/robots.txt"], "403 com desafio não conta como 'sem robots.txt'");

  const noLote = clientePorRota({
    "/robots.txt": texto("", 404),
    "/api/event/findOccurrences": json(Array.from({ length: 90 }, (_, i) => ({ ...OCORRENCIAS_197[0], event_id: i + 1, space: { id: i + 1 }, _reccurrence_string: `${i}` }))),
    "/api/space/find": desafio(503),
  });
  await assert.rejects(coletarInstancia(noLote.cliente, { dias: 60, regiao: TODOS }, ANTES), InstanciaPulada);
  assert.equal(noLote.chamadas.filter((c) => c.pathname === "/api/space/find").length, 1, "não segue para os próximos lotes");
  assert.ok(!noLote.chamadas.some((c) => c.pathname === "/api/event/find"));
});

test("config de região: padrão todo o Brasil, lista de UFs, todos e raio", () => {
  const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
  assert.deepEqual(lerRegiao(env({})), { ufs: null, raio: null });
  assert.deepEqual(lerRegiao(env({ MAPAS_CULTURAIS_UFS: "sp, rj;XX" })), { ufs: ["SP", "RJ"], raio: null });
  assert.deepEqual(lerRegiao(env({ MAPAS_CULTURAIS_UFS: "XX" })), { ufs: null, raio: null }, "sigla inválida cai no padrão");
  assert.deepEqual(lerRegiao(env({ MAPAS_CULTURAIS_UFS: "*" })), { ufs: null, raio: null });
  assert.deepEqual(lerRegiao(env({ MAPAS_CULTURAIS_RAIO: "-23.5505,-46.6333,50" })), { ufs: null, raio: { lat: -23.5505, lng: -46.6333, km: 50 } });
  assert.deepEqual(lerRegiao(env({ MAPAS_CULTURAIS_RAIO: "lixo" })), { ufs: null, raio: null });
  assert.equal(descreverRegiao({ ufs: ["SP"], raio: { lat: -23.5, lng: -46.6, km: 30 } }), "estado SP e até 30 km de -23.5,-46.6");
});

test("UF do espaço e filtro por estado e raio", () => {
  const joaoPessoa = ESPACOS.get(6)!;
  assert.equal(ufDoEspaco(joaoPessoa), "PB");
  assert.equal(ufDoEspaco({ id: 1, endereco: "Al. Santos, 100 - Jardins - São Paulo/SP - CEP: 01418-000" }), "SP");
  assert.equal(ufDoEspaco({ id: 1, En_Estado: "São Paulo" }), "SP");
  assert.equal(ufDoEspaco({ id: 1, endereco: "Rua sem estado" }), null);

  assert.equal(dentroDaRegiao(joaoPessoa, { ufs: ["SP"], raio: null }), false);
  assert.equal(dentroDaRegiao(joaoPessoa, { ufs: ["PB"], raio: null }), true);
  assert.equal(dentroDaRegiao(undefined, { ufs: ["PB"], raio: null }), false, "sem espaço não dá para afirmar a região");
  assert.equal(dentroDaRegiao(undefined, TODOS), true);
  assert.equal(dentroDaRegiao(joaoPessoa, { ufs: null, raio: { lat: -7.115, lng: -34.863, km: 15 } }), true);
  assert.equal(dentroDaRegiao(joaoPessoa, { ufs: null, raio: { lat: -23.5505, lng: -46.6333, km: 100 } }), false);
  assert.equal(dentroDaRegiao(ESPACOS.get(684), { ufs: null, raio: { lat: -7.115, lng: -34.863, km: 15 } }), false, "0,0 não entra no raio");
});

test("coleta só pede à API os eventos da região", async () => {
  const ocorrencia = (eventId: number, espaco: number): OcorrenciaApi => ({
    ...OCORRENCIAS_197[0],
    id: eventId,
    event_id: eventId,
    space: { id: espaco },
    rule: { ...OCORRENCIAS_197[0].rule, spaceId: espaco },
    _reccurrence_string: `${eventId}.${espaco}`,
  });
  const paulista: EspacoApi = { id: 7, name: "Centro Cultural", En_Municipio: "São Paulo", En_Estado: "SP", location: { latitude: "-23.57", longitude: "-46.64" } };
  const { cliente, chamadas } = clientePorRota({
    "/robots.txt": texto("User-agent: *\nDisallow: /admin"),
    "/api/event/findOccurrences": json([ocorrencia(197, 6), ocorrencia(300, 7)]),
    "/api/space/find": json([ESPACOS.get(6), paulista]),
    "/api/event/find": json([{ ...EVENTO_197, id: 300, name: "Evento em SP" }]),
  });
  const coleta = await coletarInstancia(cliente, { dias: 60, regiao: { ufs: ["SP"], raio: null } }, ANTES);
  assert.deepEqual(coleta.eventos.map((e) => e.idExterno), ["300"]);
  assert.equal(coleta.foraDaRegiao, 1);
  assert.equal(coleta.parcial, false);
  const pedidoDeEventos = chamadas.find((c) => c.pathname === "/api/event/find");
  assert.equal(pedidoDeEventos?.searchParams.get("id"), "IN(300)", "o evento da Paraíba nem é buscado");
  assert.deepEqual(chamadas.map((c) => c.pathname), ["/robots.txt", "/api/event/findOccurrences", "/api/space/find", "/api/event/find"]);
});
