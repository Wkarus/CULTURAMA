import assert from "node:assert/strict";
import { test } from "node:test";
import { eventWhereFromParams, raioDoFiltro } from "./event-filters";

function gteDe(where: ReturnType<typeof eventWhereFromParams>) {
  const filtro = where.dataHora;
  return typeof filtro === "object" && !(filtro instanceof Date) ? filtro.gte : undefined;
}

test("sem filtro de data, a lista só pede eventos a partir de agora", () => {
  const before = Date.now();
  const gte = gteDe(eventWhereFromParams({}));
  assert.ok(gte instanceof Date);
  assert.ok(gte.getTime() >= before);
  assert.ok(gte.getTime() <= Date.now());
});

test("data futura no filtro de vence a data de agora", () => {
  const gte = gteDe(eventWhereFromParams({ de: "2099-06-15" }));
  assert.ok(gte instanceof Date);
  assert.equal(gte.toISOString().slice(0, 10), "2099-06-15");
});

test("Perto de mim limita o banco a uma caixa em volta do raio; sem posição não há limite geográfico", () => {
  assert.equal(eventWhereFromParams({}).latitude, undefined);
  assert.equal(eventWhereFromParams({ distancia: "10" }).latitude, undefined, "raio sem posição não filtra");
  const where = eventWhereFromParams({ lat: "-23.55", lng: "-46.63", distancia: "10" });
  const lat = where.latitude as { gte: number; lte: number };
  const lng = where.longitude as { gte: number; lte: number };
  assert.ok(lat.gte < -23.55 && lat.lte > -23.55);
  assert.ok(Math.abs(lat.lte - lat.gte - 20 / 111) < 1e-9);
  assert.ok(lng.lte - lng.gte > lat.lte - lat.gte, "longitude abre mais longe do equador");
});

test("raio fora da faixa é ignorado", () => {
  assert.equal(raioDoFiltro("0"), null);
  assert.equal(raioDoFiltro("51"), null);
  assert.equal(raioDoFiltro("abc"), null);
  assert.equal(raioDoFiltro("25"), 25);
});

test("filtro Acessível pede Libras, audiodescrição ou espaço com recurso", () => {
  assert.equal(eventWhereFromParams({}).OR, undefined);
  assert.deepEqual(eventWhereFromParams({ acessivel: "1" }).OR, [{ libras: true }, { audiodescricao: true }, { NOT: { acessibilidade: { isEmpty: true } } }]);
});
