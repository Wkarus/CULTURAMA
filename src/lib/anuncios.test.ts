import assert from "node:assert/strict";
import { test } from "node:test";
import { contaComoExibicao, formatarCtr, linkSeguro, statusDoAnuncio } from "./anuncios";

test("linkSeguro aceita só http(s)", () => {
  assert.equal(linkSeguro("https://patrocinador.com.br/promo"), "https://patrocinador.com.br/promo");
  assert.equal(linkSeguro("javascript:alert(1)"), null);
  assert.equal(linkSeguro("data:text/html,oi"), null);
  assert.equal(linkSeguro("não é url"), null);
});

test("CTR em porcentagem e traço sem exibição", () => {
  assert.equal(formatarCtr(0, 0), "—");
  assert.equal(formatarCtr(200, 3), "1,5%");
  assert.equal(formatarCtr(3, 1), "33,33%");
});

test("robô e prefetch não contam exibição", () => {
  assert.equal(contaComoExibicao(new Headers({ "user-agent": "Mozilla/5.0 Chrome/130" })), true);
  assert.equal(contaComoExibicao(new Headers({ "user-agent": "Googlebot/2.1" })), false);
  assert.equal(contaComoExibicao(new Headers({ "user-agent": "Mozilla/5.0", "next-router-prefetch": "1" })), false);
});

test("status do anúncio pelo período", () => {
  const agora = new Date("2026-10-02T12:00:00Z");
  const dia = 864e5;
  const slot = (ativo: boolean, ini: number, fim: number) => ({
    ativo,
    dataInicio: new Date(agora.getTime() + ini * dia),
    dataFim: new Date(agora.getTime() + fim * dia),
  });
  assert.equal(statusDoAnuncio(slot(true, -1, 1), agora), "no_ar");
  assert.equal(statusDoAnuncio(slot(true, 1, 2), agora), "agendado");
  assert.equal(statusDoAnuncio(slot(true, -3, -1), agora), "encerrado");
  assert.equal(statusDoAnuncio(slot(false, -1, 1), agora), "pausado");
});
