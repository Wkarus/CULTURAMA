import assert from "node:assert/strict";
import { test } from "node:test";
import { eventWhereFromParams } from "./event-filters";

test("sem filtro de data, a lista só pede eventos a partir de agora", () => {
  const before = Date.now();
  const where = eventWhereFromParams({});
  const gte = where.dataHora && "gte" in where.dataHora ? where.dataHora.gte : undefined;
  assert.ok(gte instanceof Date);
  assert.ok(gte.getTime() >= before);
  assert.ok(gte.getTime() <= Date.now());
});

test("data futura no filtro de vence a data de agora", () => {
  const where = eventWhereFromParams({ de: "2099-06-15" });
  const gte = where.dataHora && "gte" in where.dataHora ? where.dataHora.gte : undefined;
  assert.ok(gte instanceof Date);
  assert.equal(gte.toISOString().slice(0, 10), "2099-06-15");
});
