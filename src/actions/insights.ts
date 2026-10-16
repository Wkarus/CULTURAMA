"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/actions/auth";
import { exigirEmpresa } from "@/lib/insights-acesso";
import { modoDemo, registrarInteracao } from "@/lib/insights-coleta";
import { prisma } from "@/lib/prisma";

export async function registrarClique(eventoId: string, tipo: "visualizacao" | "como_chegar" | "ingresso") {
  if (tipo !== "visualizacao" && tipo !== "como_chegar" && tipo !== "ingresso") return;
  await registrarInteracao(eventoId, tipo);
}

export async function contatarOrganizador(_prev: FormState, formData: FormData): Promise<FormState> {
  const acesso = await exigirEmpresa();
  const eventoId = String(formData.get("eventoId") ?? "");
  if (!eventoId) return { error: "Evento inválido." };
  if (modoDemo() || !acesso.empresaId) return { ok: true };

  const evento = await prisma.event.findUnique({
    where: { id: eventoId },
    select: { id: true, organizerId: true },
  });
  if (!evento?.organizerId) return { error: "Este evento não tem organizador na plataforma." };

  await prisma.pedidoContato.create({ data: { empresaId: acesso.empresaId, eventoId: evento.id } });
  revalidatePath("/insights");
  return { ok: true };
}
