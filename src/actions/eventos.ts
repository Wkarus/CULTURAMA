"use server";

import type { EventStatus, RestricaoIdade } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { FormState } from "@/actions/auth";
import { ensureCategorias } from "@/lib/categorias";
import { getOrganizerForUser, podePublicar } from "@/lib/eventos";
import { geocodeEndereco } from "@/lib/geocode";
import { prisma } from "@/lib/prisma";
import { saveImagemLocal } from "@/lib/upload";

const RESTRICOES = new Set<RestricaoIdade>(["livre", "doze", "quatorze", "dezesseis", "dezoito"]);

async function requireOrganizer() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Entre na sua conta." as const };
  const organizer = await getOrganizerForUser(session.user.id);
  if (!organizer) return { error: "Cadastre-se como organizador primeiro." as const };
  return { organizer };
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function salvarEvento(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrganizer();
  if ("error" in ctx && !("organizer" in ctx)) return { error: ctx.error };
  const { organizer } = ctx as { organizer: NonNullable<Awaited<ReturnType<typeof getOrganizerForUser>>> };

  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoriaId = String(formData.get("categoriaId") ?? "");
  const dataHoraRaw = String(formData.get("dataHora") ?? "");
  const endereco = String(formData.get("endereco") ?? "").trim();
  const linkSaibaMais = String(formData.get("linkSaibaMais") ?? "").trim() || null;
  const linkIngresso = String(formData.get("linkIngresso") ?? "").trim() || null;
  const gratuito = formData.get("gratuito") === "true";
  const restricaoIdade = String(formData.get("restricaoIdade") ?? "livre") as RestricaoIdade;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const publicar = formData.get("intencao") === "publicar";
  const arquivo = formData.get("imagemCapa");

  if (!titulo || !descricao || !endereco || !dataHoraRaw) {
    return { error: "Preencha título, descrição, data e endereço." };
  }
  if (!RESTRICOES.has(restricaoIdade)) {
    return { error: "Restrição de idade inválida." };
  }

  const categorias = await ensureCategorias();
  if (!categorias.some((c) => c.id === categoriaId)) {
    return { error: "Escolha uma categoria." };
  }

  const dataHora = new Date(dataHoraRaw);
  if (Number.isNaN(dataHora.getTime())) {
    return { error: "Data e hora inválidas." };
  }

  const geo = await geocodeEndereco(`${endereco}, Brasil`);
  if (!geo) {
    return { error: "Não achei esse endereço. Inclua rua, número e cidade." };
  }

  let imagemCapa: string | undefined;
  if (arquivo instanceof File && arquivo.size > 0) {
    const saved = await saveImagemLocal(arquivo);
    if (!saved.ok) return { error: saved.message };
    imagemCapa = saved.url;
  }

  if (publicar && !podePublicar(organizer.statusVerificacao)) {
    return { error: "Sua verificação ainda está pendente. Salve como rascunho." };
  }

  const status: EventStatus = publicar ? "publicado" : "rascunho";

  if (id) {
    const existing = await prisma.event.findFirst({ where: { id, organizerId: organizer.id } });
    if (!existing || existing.fonte !== "interno") {
      return { error: "Evento não encontrado ou não pode ser editado." };
    }
    await prisma.event.update({
      where: { id },
      data: {
        titulo,
        descricao,
        categoriaId,
        dataHora,
        endereco,
        latitude: geo.lat,
        longitude: geo.lng,
        linkSaibaMais,
        linkIngresso,
        gratuito,
        restricaoIdade,
        tags,
        status: existing.status === "cancelado" ? existing.status : status,
        ...(imagemCapa ? { imagemCapa } : {}),
      },
    });
  } else {
    await prisma.event.create({
      data: {
        organizerId: organizer.id,
        fonte: "interno",
        titulo,
        descricao,
        categoriaId,
        dataHora,
        endereco,
        latitude: geo.lat,
        longitude: geo.lng,
        imagemCapa,
        linkSaibaMais,
        linkIngresso,
        gratuito,
        restricaoIdade,
        tags,
        status,
      },
    });
  }

  revalidatePath("/eventos");
  revalidatePath("/mapa");
  revalidatePath("/conta/eventos");
  return { ok: true };
}

export async function cancelarEvento(eventId: string): Promise<FormState> {
  const ctx = await requireOrganizer();
  if ("error" in ctx && !("organizer" in ctx)) return { error: ctx.error };
  const { organizer } = ctx as { organizer: NonNullable<Awaited<ReturnType<typeof getOrganizerForUser>>> };

  const existing = await prisma.event.findFirst({ where: { id: eventId, organizerId: organizer.id } });
  if (!existing || existing.fonte !== "interno") {
    return { error: "Evento não encontrado." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { status: "cancelado" },
  });
  revalidatePath("/eventos");
  revalidatePath("/mapa");
  revalidatePath("/conta/eventos");
  return { ok: true };
}
