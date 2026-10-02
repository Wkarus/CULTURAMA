import assert from "node:assert/strict";
import { test } from "node:test";
import { lerDenuncia } from "./denuncias";

function form(campos: Record<string, string>) {
  const dados = new FormData();
  for (const [chave, valor] of Object.entries(campos)) dados.set(chave, valor);
  return dados;
}

test("aceita motivo conhecido com texto opcional", () => {
  assert.deepEqual(lerDenuncia(form({ motivo: "ja_aconteceu" })), { motivo: "ja_aconteceu", texto: null });
  assert.deepEqual(lerDenuncia(form({ motivo: "falso", texto: "  data errada  " })), { motivo: "falso", texto: "data errada" });
});

test("recusa motivo desconhecido", () => {
  assert.ok("error" in lerDenuncia(form({ motivo: "spam" })));
  assert.ok("error" in lerDenuncia(form({})));
});

test("outro exige texto", () => {
  assert.ok("error" in lerDenuncia(form({ motivo: "outro" })));
  assert.ok("error" in lerDenuncia(form({ motivo: "outro", texto: "ok" })));
  assert.deepEqual(lerDenuncia(form({ motivo: "outro", texto: "golpe no link" })), { motivo: "outro", texto: "golpe no link" });
});

test("corta texto em 500 caracteres", () => {
  const r = lerDenuncia(form({ motivo: "improprio", texto: "a".repeat(800) }));
  assert.ok(!("error" in r) && r.texto?.length === 500);
});
