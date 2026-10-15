"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/actions/auth";
import { requireRole } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import type { ResolucaoDenuncia } from "@/lib/denuncias";
import { estaNoAr, statusFora } from "@/lib/event-filters";
import { prisma } from "@/lib/prisma";

const RESOLUCOES = new Set<ResolucaoDenuncia>(["descartar", "despublicar", "remover_comentario"]);

/** Despublicar e remover fecham todas as denúncias abertas do mesmo alvo; descartar fecha só esta. */
export async function resolverDenuncia(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireRole(["admin", "moderador"]);
  const id = String(formData.get("id") ?? "");
  const resolucao = String(formData.get("resolucao") ?? "") as ResolucaoDenuncia;
  if (!id || !RESOLUCOES.has(resolucao)) return { error: "Ação inválida." };

  const denuncia = await prisma.denuncia.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, titulo: true, fonte: true, status: true } },
      comment: { select: { id: true, eventId: true, texto: true } },
    },
  });
  if (!denuncia) return { error: "Denúncia não encontrada." };
  if (denuncia.status !== "aberta") return { error: "Essa denúncia já foi tratada." };

  const fechamento = { resolvidoEm: new Date(), resolvidoPorId: autor.id, resolucao };
  const detalhes = { motivo: denuncia.motivo, eventoId: denuncia.event?.id ?? denuncia.comment?.eventId ?? null };

  if (resolucao === "descartar") {
    await prisma.denuncia.update({ where: { id }, data: { status: "descartada", ...fechamento } });
    await registrarLog(autor, "denuncia.descartar", "denuncia", id, detalhes);
  } else if (resolucao === "despublicar") {
    const { event } = denuncia;
    if (!event) return { error: "Essa denúncia é de comentário." };
    await prisma.$transaction([
      prisma.event.update({
        where: { id: event.id },
        data: { status: estaNoAr(event.status) ? statusFora(event.fonte) : event.status },
      }),
      prisma.denuncia.updateMany({ where: { eventId: event.id, status: "aberta" }, data: { status: "resolvida", ...fechamento } }),
    ]);
    await registrarLog(autor, "denuncia.despublicar", "evento", event.id, { ...detalhes, titulo: event.titulo, statusAntes: event.status });
    revalidatePath(`/eventos/${event.id}`);
    revalidatePath("/eventos");
    revalidatePath("/mapa");
    revalidatePath("/");
  } else {
    const { comment } = denuncia;
    if (!comment) return { error: "Essa denúncia é de evento." };
    await prisma.$transaction([
      prisma.comment.update({ where: { id: comment.id }, data: { oculto: true } }),
      prisma.denuncia.updateMany({ where: { commentId: comment.id, status: "aberta" }, data: { status: "resolvida", ...fechamento } }),
    ]);
    await registrarLog(autor, "denuncia.remover_comentario", "comentario", comment.id, {
      ...detalhes,
      texto: comment.texto.slice(0, 140),
    });
    revalidatePath(`/eventos/${comment.eventId}`);
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
