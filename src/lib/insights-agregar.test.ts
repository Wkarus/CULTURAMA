import assert from "node:assert/strict";
import { test } from "node:test";
import { agregar, MINIMO_PESSOAS, paraCsv, type LinhaInsight } from "./insights-agregar";
import { dadosDemo } from "./insights-demo";

const agora = new Date("2026-10-15T12:00:00Z");
const filtros = { dias: 30 as const, regiao: null, categoria: null };

function linha(parcial: Partial<LinhaInsight> & Pick<LinhaInsight, "tipo">): LinhaInsight {
  return {
    eventoId: "evt-1",
    titulo: "Show",
    data: new Date(agora.getTime() - 86_400_000),
    categoria: "Música",
    bairro: "Centro",
    cidade: "São Paulo",
    faixa: "de_18_a_24",
    coorte: "pessoa-1",
    patrocinado: false,
    temOrganizador: true,
    ...parcial,
  };
}

test("índice de impacto soma os pesos", () => {
  const painel = agregar(
    [linha({ tipo: "visualizacao" }), linha({ tipo: "favorito" }), linha({ tipo: "como_chegar" }), linha({ tipo: "ingresso" })],
    filtros,
    false,
    agora,
  );
  assert.equal(painel.ranking[0]?.indice, 1 + 3 + 5 + 5);
  assert.equal(painel.total, 4);
});

test("grupo com menos de 20 pessoas vira dados insuficientes", () => {
  const linhas = Array.from({ length: MINIMO_PESSOAS - 1 }, (_, indice) => linha({ tipo: "visualizacao", coorte: `p-${indice}` }));
  const painel = agregar(linhas, filtros, false, agora);
  assert.equal(painel.faixas.find((faixa) => faixa.faixa === "de_18_a_24")?.pessoas, "insuficiente");
  assert.equal(painel.bairrosInsuficientes, true);
  assert.equal(painel.tambemCurte, "insuficiente");
});

test("20 pessoas distintas liberam a faixa", () => {
  const linhas = Array.from({ length: MINIMO_PESSOAS }, (_, indice) => linha({ tipo: "visualizacao", coorte: `p-${indice}` }));
  const painel = agregar(linhas, filtros, false, agora);
  assert.equal(painel.faixas.find((faixa) => faixa.faixa === "de_18_a_24")?.pessoas, MINIMO_PESSOAS);
  assert.equal(painel.bairros[0]?.nome, "Centro");
});

test("patrocinado não entra em oportunidades", () => {
  const linhas = [
    linha({ tipo: "ingresso", patrocinado: true, eventoId: "pago", titulo: "Com patrocínio" }),
    linha({ tipo: "ingresso", eventoId: "livre", titulo: "Sem patrocínio" }),
  ];
  const painel = agregar(linhas, filtros, false, agora);
  assert.deepEqual(painel.oportunidades.map((item) => item.eventoId), ["livre"]);
});

test("demonstração não leva identificador para o CSV", () => {
  const painel = agregar(dadosDemo(agora), filtros, true, agora);
  const csv = paraCsv(painel);
  assert.match(csv, /Dados de demonstração/);
  assert.equal(csv.includes("jovem-1"), false);
  assert.equal(csv.includes("coorte"), false);
  assert.equal(painel.demo, true);
  assert.ok(painel.faixas.some((faixa) => faixa.pessoas === "insuficiente"));
  assert.ok(painel.oportunidades.some((item) => item.titulo === "Show na Vila"));
});
