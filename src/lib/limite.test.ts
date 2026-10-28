import assert from "node:assert/strict";
import { test } from "node:test";
import { chaveDoLimite, ipDe } from "./limite";

test("IP do visitante vem do primeiro X-Forwarded-For", () => {
  assert.equal(ipDe(new Headers({ "x-forwarded-for": "200.1.2.3, 10.0.0.1" })), "200.1.2.3");
  assert.equal(ipDe(new Headers({ "x-real-ip": "200.9.9.9" })), "200.9.9.9");
  assert.equal(ipDe(new Headers()), "sem-ip");
});

test("chave do limite é hash: não guarda IP nem e-mail e separa por tipo", () => {
  const chave = chaveDoLimite("loginConta", "Maria@Exemplo.com ");
  assert.equal(chave, chaveDoLimite("loginConta", "maria@exemplo.com"), "e-mail sem diferença de caixa e espaço");
  assert.ok(!chave.includes("maria") && !chave.includes("exemplo"));
  assert.notEqual(chaveDoLimite("login", "200.1.2.3"), chaveDoLimite("rota", "200.1.2.3"));
  assert.match(chave, /^loginConta:[0-9a-f]{40}$/);
});
