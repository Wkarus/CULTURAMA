import assert from "node:assert/strict";
import { test } from "node:test";
import { descricaoTicketmaster } from "./ticketmaster";

const evento = {
  id: "ZFIMVHtnMZ17FF7b",
  name: "Diogo Portugal - Medianeira",
  sales: { public: { endDateTime: "2026-12-19T23:00:00Z" } },
  _embedded: {
    attractions: [{ name: "Diogo Portugal" }],
    venues: [{ name: "Auditório CEEP", city: { name: "Medianeira" } }],
  },
};

test("sem info da Ticketmaster, a descrição usa categoria, atração, local e fim das vendas", () => {
  assert.equal(
    descricaoTicketmaster(evento, "Stand-up"),
    "Stand-up com Diogo Portugal. Em Auditório CEEP, Medianeira. Ingressos à venda na Ticketmaster até 19 de dezembro.",
  );
});

test("texto próprio do evento vence; sem nada, ainda sai uma frase útil", () => {
  assert.equal(descricaoTicketmaster({ ...evento, info: "Classificação 16 anos." }, "Stand-up"), "Classificação 16 anos.");
  assert.equal(descricaoTicketmaster({ id: "x", name: "Show" }, null), "Ingressos à venda na Ticketmaster.");
});
