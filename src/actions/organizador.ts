"use server";

import { auth, unstable_update } from "@/auth";
import { lookupCnpj, normalizeCnpj } from "@/lib/cnpj";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";
import { prisma } from "@/lib/prisma";
import { salvarDocumento } from "@/lib/upload";
import type { FormState } from "@/actions/auth";

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

  if (!nomeEmpresa) {
    return { error: "Informe o nome da empresa ou coletivo." };
  }
  if (tipoDocumento !== "CPF" && tipoDocumento !== "CNPJ") {
    return { error: "Escolha CPF ou CNPJ." };
  }
  if (!(arquivo instanceof File)) {
    return { error: "Envie o arquivo do documento." };
  }

  const jaExiste = await prisma.organizer.findUnique({ where: { userId: session.user.id } });
  if (jaExiste) {
    return { error: "Esta conta já tem um cadastro de organizador." };
  }

  let documento: string;
  let statusVerificacao: "pendente" | "aprovado" = "pendente";
  let dataVerificacao: Date | null = null;
  if (tipoDocumento === "CPF") {
    documento = normalizeCpf(documentoRaw);
    if (!isValidCpf(documento)) {
      return { error: "CPF inválido. Confira os dígitos." };
    }
  } else {
    documento = normalizeCnpj(documentoRaw);
    const lookup = await lookupCnpj(documento);
    if (!lookup.ok) {
      return { error: lookup.message };
    }
    statusVerificacao = "aprovado";
    dataVerificacao = new Date();
  }

  const saved = await salvarDocumento(arquivo);
  if (!saved.ok) {
    return { error: saved.message };
  }

  await prisma.$transaction([
    prisma.organizer.create({
      data: {
        userId: session.user.id,
        nomeEmpresa,
        documento,
        tipoDocumento,
        statusVerificacao,
        dataVerificacao,
        documentoUrl: saved.url,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { tipo: "organizador" },
    }),
  ]);

  await unstable_update({
    user: { tipo: "organizador", statusVerificacao },
  });

  return { ok: true };
}
