import assert from "node:assert/strict";
import { test } from "node:test";
import { eventWhereFromParams } from "./event-filters";

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
