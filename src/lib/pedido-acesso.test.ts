import assert from "node:assert/strict";
import { test } from "node:test";
import { prepararEnvio, type MensagemEmail } from "./email";
import { avaliarPedido, arquivoDocumentoInvalido, documentoMascarado, textoRecusa } from "./pedido-acesso";

const base = {
  perfil: "organizador" as const,
  tipoDocumento: "CPF" as const,
  documentoValido: true,
  documentoJaUsado: false,
  menorDeIdade: false,
  arquivoInvalido: false,
  consulta: "nao_aplica" as const,
  modoTeste: false,
};

test("mascara o documento e não devolve o número completo", () => {
  const cpf = "52998224725";
  const mascarado = documentoMascarado("CPF", cpf);
  assert.equal(mascarado, "CPF ••••4725");
  assert.equal(mascarado.includes(cpf), false);
});

test("recusa documento inválido antes da fila", () => {
  const resultado = avaliarPedido({ ...base, documentoValido: false });
  assert.deepEqual(resultado, { destino: "recusado", codigo: "DOCUMENTO_INVALIDO" });
  assert.match(textoRecusa("DOCUMENTO_INVALIDO").motivo, /não é válido/);
});

test("BrasilAPI fora do ar manda para a fila sem recusar", () => {
  const resultado = avaliarPedido({
    ...base,
    perfil: "empresa",
    tipoDocumento: "CNPJ",
    consulta: "indisponivel",
  });
  assert.equal(resultado.destino, "fila");
  if (resultado.destino === "fila") assert.match(resultado.checagem, /indisponível/);
});

test("modo de teste do organizador ignora a Receita e deixa o CNPJ na fila", () => {
  const resultado = avaliarPedido({
    ...base,
    tipoDocumento: "CNPJ",
    consulta: "nao_encontrado",
    modoTeste: true,
  });
  assert.equal(resultado.destino, "fila");
});

test("CNPJ ativo de organizador aprova; o da empresa fica na fila", () => {
  assert.equal(
    avaliarPedido({ ...base, tipoDocumento: "CNPJ", consulta: "ativa" }).destino,
    "aprovado",
  );
  assert.equal(
    avaliarPedido({ ...base, perfil: "empresa", tipoDocumento: "CNPJ", consulta: "ativa" }).destino,
    "fila",
  );
});

test("arquivo ausente é inválido quando obrigatório e webp não entra", () => {
  assert.equal(arquivoDocumentoInvalido(null, true), true);
  assert.equal(arquivoDocumentoInvalido(null, false), false);
  const webp = new File(["x"], "doc.webp", { type: "image/webp" });
  assert.equal(arquivoDocumentoInvalido(webp, true), true);
});

test("modo de teste redireciona o e-mail para o admin", () => {
  const mensagem: MensagemEmail = { para: "pessoa@example.com", assunto: "Seu pedido", html: "", texto: "" };
  const preparado = prepararEnvio(mensagem, { modoTeste: true, admin: "admin@example.com" });
  assert.equal(preparado?.para, "admin@example.com");
  assert.equal(preparado?.assunto, "[TESTE → pessoa@example.com] Seu pedido");
});
