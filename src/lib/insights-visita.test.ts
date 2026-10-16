import assert from "node:assert/strict";
import { test } from "node:test";
import { JANELA_VISITA_MS, marcasVigentes, visitaRepetida, type MarcaVisita } from "./insights-visita";

const agora = 1_000_000;

test("ignora o mesmo tipo no mesmo evento dentro de 30 minutos", () => {
  const marcas: MarcaVisita[] = [{ e: "evt", t: "visualizacao", a: agora - 60_000 }];
  assert.equal(visitaRepetida(marcas, "evt", "visualizacao", agora), true);
  assert.equal(visitaRepetida(marcas, "evt", "ingresso", agora), false);
  assert.equal(visitaRepetida(marcas, "outro", "visualizacao", agora), false);
});

test("depois de 30 minutos a visita conta de novo", () => {
  const marcas: MarcaVisita[] = [{ e: "evt", t: "visualizacao", a: agora - JANELA_VISITA_MS }];
  assert.equal(visitaRepetida(marcas, "evt", "visualizacao", agora), false);
  assert.deepEqual(marcasVigentes(marcas, agora), []);
});
