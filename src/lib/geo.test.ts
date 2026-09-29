import assert from "node:assert/strict";
import { test } from "node:test";
import { haversineKm, hasValidCoords } from "./geo";

test("distância Ibirapuera a Pacaembu fica na faixa urbana", () => {
  const km = haversineKm({ lat: -23.5874, lng: -46.6576 }, { lat: -23.5456, lng: -46.6653 });
  assert.ok(km > 3 && km < 8);
});

test("0,0 não conta como coordenada de evento", () => {
  assert.equal(hasValidCoords(0, 0), false);
  assert.equal(hasValidCoords(-23.55, -46.63), true);
});
