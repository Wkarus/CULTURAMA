"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { StatusVerificacao } from "@prisma/client";
import type { FormState } from "@/actions/auth";
import { requireAdmin } from "@/lib/admin";
import { adminEmail } from "@/lib/admin-email";
import { registrarLog } from "@/lib/admin-log";
import { signIn, auth } from "@/auth";
import { isValidCnpj, lookupCnpj, normalizeCnpj } from "@/lib/cnpj";
import { enviarEmail } from "@/lib/email";
import { emailAprovado, emailNovoPedidoAdmin, emailRecusaAutomatica, emailRecusaManual } from "@/lib/emails/pedidos";
import { isMaiorDe18 } from "@/lib/idade";
import { AVISO_LIMITE_CADASTRO, ipDe, registrarTentativa } from "@/lib/limite";
import { avaliarPedido, motivoManual, type ConsultaPedido } from "@/lib/pedido-acesso";
import { prisma } from "@/lib/prisma";

async function avisarFilaEmpresa(entrada: {
  nome: string;
  email: string;
  documento: string;
  pedidoEm: Date;
  checagem: string;
}) {
  const destino = adminEmail();
  if (!destino) return;
  await enviarEmail({
    ...emailNovoPedidoAdmin({
      perfil: "empresa",
      nome: entrada.nome,
      email: entrada.email,
      tipoDocumento: "CNPJ",
      documento: entrada.documento,
      pedidoEm: entrada.pedidoEm,
      checagem: entrada.checagem,
    }),
    para: destino,
  });
}

export async function cadastrarEmpresa(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await registrarTentativa("cadastro", ipDe(headers())))) return { error: AVISO_LIMITE_CADASTRO };
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const razaoSocial = String(formData.get("razaoSocial") ?? "").trim();
  const cnpj = normalizeCnpj(String(formData.get("cnpj") ?? ""));
  const aceite = formData.get("aceite") === "on";

  if (!nome || !email || !razaoSocial) return { error: "Preencha nome, e-mail e razão social." };
  if (!aceite) return { error: "É preciso aceitar a Política de Privacidade." };

  const session = await auth();
  const reenvio = session?.user?.tipo === "empresa" ? session.user.id : null;
  if (!reenvio && senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

  let nascimento: Date | null = null;
  if (reenvio) {
    const conta = await prisma.user.findUnique({
      where: { id: reenvio },
      select: { dataNascimento: true, empresa: { select: { id: true, status: true } } },
    });
    if (!conta?.empresa || (conta.empresa.status !== "rejeitado" && conta.empresa.status !== "recusado_automaticamente")) {
      return { error: "Esta conta já tem um pedido de empresa." };
    }
    nascimento = conta.dataNascimento;
  }

  const documentoValido = isValidCnpj(cnpj);
  let consulta: ConsultaPedido = "nao_aplica";
  let razaoReceita = "";
  if (documentoValido) {
    const busca = await lookupCnpj(cnpj);
    if (busca.resultado === "ativa") razaoReceita = busca.razaoSocial;
    consulta = busca.resultado === "invalido" ? "nao_aplica" : busca.resultado;
  }

  const outro = documentoValido
    ? await prisma.empresa.findFirst({
        where: { cnpj, ...(reenvio ? { userId: { not: reenvio } } : {}) },
        select: { id: true },
      })
    : null;

  const avaliacao = avaliarPedido({
    perfil: "empresa",
    tipoDocumento: "CNPJ",
    documentoValido,
    documentoJaUsado: Boolean(outro),
    menorDeIdade: Boolean(nascimento) && !isMaiorDe18(nascimento!),
    arquivoInvalido: false,
    consulta,
    modoTeste: false,
  });

  if (avaliacao.destino === "recusado" && avaliacao.codigo === "DOCUMENTO_JA_CADASTRADO") {
    await enviarEmail(emailRecusaAutomatica({ perfil: "empresa", nome, para: email, codigo: avaliacao.codigo }));
    return { aviso: "Esse CNPJ já está em outra conta. Enviamos o motivo para o seu e-mail." };
  }

  const status: StatusVerificacao = avaliacao.destino === "fila" ? "pendente" : "recusado_automaticamente";
  const agora = new Date();
  const razao = razaoReceita || razaoSocial;
  const dadosEmpresa = {
    razaoSocial: razao,
    cnpj,
    status,
    dataVerificacao: status === "pendente" ? null : agora,
    pedidoEm: agora,
    motivoCodigo: avaliacao.destino === "recusado" ? avaliacao.codigo : null,
    motivoTexto: null,
    observacao: avaliacao.destino === "fila" ? avaliacao.observacao : null,
  };

  if (reenvio) {
    await prisma.empresa.update({ where: { userId: reenvio }, data: dadosEmpresa });
  } else {
    const existente = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existente) return { error: "Já existe uma conta com este e-mail." };
    await prisma.user.create({
      data: {
        nome,
        email,
        senhaHash: await hash(senha, 12),
        tipo: "empresa",
        aceitePrivacidadeEm: new Date(),
        empresa: { create: dadosEmpresa },
      },
    });
  }

  if (avaliacao.destino === "recusado") {
    await enviarEmail(emailRecusaAutomatica({ perfil: "empresa", nome, para: email, codigo: avaliacao.codigo }));
  } else {
    await avisarFilaEmpresa({ nome: razao, email, documento: cnpj, pedidoEm: agora, checagem: avaliacao.checagem });
  }

  revalidatePath("/admin/empresas");
  revalidatePath("/conta");
  if (reenvio) return { ok: true, aviso: status === "pendente" ? "Novo pedido enviado. Ele está em análise." : "O novo pedido não pôde ser aprovado automaticamente. O motivo foi para o seu e-mail." };

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
  const decisao = String(formData.get("decisao") ?? "");
  const motivo = String(formData.get("motivo") ?? "");
  const motivoTexto = String(formData.get("motivoTexto") ?? "").trim();
  if (!id || (decisao !== "aprovado" && decisao !== "rejeitado")) return { error: "Decisão inválida." };
  if (decisao === "rejeitado" && !motivoManual(motivo)) return { error: "Escolha o motivo da recusa." };

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    select: { id: true, razaoSocial: true, status: true, user: { select: { nome: true, email: true } } },
  });
  if (!empresa) return { error: "Empresa não encontrada." };

  await prisma.empresa.update({
    where: { id },
    data: {
      status: decisao,
      dataVerificacao: new Date(),
      motivoCodigo: decisao === "rejeitado" ? motivo : null,
      motivoTexto: decisao === "rejeitado" ? motivoTexto || null : null,
    },
  });
  await registrarLog(autor, "empresa.decidir", "empresa", id, {
    razaoSocial: empresa.razaoSocial,
    statusAntes: empresa.status,
    status: decisao,
    motivo,
  });

  if (decisao === "aprovado") {
    await enviarEmail(emailAprovado({ perfil: "empresa", nome: empresa.user.nome, para: empresa.user.email }));
  } else {
    await enviarEmail(
      emailRecusaManual({
        perfil: "empresa",
        nome: empresa.user.nome,
        para: empresa.user.email,
        motivoCodigo: motivo,
        motivoTexto,
      }),
    );
  }

  revalidatePath("/admin/empresas");
  revalidatePath("/insights");
  revalidatePath("/conta");
  return { ok: true };
}
