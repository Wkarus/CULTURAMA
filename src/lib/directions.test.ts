import assert from "node:assert/strict";
import { test } from "node:test";
import { stripHtmlInstrucao } from "./directions";

test("instrução da Directions vira texto sem tags", () => {
  const raw = "<b>Siga</b> na direção sudoeste na <b>Rua Augusta</b><div>Destino ficará à direita</div>";
  assert.equal(stripHtmlInstrucao(raw), "Siga na direção sudoeste na Rua Augusta. Destino ficará à direita");
});
