import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidCpf, normalizeCpf } from "./cpf";

describe("isValidCpf", () => {
  it("aceita CPF válido conhecido", () => {
    assert.equal(isValidCpf("529.982.247-25"), true);
    assert.equal(isValidCpf("52998224725"), true);
  });

  it("rejeita tamanho errado e sequência repetida", () => {
    assert.equal(isValidCpf("123"), false);
    assert.equal(isValidCpf("000.000.000-00"), false);
    assert.equal(isValidCpf("11111111111"), false);
  });

  it("rejeita dígito verificador inválido", () => {
    assert.equal(isValidCpf("529.982.247-24"), false);
  });

  it("normaliza só dígitos", () => {
    assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
  });
});
