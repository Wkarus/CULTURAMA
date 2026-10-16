import assert from "node:assert/strict";
import { test } from "node:test";
import { inicioDoPainel, podeAcessar, podeExcluirEvento, type SecaoPainel } from "./admin-permissoes";

const TODAS: SecaoPainel[] = [
  "visao-geral",
  "revisao",
  "eventos",
  "categorias",
  "organizadores",
  "usuarios",
  "comentarios",
  "denuncias",
  "anuncios",
  "historico",
  "empresas",
];

test("admin acessa todas as seções", () => {
  for (const secao of TODAS) assert.equal(podeAcessar("admin", secao), true, secao);
  assert.equal(podeExcluirEvento("admin"), true);
});

test("moderador só acessa revisão, eventos, comentários e denúncias", () => {
  const liberadas = TODAS.filter((secao) => podeAcessar("moderador", secao));
  assert.deepEqual(liberadas, ["revisao", "eventos", "comentarios", "denuncias"]);
  assert.equal(podeExcluirEvento("moderador"), false);
});

test("início do painel cai numa seção liberada", () => {
  assert.equal(inicioDoPainel("admin"), "/admin");
  assert.equal(podeAcessar("moderador", inicioDoPainel("moderador").replace("/admin/", "") as SecaoPainel), true);
});
