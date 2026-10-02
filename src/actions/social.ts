"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { FormState } from "@/actions/auth";
import { getUsuarioPainel } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import { ensureCategorias } from "@/lib/categorias";
import { normalizarInteresses } from "@/lib/categorias-arvore";
import { EVENTO_PUBLICO } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { suspensoEm: true } });
  if (!user || user.suspensoEm) return null;
  return session.user.id;
}

export async function toggleFavorite(eventId: string): Promise<FormState> {
  const userId = await requireUser();
  if (!userId) return { error: "Entre na conta para favoritar." };

  const event = await prisma.event.findFirst({ where: { id: eventId, ...EVENTO_PUBLICO }, select: { id: true } });
  if (!event) return { error: "Evento não encontrado." };

  const existing = await prisma.favorite.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { userId_eventId: { userId, eventId } } });
  } else {
    await prisma.favorite.create({ data: { userId, eventId } });
  }

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/conta/favoritos");
  return { ok: true };
}

export async function salvarInteresses(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUser();
  if (!userId) return { error: "Entre na conta." };

  const valores = formData
    .getAll("interesse")
    .map((item) => String(item).trim())
    .filter(Boolean);
  const interesses = normalizarInteresses(await ensureCategorias(), valores);

  await prisma.user.update({ where: { id: userId }, data: { interesses } });
  revalidatePath("/conta");
  revalidatePath("/eventos");
  return { ok: true };
}

export async function comentarEvento(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUser();
  if (!userId) return { error: "Entre na conta para comentar." };

  const eventId = String(formData.get("eventId") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  const nota = Number(formData.get("nota") ?? 0);

  if (!eventId || texto.length < 3) return { error: "Escreva um comentário com pelo menos 3 caracteres." };
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return { error: "A nota vai de 1 a 5." };

  const event = await prisma.event.findFirst({ where: { id: eventId, ...EVENTO_PUBLICO }, select: { id: true } });
  if (!event) return { error: "Evento não encontrado." };

  await prisma.comment.create({ data: { userId, eventId, texto: texto.slice(0, 500), nota } });
  revalidatePath(`/eventos/${eventId}`);
  return { ok: true };
}

export async function denunciarComentario(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUser();
  if (!userId) return { error: "Entre na conta para denunciar." };

  const commentId = String(formData.get("commentId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!commentId || motivo.length < 3) return { error: "Diga o motivo da denúncia." };

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, eventId: true, userId: true } });
  if (!comment) return { error: "Comentário não encontrado." };
  if (comment.userId === userId) return { error: "Você não denuncia o próprio comentário." };

  await prisma.commentReport.upsert({
    where: { commentId_userId: { commentId, userId } },
    create: { commentId, userId, motivo: motivo.slice(0, 280) },
    update: { motivo: motivo.slice(0, 280) },
  });

  revalidatePath(`/eventos/${comment.eventId}`);
  revalidatePath("/admin/comentarios");
  return { ok: true };
}

export async function ocultarComentario(commentId: string): Promise<FormState> {
  const autor = await getUsuarioPainel(["admin", "moderador"]);
  if (!autor) return { error: "Só a equipe de moderação remove comentário." };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Comentário não encontrado." };

  await prisma.comment.update({ where: { id: commentId }, data: { oculto: true } });
  await registrarLog(autor, "comentario.ocultar", "comentario", commentId, {
    eventoId: comment.eventId,
    texto: comment.texto.slice(0, 140),
  });
  revalidatePath(`/eventos/${comment.eventId}`);
  revalidatePath("/admin/comentarios");
  revalidatePath("/admin/historico");
  return { ok: true };
}
