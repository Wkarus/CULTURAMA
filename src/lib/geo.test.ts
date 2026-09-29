import assert from "node:assert/strict";
import { test } from "node:test";
import { filterPublishedEvents } from "./event-filters";
import { haversineKm, hasValidCoords } from "./geo";

test("distância Ibirapuera a Pacaembu fica na faixa urbana", () => {
  const km = haversineKm({ lat: -23.5874, lng: -46.6576 }, { lat: -23.5456, lng: -46.6653 });
  assert.ok(km > 3 && km < 8);
});

test("0,0 não conta como coordenada de evento", () => {
  assert.equal(hasValidCoords(0, 0), false);
  assert.equal(hasValidCoords(-23.55, -46.63), true);
});

test("Perto de mim filtra com latitude negativa", () => {
  const events = [
    { latitude: -23.55, longitude: -46.63, gratuito: false },
    { latitude: -22.9, longitude: -43.2, gratuito: false },
  ];
  const near = filterPublishedEvents(events, { distancia: "10", lat: "-23.55", lng: "-46.63" });
  assert.equal(near.length, 1);
  assert.equal(near[0]?.latitude, -23.55);
});
