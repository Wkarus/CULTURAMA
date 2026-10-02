"use server";

import { unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/actions/auth";
import { requireAdmin } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import { prisma } from "@/lib/prisma";
import { PREFIXO_PRIVADO, caminhoDeCapa, removerArquivo } from "@/lib/storage";

function atualizar() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/eventos");
  revalidatePath("/mapa");
}

export async function alternarSuspensaoOrganizador(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const organizer = await prisma.organizer.findUnique({ where: { id }, select: { id: true, nomeEmpresa: true, suspensoEm: true } });
  if (!organizer) return { error: "Organizador não encontrado." };

  const suspender = !organizer.suspensoEm;
  await prisma.organizer.update({ where: { id }, data: { suspensoEm: suspender ? new Date() : null } });
  await registrarLog(autor, suspender ? "organizador.suspender" : "organizador.reativar", "organizador", id, {
    nomeEmpresa: organizer.nomeEmpresa,
  });

  atualizar();
  return { ok: true };
}

async function alvoEditavel(autorId: string, id: string) {
  if (!id) return { error: "Usuário inválido." as const };
  if (id === autorId) return { error: "Você não pode fazer isso com a sua própria conta." as const };
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, tipo: true, suspensoEm: true, organizer: { select: { id: true, documentoUrl: true } } },
  });
  if (!user) return { error: "Usuário não encontrado." as const };
  if (user.tipo === "admin") return { error: "Contas de administrador não podem ser alteradas por aqui." as const };
  return { user };
}

export async function alternarSuspensaoUsuario(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const alvo = await alvoEditavel(autor.id, String(formData.get("id") ?? ""));
  if ("error" in alvo) return { error: alvo.error };

  const suspender = !alvo.user.suspensoEm;
  await prisma.user.update({ where: { id: alvo.user.id }, data: { suspensoEm: suspender ? new Date() : null } });
  await registrarLog(autor, suspender ? "usuario.suspender" : "usuario.reativar", "usuario", alvo.user.id, {
    nome: alvo.user.nome,
  });

  atualizar();
  return { ok: true };
}

export async function mudarPapel(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const alvo = await alvoEditavel(autor.id, String(formData.get("id") ?? ""));
  if ("error" in alvo) return { error: alvo.error };

  const papel = String(formData.get("papel") ?? "");
  const { user } = alvo;
  let novo: "moderador" | "organizador" | "comum";
  if (papel === "moderador") {
    if (user.tipo === "moderador") return { error: "Essa pessoa já é moderadora." };
    novo = "moderador";
  } else if (papel === "remover") {
    if (user.tipo !== "moderador") return { error: "Essa pessoa não é moderadora." };
    novo = user.organizer ? "organizador" : "comum";
  } else {
    return { error: "Papel inválido." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { tipo: novo } });
  await registrarLog(autor, "usuario.papel", "usuario", user.id, { nome: user.nome, papelAntes: user.tipo, papel: novo });

  atualizar();
  return { ok: true };
}

async function removerDocumento(documentoUrl: string) {
  if (documentoUrl.startsWith(PREFIXO_PRIVADO)) {
    await removerArquivo("documentos", documentoUrl.slice(PREFIXO_PRIVADO.length));
  } else if (documentoUrl.startsWith("/api/uploads/")) {
    const nome = path.basename(documentoUrl);
    await unlink(path.join(process.cwd(), "uploads", nome)).catch(() => undefined);
  }
}

export async function excluirContaEDados(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const alvo = await alvoEditavel(autor.id, String(formData.get("id") ?? ""));
  if ("error" in alvo) return { error: alvo.error };

  const { user } = alvo;
  const confirmacao = String(formData.get("confirmacao") ?? "").trim().toLowerCase();
  if (confirmacao !== user.email.toLowerCase()) {
    return { error: "Digite o e-mail da conta exatamente como aparece para confirmar." };
  }

  const eventos = user.organizer
    ? await prisma.event.findMany({ where: { organizerId: user.organizer.id }, select: { id: true, imagemCapa: true } })
    : [];

  await prisma.$transaction([
    prisma.event.deleteMany({ where: { id: { in: eventos.map((e) => e.id) } } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  await Promise.all([
    ...eventos.map((e) => {
      const caminho = caminhoDeCapa(e.imagemCapa);
      return caminho ? removerArquivo("capas", caminho) : undefined;
    }),
    user.organizer ? removerDocumento(user.organizer.documentoUrl) : undefined,
  ]);

  await registrarLog(autor, "usuario.excluir", "usuario", user.id, {
    eventosRemovidos: eventos.length,
    tinhaOrganizador: Boolean(user.organizer),
  });

  atualizar();
  return { ok: true };
}
