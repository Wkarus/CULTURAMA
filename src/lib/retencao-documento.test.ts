import assert from "node:assert/strict";
import { test } from "node:test";
import { documentoVencido, RETENCAO_DOCUMENTO_DIAS } from "./retencao-documento";

const agora = new Date("2026-12-01T12:00:00Z");
const diasAtras = (dias: number) => new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
const org = (statusVerificacao: "pendente" | "aprovado" | "rejeitado" | "recusado_automaticamente", dias: number | null, documentoUrl = "storage:documentos/x.pdf") => ({
  statusVerificacao,
  dataVerificacao: dias === null ? null : diasAtras(dias),
  documentoUrl,
});

test("documento só vence depois da decisão e do prazo de retenção", () => {
  assert.equal(documentoVencido(org("aprovado", RETENCAO_DOCUMENTO_DIAS + 1), agora), true);
  assert.equal(documentoVencido(org("rejeitado", RETENCAO_DOCUMENTO_DIAS + 1), agora), true);
  assert.equal(documentoVencido(org("recusado_automaticamente", 90), agora), true);
  assert.equal(documentoVencido(org("aprovado", RETENCAO_DOCUMENTO_DIAS - 1), agora), false, "ainda no prazo de contestação");
});

test("pedido em análise, sem data ou já apagado não é tocado", () => {
  assert.equal(documentoVencido(org("pendente", 400), agora), false);
  assert.equal(documentoVencido(org("aprovado", null), agora), false);
  assert.equal(documentoVencido(org("aprovado", 400, ""), agora), false);
});
