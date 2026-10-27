import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIAS_ARVORE } from "./categorias-dados";
import { mapCategoriaSlug } from "./ticketmaster-categorias";

const tm = (segment: string, genre?: string, subGenre?: string, name = "Evento") => ({
  name,
  classifications: [{ primary: true, segment: { name: segment }, genre: { name: genre ?? "Undefined" }, subGenre: { name: subGenre ?? "Undefined" } }],
});

test("Sports vai para a subcategoria certa e nunca para festival", () => {
  assert.equal(mapCategoriaSlug(tm("Sports", "Running")), "corrida");
  assert.equal(mapCategoriaSlug(tm("Sports", "Martial Arts")), "judo-e-lutas");
  assert.equal(mapCategoriaSlug(tm("Sports", "Boxing")), "judo-e-lutas");
  assert.equal(mapCategoriaSlug(tm("Sports", "eSports")), "games");
  assert.equal(mapCategoriaSlug(tm("Sports", "Football")), "esportes");
  assert.equal(mapCategoriaSlug(tm("Sports", "Undefined", "Undefined", "Festival de Verão")), "esportes");
});

test("Music usa o gênero e cai na mãe quando não reconhece", () => {
  assert.equal(mapCategoriaSlug(tm("Music", "Electronic")), "eletronica");
  assert.equal(mapCategoriaSlug(tm("Music", "Dance/Electronic")), "eletronica");
  assert.equal(mapCategoriaSlug(tm("Music", "Classical")), "classica-e-concertos");
  assert.equal(mapCategoriaSlug(tm("Music", "Rock")), "rock");
  assert.equal(mapCategoriaSlug(tm("Music", "Metal")), "rock");
  assert.equal(mapCategoriaSlug(tm("Music", "Hip-Hop/Rap")), "rap-e-rima");
  assert.equal(mapCategoriaSlug(tm("Music", "Country")), "sertanejo");
  assert.equal(mapCategoriaSlug(tm("Music", "Pop")), "musica");
  assert.equal(mapCategoriaSlug(tm("Music", "Latin", "Samba")), "samba");
  assert.equal(mapCategoriaSlug(tm("Music", "World", "Undefined", "Roda de Samba no Bar")), "roda-de-samba");
  assert.equal(mapCategoriaSlug(tm("Music", "Pop", "Undefined", "Lolla Festival de Música")), "festivais-de-musica");
});

test("Arts & Theatre e Miscellaneous", () => {
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Comedy")), "stand-up");
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Dance")), "danca");
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Theatre")), "teatro");
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Circus & Specialty Acts")), "circo");
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Multimedia")), "arte-e-exposicao");
  assert.equal(mapCategoriaSlug(tm("Miscellaneous", "Food & Drink")), "festivais-gastronomicos");
  assert.equal(mapCategoriaSlug(tm("Miscellaneous", "Fairs & Festivals")), "feiras");
  assert.equal(mapCategoriaSlug(tm("Miscellaneous", "Undefined")), "feiras-e-gastronomia");
  assert.equal(mapCategoriaSlug({ name: "Sem classificação" }), "musica");
});

test("todo slug devolvido existe na árvore", () => {
  const slugs = new Set(CATEGORIAS_ARVORE.flatMap((m) => [m.slug, ...m.filhas.map((f) => f.slug)]));
  for (const seg of ["Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous", "Undefined"]) {
    for (const genre of ["Rock", "Running", "Comedy", "Food & Drink", "Undefined", "Anime"]) {
      assert.ok(slugs.has(mapCategoriaSlug(tm(seg, genre))), `${seg}/${genre}`);
    }
  }
});

test("samba ou rap no título vence o gênero genérico de outro segmento", () => {
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Fine Art", "Undefined", "Samba nas Alturas | Sampa Sky")), "samba");
  assert.equal(mapCategoriaSlug(tm("Miscellaneous", "Undefined", "Undefined", "Batalha de Rima da Aldeia")), "rap-e-rima");
  assert.equal(mapCategoriaSlug(tm("Arts & Theatre", "Fine Art", "Undefined", "Exposição Sambaqui")), "exposicoes", "palavra parecida não conta");
  assert.equal(mapCategoriaSlug(tm("Music", "Rock", "Undefined", "Rock com samba")), "rock", "em Música o gênero manda");
});
