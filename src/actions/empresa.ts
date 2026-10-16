"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import type { StatusVerificacao } from "@prisma/client";
import type { FormState } from "@/actions/auth";
import { requireAdmin } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import { signIn } from "@/auth";
import { lookupCnpj, normalizeCnpj } from "@/lib/cnpj";
import { prisma } from "@/lib/prisma";

export async function cadastrarEmpresa(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const razaoSocial = String(formData.get("razaoSocial") ?? "").trim();
  const cnpj = normalizeCnpj(String(formData.get("cnpj") ?? ""));
  const aceite = formData.get("aceite") === "on";

  if (!nome || !email || !razaoSocial) return { error: "Preencha nome, e-mail e razão social." };
  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (!aceite) return { error: "É preciso aceitar a Política de Privacidade." };

  const consulta = await lookupCnpj(cnpj);
  if (!consulta.ok) return { error: consulta.message };

  const existente = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existente) return { error: "Já existe uma conta com este e-mail." };
  const cnpjUsado = await prisma.empresa.findUnique({ where: { cnpj }, select: { id: true } });
  if (cnpjUsado) return { error: "Este CNPJ já está cadastrado." };

  await prisma.user.create({
    data: {
      nome,
      email,
      senhaHash: await hash(senha, 12),
      tipo: "empresa",
      aceitePrivacidadeEm: new Date(),
      empresa: { create: { razaoSocial: consulta.razaoSocial || razaoSocial, cnpj, status: "pendente" } },
    },
  });

  try {
    await signIn("credentials", { email, password: senha, redirectTo: "/cadastro/empresa/aguardando" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Conta criada, mas o login automático falhou. Entre em /login." };
    throw error;
  }
  return { ok: true };
}

export async function decidirEmpresa(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decisao = String(formData.get("decisao") ?? "") as StatusVerificacao;
  if (!id || (decisao !== "aprovado" && decisao !== "rejeitado")) return { error: "Decisão inválida." };

  const empresa = await prisma.empresa.findUnique({ where: { id }, select: { id: true, razaoSocial: true, status: true } });
  if (!empresa) return { error: "Empresa não encontrada." };

  await prisma.empresa.update({ where: { id }, data: { status: decisao, dataVerificacao: new Date() } });
  await registrarLog(autor, "empresa.decidir", "empresa", id, {
    razaoSocial: empresa.razaoSocial,
    statusAntes: empresa.status,
    status: decisao,
  });
  revalidatePath("/admin/empresas");
  revalidatePath("/insights");
  return { ok: true };
}
