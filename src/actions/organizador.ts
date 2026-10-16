"use server";

import type { StatusVerificacao, TipoDocumento } from "@prisma/client";
import { auth, unstable_update } from "@/auth";
import type { FormState } from "@/actions/auth";
import { isValidCnpj, lookupCnpj, modoTesteOrganizador, normalizeCnpj } from "@/lib/cnpj";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";
import { enviarEmail } from "@/lib/email";
import { emailNovoPedidoAdmin, emailRecusaAutomatica } from "@/lib/emails/pedidos";
import { adminEmail } from "@/lib/admin-email";
import { isMaiorDe18 } from "@/lib/idade";
import { arquivoDocumentoInvalido, avaliarPedido, type ConsultaPedido } from "@/lib/pedido-acesso";
import { prisma } from "@/lib/prisma";
import { salvarDocumento } from "@/lib/upload";

function avisoDoPedido(status: StatusVerificacao) {
  if (status === "recusado_automaticamente") {
    return "Seu pedido foi registrado, mas não pôde ser aprovado automaticamente. Enviamos o motivo para o seu e-mail.";
  }
  if (status === "aprovado") return "Cadastro aprovado. Você já pode publicar eventos.";
  return "Cadastro enviado. Seu pedido está em análise.";
}

export async function cadastrarOrganizador(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Entre na sua conta para se cadastrar como organizador." };
  }
  if (session.user.needsCompletion) {
    return { error: "Complete seu cadastro (idade e privacidade) antes de continuar." };
  }

  const nomeEmpresa = String(formData.get("nomeEmpresa") ?? "").trim();
  const tipoDocumento = String(formData.get("tipoDocumento") ?? "");
  const documentoRaw = String(formData.get("documento") ?? "");
  const arquivo = formData.get("documentoArquivo");

  if (!nomeEmpresa) return { error: "Informe o nome da empresa ou coletivo." };
  if (tipoDocumento !== "CPF" && tipoDocumento !== "CNPJ") return { error: "Escolha CPF ou CNPJ." };
  const documentoTipo: TipoDocumento = tipoDocumento;

  let pessoa: { nome: string; email: string; dataNascimento: Date | null };
  let existente: { id: string; statusVerificacao: StatusVerificacao } | null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nome: true, email: true, dataNascimento: true, organizer: { select: { id: true, statusVerificacao: true } } },
    });
    if (!user) return { error: "Conta não encontrada." };
    pessoa = user;
    existente = user.organizer;
  } catch {
    return { error: "Não foi possível consultar o cadastro agora. Tente de novo." };
  }

  if (existente && existente.statusVerificacao !== "rejeitado" && existente.statusVerificacao !== "recusado_automaticamente") {
    return { error: "Esta conta já tem um cadastro de organizador." };
  }

  const modoTeste = modoTesteOrganizador();
  const documento = tipoDocumento === "CPF" ? normalizeCpf(documentoRaw) : normalizeCnpj(documentoRaw);
  const documentoValido = tipoDocumento === "CPF" ? isValidCpf(documento) : isValidCnpj(documento);

  let consulta: ConsultaPedido = "nao_aplica";
  let razaoSocial = "";
  if (documentoValido && tipoDocumento === "CNPJ" && !modoTeste) {
    const busca = await lookupCnpj(documento);
    if (busca.resultado === "ativa") razaoSocial = busca.razaoSocial;
    consulta = busca.resultado === "invalido" ? "nao_aplica" : busca.resultado;
  }

  let documentoJaUsado = false;
  if (documentoValido) {
    try {
      const outro = await prisma.organizer.findFirst({
        where: { documento, ...(existente ? { id: { not: existente.id } } : {}) },
        select: { id: true },
      });
      documentoJaUsado = Boolean(outro);
    } catch {
      return { error: "Não foi possível consultar o cadastro agora. Tente de novo." };
    }
  }

  const avaliacao = avaliarPedido({
    perfil: "organizador",
    tipoDocumento,
    documentoValido,
    documentoJaUsado,
    menorDeIdade: Boolean(pessoa.dataNascimento) && !isMaiorDe18(pessoa.dataNascimento!),
    arquivoInvalido: arquivoDocumentoInvalido(arquivo, !modoTeste),
    consulta,
    modoTeste,
  });

  let documentoUrl = "";
  if (avaliacao.destino !== "recusado" || avaliacao.codigo !== "ARQUIVO_INVALIDO") {
    if (modoTeste && arquivo instanceof File && arquivo.size > 0 && !arquivoDocumentoInvalido(arquivo, false)) {
      documentoUrl = arquivo.name.replace(/[\\/]/g, "").slice(0, 180);
    } else if (!modoTeste && arquivo instanceof File && arquivo.size > 0 && !arquivoDocumentoInvalido(arquivo, true)) {
      try {
        const saved = await salvarDocumento(arquivo);
        if (!saved.ok) return { error: saved.message };
        documentoUrl = saved.url;
      } catch {
        return { error: "Não foi possível guardar o arquivo do documento. Tente de novo." };
      }
    }
  }

  const status: StatusVerificacao =
    avaliacao.destino === "aprovado" ? "aprovado" : avaliacao.destino === "fila" ? "pendente" : "recusado_automaticamente";
  const agora = new Date();
  const dados = {
    nomeEmpresa: razaoSocial || nomeEmpresa,
    documento,
    tipoDocumento: documentoTipo,
    statusVerificacao: status,
    dataVerificacao: status === "pendente" ? null : agora,
    pedidoEm: agora,
    motivoCodigo: avaliacao.destino === "recusado" ? avaliacao.codigo : null,
    motivoTexto: null,
    observacao: avaliacao.destino === "fila" ? avaliacao.observacao : null,
    documentoUrl,
  };

  try {
    if (existente) {
      await prisma.organizer.update({ where: { id: existente.id }, data: dados });
    } else {
      await prisma.$transaction([
        prisma.organizer.create({ data: { userId: session.user.id, ...dados } }),
        prisma.user.update({
          where: { id: session.user.id },
          data: { tipo: session.user.tipo === "admin" ? "admin" : "organizador" },
        }),
      ]);
    }
    await unstable_update({
      user: { tipo: session.user.tipo === "admin" ? "admin" : "organizador", statusVerificacao: status },
    });
  } catch {
    return { error: "Não foi possível salvar o cadastro. Tente de novo." };
  }

  if (avaliacao.destino === "recusado") {
    await enviarEmail(emailRecusaAutomatica({ perfil: "organizador", nome: pessoa.nome, para: pessoa.email, codigo: avaliacao.codigo }));
  } else if (avaliacao.destino === "fila") {
    const destino = adminEmail();
    if (destino) {
      await enviarEmail({
        ...emailNovoPedidoAdmin({
          perfil: "organizador",
          nome: pessoa.nome,
          email: pessoa.email,
          tipoDocumento,
          documento,
          pedidoEm: agora,
          checagem: avaliacao.checagem,
        }),
        para: destino,
      });
    }
  }

  return { ok: true, aviso: avisoDoPedido(status) };
}
