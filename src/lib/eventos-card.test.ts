import assert from "node:assert/strict";
import { test } from "node:test";
import { dataDoCard, linhaDoLocal, seloRestricaoCard } from "./eventos";

test("data do card no fuso de São Paulo", () => {
  const sexta = dataDoCard(new Date("2026-10-17T01:00:00.000Z"));
  assert.equal(sexta.mes, "OUT");
  assert.equal(sexta.dia, "16");
  assert.equal(sexta.quando, "Sex, 22h");

  const comMinuto = dataDoCard(new Date("2026-10-17T01:30:00.000Z"));
  assert.equal(comMinuto.quando, "Sex, 22h30");
});

test("local e bairro, e selo só para 16+ e 18+", () => {
  assert.equal(
    linhaDoLocal({
      fonte: "mapas_culturais",
      endereco: "Fundação Casa de José Américo, Avenida Cabo Branco, 3336 - Cabo Branco, João Pessoa - PB",
    }),
    "Fundação Casa de José Américo · Cabo Branco",
  );
  assert.equal(
    linhaDoLocal({ fonte: "ticketmaster", endereco: "Allianz Parque, Av. Francisco Matarazzo, São Paulo, São Paulo" }),
    "Allianz Parque · São Paulo",
  );
  assert.equal(linhaDoLocal({ fonte: "interno", endereco: "Mosteiro de São Bento" }), "Mosteiro de São Bento");
  assert.equal(seloRestricaoCard("livre"), null);
  assert.equal(seloRestricaoCard("quatorze"), null);
  assert.equal(seloRestricaoCard("dezesseis"), "16+");
  assert.equal(seloRestricaoCard("dezoito"), "18+");
});
