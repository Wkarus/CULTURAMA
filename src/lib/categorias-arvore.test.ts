import assert from "node:assert/strict";
import { test } from "node:test";
import { expandirInteresses, idsDaCategoria, montarArvore, normalizarInteresses } from "./categorias-arvore";

const cat = (id: string, slug: string, parentId: string | null, ordem: number) => ({ id, slug, nome: slug, icone: "Music", parentId, ordem });
const lista = [
  cat("m1", "musica", null, 1),
  cat("s1", "rock", "m1", 2),
  cat("s2", "eletronica", "m1", 1),
  cat("m2", "esportes", null, 2),
  cat("s3", "corrida", "m2", 1),
];

test("árvore ordena mães e filhas por ordem", () => {
  const arvore = montarArvore(lista);
  assert.deepEqual(arvore.map((m) => m.slug), ["musica", "esportes"]);
  assert.deepEqual(arvore[0].filhas.map((f) => f.slug), ["eletronica", "rock"]);
});

test("filtro pela mãe inclui as filhas; pela filha, só ela", () => {
  assert.deepEqual(idsDaCategoria(lista, "musica")?.sort(), ["m1", "s1", "s2"]);
  assert.deepEqual(idsDaCategoria(lista, "rock"), ["s1"]);
  assert.deepEqual(idsDaCategoria(lista, "s3"), ["s3"]);
  assert.deepEqual(idsDaCategoria(lista, "nao-existe"), []);
  assert.equal(idsDaCategoria(lista, ""), null);
});

test("interesse na mãe conta como todas as filhas", () => {
  assert.deepEqual([...expandirInteresses(lista, ["musica", "corrida"])].sort(), ["m1", "s1", "s2", "s3"]);
});

test("normalizar remove filha coberta pela mãe e junta filhas completas na mãe", () => {
  assert.deepEqual(normalizarInteresses(lista, ["musica", "rock", "lixo"]), ["musica"]);
  assert.deepEqual(normalizarInteresses(lista, ["rock", "eletronica"]), ["musica"]);
  assert.deepEqual(normalizarInteresses(lista, ["rock"]), ["rock"]);
  assert.deepEqual(normalizarInteresses(lista, ["corrida"]), ["esportes"]);
});
