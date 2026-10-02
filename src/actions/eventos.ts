"use server";

import type { EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { FormState } from "@/actions/auth";
import { lerDadosEvento } from "@/lib/evento-dados";
import { getOrganizerForUser, podeEnviarParaRevisao, podePublicar } from "@/lib/eventos";
import { geocodeEndereco } from "@/lib/geocode";
import { prisma } from "@/lib/prisma";

async function requireOrganizer() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Entre na sua conta." as const };
  const organizer = await getOrganizerForUser(session.user.id);
  if (!organizer) return { error: "Cadastre-se como organizador primeiro." as const };
  return { organizer };
}

type Intencao = "rascunho" | "publicar" | "revisao";

export async function salvarEvento(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireOrganizer();
  if ("error" in ctx && !("organizer" in ctx)) return { error: ctx.error };
  const { organizer } = ctx as { organizer: NonNullable<Awaited<ReturnType<typeof getOrganizerForUser>>> };

  const id = String(formData.get("id") ?? "");
  const bruta = String(formData.get("intencao") ?? "rascunho");
  const intencao: Intencao = bruta === "publicar" || bruta === "revisao" ? bruta : "rascunho";

  const lido = await lerDadosEvento(formData);
  if (!lido.ok) return { error: lido.error };
  const { dados, imagemCapa } = lido;

  if (intencao === "publicar" && !podePublicar(organizer.statusVerificacao)) {
    return { error: "Sua verificação ainda está pendente. Envie para revisão ou salve como rascunho." };
  }
  if (intencao === "revisao" && !podeEnviarParaRevisao(organizer.statusVerificacao)) {
    return { error: "Envio para revisão é só para organizadores em análise." };
  }

  const status: EventStatus = intencao === "publicar" ? "publicado" : intencao === "revisao" ? "em_revisao" : "rascunho";
  const limparRevisao = intencao !== "rascunho" ? { revisaoResultado: null, mensagemOrganizador: null } : {};

  if (id) {
    const existing = await prisma.event.findFirst({ where: { id, organizerId: organizer.id } });
    if (!existing || existing.fonte !== "interno") {
      return { error: "Evento não encontrado ou não pode ser editado." };
    }
    await prisma.event.update({
      where: { id },
      data: {
        ...dados,
        status: existing.status === "cancelado" ? existing.status : status,
        ...(existing.status === "cancelado" ? {} : limparRevisao),
        ...(imagemCapa ? { imagemCapa } : {}),
      },
    });
  } else {
    await prisma.event.create({
      data: { ...dados, organizerId: organizer.id, fonte: "interno", imagemCapa, status },
    });
  }

  revalidatePath("/eventos");
  revalidatePath("/mapa");
  revalidatePath("/conta/eventos");
  revalidatePath("/admin/revisao");
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

export type LocalizarState = { lat?: number; lng?: number; error?: string };

/** Posiciona o pino do formulário a partir do endereço digitado. */
export async function localizarEndereco(endereco: string): Promise<LocalizarState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Entre na sua conta." };
  const texto = endereco.trim();
  if (texto.length < 5) return { error: "Digite rua, número e cidade." };
  const geo = await geocodeEndereco(`${texto}, Brasil`);
  return geo ? { lat: geo.lat, lng: geo.lng } : { error: "Não achei esse endereço. Arraste o pino até o local." };
}
