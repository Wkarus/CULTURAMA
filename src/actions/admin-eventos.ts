"use server";

import type { EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/actions/auth";
import { requireAdmin, requireRole } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import { lerDadosEvento } from "@/lib/evento-dados";
import { prisma } from "@/lib/prisma";
import { caminhoDeCapa, removerArquivo } from "@/lib/storage";

const EQUIPE = ["admin", "moderador"] as const;

function atualizarTelas(id?: string) {
  revalidatePath("/");
  revalidatePath("/eventos");
  revalidatePath("/mapa");
  revalidatePath("/conta/eventos");
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/eventos/${id}`);
}

export async function revisarEvento(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireRole([...EQUIPE]);
  const id = String(formData.get("id") ?? "");
  const decisao = String(formData.get("decisao") ?? "");
  const mensagem = String(formData.get("mensagem") ?? "").trim().slice(0, 1000);

  if (decisao !== "aprovar" && decisao !== "recusar" && decisao !== "ajuste") return { error: "Decisão inválida." };
  if (decisao !== "aprovar" && mensagem.length < 5) {
    return { error: decisao === "recusar" ? "Escreva o motivo da recusa." : "Diga o que o organizador precisa ajustar." };
  }

  const evento = await prisma.event.findUnique({ where: { id }, select: { id: true, titulo: true, status: true } });
  if (!evento) return { error: "Evento não encontrado." };
  if (evento.status !== "em_revisao") return { error: "Esse evento já saiu da fila de revisão." };

  const agora = new Date();
  await prisma.event.update({
    where: { id },
    data:
      decisao === "aprovar"
        ? { status: "publicado", revisaoResultado: null, mensagemOrganizador: null, revisadoEm: agora }
        : {
            status: "rascunho",
            revisaoResultado: decisao === "recusar" ? "recusado" : "ajuste",
            mensagemOrganizador: mensagem,
            revisadoEm: agora,
          },
  });
  await registrarLog(
    autor,
    decisao === "aprovar" ? "revisao.aprovar" : decisao === "recusar" ? "revisao.recusar" : "revisao.ajuste",
    "evento",
    id,
    { titulo: evento.titulo, ...(mensagem && decisao !== "aprovar" ? { mensagem } : {}) },
  );

  atualizarTelas(id);
  return { ok: true };
}

/** Admin e moderação criam ou editam eventos internos. Ticketmaster não é editável. */
export async function salvarEventoAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireRole([...EQUIPE]);
  const id = String(formData.get("id") ?? "");
  const publicar = formData.get("intencao") === "publicar";

  const lido = await lerDadosEvento(formData);
  if (!lido.ok) return { error: lido.error };
  const { dados, imagemCapa } = lido;

  if (id) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing || existing.fonte !== "interno") return { error: "Evento não encontrado ou não pode ser editado." };
    const status: EventStatus = publicar ? "publicado" : existing.status === "publicado" ? "rascunho" : existing.status;
    await prisma.event.update({
      where: { id },
      data: {
        ...dados,
        status,
        ...(publicar ? { revisaoResultado: null, mensagemOrganizador: null } : {}),
        ...(imagemCapa ? { imagemCapa } : {}),
      },
    });
    await registrarLog(autor, "evento.editar", "evento", id, {
      titulo: dados.titulo,
      statusAntes: existing.status,
      status,
      capaTrocada: Boolean(imagemCapa),
    });
    atualizarTelas(id);
  } else {
    const criado = await prisma.event.create({
      data: { ...dados, fonte: "interno", imagemCapa, status: publicar ? "publicado" : "rascunho" },
    });
    await registrarLog(autor, "evento.criar", "evento", criado.id, { titulo: dados.titulo, status: criado.status });
    atualizarTelas(criado.id);
  }

  return { ok: true };
}

/** Publicado sai do ar como rascunho; Ticketmaster sai como oculto, que a sincronização respeita. */
export async function alternarPublicacao(id: string): Promise<FormState> {
  const autor = await requireRole([...EQUIPE]);
  const evento = await prisma.event.findUnique({ where: { id }, select: { titulo: true, status: true, fonte: true } });
  if (!evento) return { error: "Evento não encontrado." };

  const publicar = evento.status !== "publicado";
  const status: EventStatus = publicar ? "publicado" : evento.fonte === "ticketmaster" ? "cancelado" : "rascunho";
  await prisma.event.update({
    where: { id },
    data: { status, ...(publicar ? { revisaoResultado: null, mensagemOrganizador: null } : {}) },
  });
  await registrarLog(autor, publicar ? "evento.publicar" : "evento.despublicar", "evento", id, {
    titulo: evento.titulo,
    statusAntes: evento.status,
    status,
  });
  atualizarTelas(id);
  return { ok: true };
}

export async function alternarDestaque(id: string): Promise<FormState> {
  const autor = await requireRole([...EQUIPE]);
  const evento = await prisma.event.findUnique({ where: { id }, select: { titulo: true, destaque: true } });
  if (!evento) return { error: "Evento não encontrado." };

  await prisma.event.update({ where: { id }, data: { destaque: !evento.destaque } });
  await registrarLog(autor, "evento.destacar", "evento", id, { titulo: evento.titulo, destaque: !evento.destaque });
  atualizarTelas(id);
  return { ok: true };
}

export async function excluirEvento(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();

  const evento = await prisma.event.findUnique({
    where: { id },
    select: { titulo: true, fonte: true, imagemCapa: true, _count: { select: { favorites: true, comments: true } } },
  });
  if (!evento) return { error: "Evento não encontrado." };
  if (confirmacao !== "EXCLUIR") return { error: "Digite EXCLUIR para confirmar." };

  await prisma.event.delete({ where: { id } });
  const capa = caminhoDeCapa(evento.imagemCapa);
  if (capa) await removerArquivo("capas", capa);
  await registrarLog(autor, "evento.excluir", "evento", id, {
    titulo: evento.titulo,
    fonte: evento.fonte,
    favoritos: evento._count.favorites,
    comentarios: evento._count.comments,
  });
  atualizarTelas();
  return { ok: true };
}
