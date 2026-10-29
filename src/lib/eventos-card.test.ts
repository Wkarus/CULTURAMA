import assert from "node:assert/strict";
import { test } from "node:test";
import { cidadeDoEvento, dataDoCard, linhaDoLocal, misturarVitrine, seloRestricaoCard, selosAcessibilidade } from "./eventos";

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

test("cidade do evento ignora bairro e estado", () => {
  assert.equal(
    cidadeDoEvento({ endereco: "Biblioteca Parque Erasmo, Rua X, 10 - Parque Erasmo Assunção, Santo André - SP", fonte: "mapas_culturais" }),
    "Santo André",
  );
  assert.equal(cidadeDoEvento({ endereco: "Qualistage, Av. Ayrton Senna, 3000 - Barra da Tijuca, Rio de Janeiro, Rio de Janeiro", fonte: "ticketmaster" }), "Rio de Janeiro");
  assert.equal(cidadeDoEvento({ endereco: "MorumBis", fonte: "ticketmaster" }), null, "só o local, sem cidade");
  assert.equal(cidadeDoEvento({ endereco: "Brasil", fonte: "interno" }), null);
});

test("vitrine: foto primeiro, alternando fonte e categoria", () => {
  const ev = (id: string, fonte: string, categoriaId: string, foto: boolean) => ({ id, fonte, categoriaId, imagemCapa: foto ? `https://x/${id}.jpg` : null });
  const lista = [
    ev("a1", "mapas_culturais", "teatro", false),
    ev("a2", "mapas_culturais", "teatro", false),
    ev("a3", "mapas_culturais", "oficinas", false),
    ev("t1", "ticketmaster", "rock", true),
    ev("t2", "ticketmaster", "rock", true),
    ev("i1", "interno", "samba", true),
  ];
  assert.deepEqual(misturarVitrine(lista, 6).map((e) => e.id), ["t1", "i1", "t2", "a1", "a3", "a2"]);
  assert.equal(misturarVitrine(lista, 2).length, 2);
});

test("vitrine: com foto só de uma fonte, as outras fontes ainda entram no fim", () => {
  const tm = Array.from({ length: 13 }, (_, i) => ({ id: `t${i}`, fonte: "ticketmaster", categoriaId: i % 2 ? "rock" : "pop", imagemCapa: `https://x/${i}.jpg` }));
  const mc = Array.from({ length: 33 }, (_, i) => ({ id: `m${i}`, fonte: "mapas_culturais", categoriaId: i % 3 ? "teatro" : "oficinas", imagemCapa: null }));
  const ids = misturarVitrine([...mc, ...tm], 8).map((e) => e.id);
  assert.equal(ids.length, 8);
  assert.ok(ids.slice(0, 6).every((id) => id.startsWith("t")), "6 primeiros com foto");
  assert.deepEqual(ids.slice(6), ["m0", "m1"], "2 últimos de outra fonte, categorias diferentes");
});

test("selos de acessibilidade em ordem fixa", () => {
  assert.deepEqual(selosAcessibilidade({ libras: true, audiodescricao: true, acessibilidade: ["Rampa de acesso"] }), ["Libras", "Audiodescrição", "Acessível"]);
  assert.deepEqual(selosAcessibilidade({ libras: false, audiodescricao: false, acessibilidade: [] }), []);
});
