"use server";

import type { AdSlotTipo, EventStatus, StatusVerificacao } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/actions/auth";
import { requireAdmin, requireRole } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import { linkSeguro } from "@/lib/anuncios";
import { prisma } from "@/lib/prisma";
import { syncTicketmaster } from "@/lib/ticketmaster";
import { salvarImagem } from "@/lib/upload";

const EVENT_STATUS = new Set<EventStatus>(["rascunho", "publicado", "cancelado", "adiado", "em_revisao"]);
const AD_TIPOS = new Set<AdSlotTipo>(["banner_home", "banner_categoria", "destaque_evento"]);

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/eventos");
  revalidatePath("/admin/organizadores");
  revalidatePath("/admin/anuncios");
  revalidatePath("/admin/historico");
  revalidatePath("/eventos");
  revalidatePath("/mapa");
}

export async function moderarEvento(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireRole(["admin", "moderador"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as EventStatus;
  const notaAdmin = String(formData.get("notaAdmin") ?? "").trim() || null;

  if (!id || !EVENT_STATUS.has(status)) {
    return { error: "Evento ou status inválido." };
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return { error: "Evento não encontrado." };

  await prisma.event.update({
    where: { id },
    data: { status, notaAdmin },
  });
  await registrarLog(autor, "evento.moderar", "evento", id, {
    titulo: existing.titulo,
    statusAntes: existing.status,
    status,
    notaAlterada: (existing.notaAdmin ?? null) !== notaAdmin,
  });

  revalidatePath(`/eventos/${id}`);
  refreshAdmin();
  return { ok: true };
}

export async function decidirOrganizador(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decisao = String(formData.get("decisao") ?? "") as StatusVerificacao;

  if (!id || (decisao !== "aprovado" && decisao !== "rejeitado")) {
    return { error: "Decisão inválida." };
  }

  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) return { error: "Organizador não encontrado." };

  await prisma.organizer.update({
    where: { id },
    data: { statusVerificacao: decisao, dataVerificacao: new Date() },
  });
  await registrarLog(autor, "organizador.decidir", "organizador", id, {
    nomeEmpresa: organizer.nomeEmpresa,
    statusAntes: organizer.statusVerificacao,
    status: decisao,
  });

  refreshAdmin();
  return { ok: true };
}

export async function salvarAnuncio(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tipo = String(formData.get("tipo") ?? "") as AdSlotTipo;
  const patrocinador = String(formData.get("patrocinador") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const inicioRaw = String(formData.get("dataInicio") ?? "");
  const fimRaw = String(formData.get("dataFim") ?? "");
  const ativo = formData.get("ativo") === "true";
  const arquivo = formData.get("imagem");

  if (!AD_TIPOS.has(tipo) || !patrocinador || !link || !inicioRaw || !fimRaw) {
    return { error: "Preencha tipo, patrocinador, link e o período." };
  }
  if (!linkSeguro(link)) {
    return { error: "O link precisa começar com https:// ou http://." };
  }

  const dataInicio = new Date(inicioRaw);
  const dataFim = new Date(fimRaw);
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime()) || dataFim <= dataInicio) {
    return { error: "Período inválido. A data final precisa ser depois da inicial." };
  }

  let imagem: string | undefined;
  if (arquivo instanceof File && arquivo.size > 0) {
    const saved = await salvarImagem(arquivo);
    if (!saved.ok) return { error: saved.message };
    imagem = saved.url;
  }

  if (id) {
    const existing = await prisma.adSlot.findUnique({ where: { id } });
    if (!existing) return { error: "Anúncio não encontrado." };
    await prisma.adSlot.update({
      where: { id },
      data: {
        tipo,
        patrocinador,
        link,
        dataInicio,
        dataFim,
        ativo,
        ...(imagem ? { imagem } : {}),
      },
    });
    await registrarLog(autor, "anuncio.editar", "anuncio", id, {
      patrocinador,
      tipo,
      ativo,
      imagemTrocada: Boolean(imagem),
    });
  } else {
    if (!imagem) return { error: "Envie a imagem do banner." };
    const criado = await prisma.adSlot.create({
      data: { tipo, patrocinador, imagem, link, dataInicio, dataFim, ativo },
    });
    await registrarLog(autor, "anuncio.criar", "anuncio", criado.id, { patrocinador, tipo, ativo });
  }

  refreshAdmin();
  return { ok: true };
}

export type SyncState = FormState & { importados?: number };

export async function sincronizarTicketmasterAgora(): Promise<SyncState> {
  const autor = await requireAdmin();
  const result = await syncTicketmaster();
  await registrarLog(
    autor,
    "ticketmaster.sincronizar",
    "sistema",
    null,
    result.ok ? { ok: true, importados: result.upserted } : { ok: false, erro: result.message },
  );
  refreshAdmin();
  revalidatePath("/");
  return result.ok ? { ok: true, importados: result.upserted } : { error: result.message };
}

export async function alternarAnuncio(id: string): Promise<FormState> {
  const autor = await requireAdmin();
  const existing = await prisma.adSlot.findUnique({ where: { id } });
  if (!existing) return { error: "Anúncio não encontrado." };
  await prisma.adSlot.update({ where: { id }, data: { ativo: !existing.ativo } });
  await registrarLog(autor, "anuncio.alternar", "anuncio", id, {
    patrocinador: existing.patrocinador,
    ativo: !existing.ativo,
  });
  refreshAdmin();
  return { ok: true };
}
