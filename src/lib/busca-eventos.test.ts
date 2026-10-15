import assert from "node:assert/strict";
import { test } from "node:test";
import { ehFimDeSemana, ehHoje, fimDeSemana, hrefBusca } from "./busca-eventos";
import { filtraBusca, filterPublishedEvents } from "./event-filters";

const SEXTA = new Date("2026-10-16T15:00:00.000Z");

test("hoje e fim de semana no fuso de São Paulo", () => {
  assert.equal(ehHoje({ de: "2026-10-16", ate: "2026-10-16" }, SEXTA), true);
  assert.deepEqual(fimDeSemana(SEXTA), { de: "2026-10-17", ate: "2026-10-18" });
  assert.equal(ehFimDeSemana({ de: "2026-10-17", ate: "2026-10-18" }, SEXTA), true);
  const domingo = new Date("2026-10-18T15:00:00.000Z");
  assert.deepEqual(fimDeSemana(domingo), { de: "2026-10-17", ate: "2026-10-18" });
});

test("href preserva os parâmetros e apaga com null", () => {
  const href = hrefBusca("/eventos", { categoria: "musica", preco: "gratuito" }, { preco: null, q: "rock" });
  assert.equal(href, "/eventos?q=rock&categoria=musica");
  assert.equal(hrefBusca("/mapa", { preco: "todos", distancia: "todas" }), "/mapa");
});

test("busca e distância de 1 a 50 km", () => {
  const eventos = [
    { titulo: "Roda de samba", endereco: "Centro, São Paulo", gratuito: true, latitude: 0, longitude: 0, category: { nome: "Pagode", parent: { nome: "Samba" } } },
    { titulo: "Show", endereco: "Recife", gratuito: false, latitude: -23.55, longitude: -46.63, category: { nome: "Rock", parent: null } },
  ];
  assert.equal(filtraBusca(eventos, "samba").length, 1);
  assert.equal(filtraBusca(eventos, "  ").length, 2);
  const perto = filterPublishedEvents(eventos, { lat: "-23.55", lng: "-46.63", distancia: "12" });
  assert.deepEqual(perto.map((evento) => evento.titulo), ["Show"]);
  assert.equal(filterPublishedEvents(eventos, { distancia: "80" }).length, 2);
});
