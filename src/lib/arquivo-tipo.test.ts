import assert from "node:assert/strict";
import { test } from "node:test";
import { tipoPelosBytes } from "./arquivo-tipo";

const bytes = (...valores: (number | string)[]) =>
  Uint8Array.from(valores.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));

test("reconhece PDF, JPEG, PNG e WebP pelo conteúdo", () => {
  assert.equal(tipoPelosBytes(bytes("%PDF-1.7")), "application/pdf");
  assert.equal(tipoPelosBytes(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(tipoPelosBytes(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(tipoPelosBytes(bytes("RIFF", 0, 0, 0, 0, "WEBP")), "image/webp");
});

test("recusa o que não é imagem nem PDF, mesmo com nome de imagem", () => {
  assert.equal(tipoPelosBytes(bytes("MZ", 0x90, 0)), null, "executável do Windows");
  assert.equal(tipoPelosBytes(bytes("<html><script>")), null);
  assert.equal(tipoPelosBytes(bytes("RIFF", 0, 0, 0, 0, "WAVE")), null, "áudio WAV também começa com RIFF");
  assert.equal(tipoPelosBytes(new Uint8Array()), null);
});
