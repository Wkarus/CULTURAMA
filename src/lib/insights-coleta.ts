import { createHash } from "crypto";
import type { FaixaEtaria } from "@prisma/client";
import { auth } from "@/auth";
import { idadeEmAnos } from "@/lib/idade";
import type { FaixaInsight, TipoInsight } from "@/lib/insights-agregar";
import { cidadeDeEndereco, localDoEvento } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";

export function modoDemo() {
  return process.env.INSIGHTS_MODO_DEMO === "true";
}

export function faixaDeNascimento(dataNascimento: Date, hoje = new Date()): FaixaInsight {
  const idade = idadeEmAnos(dataNascimento, hoje);
  if (idade < 18) return "ate_17";
  if (idade <= 24) return "de_18_a_24";
  if (idade <= 34) return "de_25_a_34";
  if (idade <= 44) return "de_35_a_44";
  if (idade <= 54) return "de_45_a_54";
  return "de_55_ou_mais";
}

function coorteDe(userId: string) {
  const sal = process.env.AUTH_SECRET || "culturama-insights";
  return createHash("sha256").update(`${sal}:${userId}`).digest("hex").slice(0, 24);
}

export async function registrarInteracao(eventoId: string, tipo: TipoInsight) {
  if (modoDemo() || !eventoId) return;
  try {
    const evento = await prisma.event.findUnique({
      where: { id: eventoId },
      select: {
        id: true,
        endereco: true,
        fonte: true,
        category: { select: { nome: true, parent: { select: { nome: true } } } },
      },
    });
    if (!evento) return;

    const session = await auth();
    let faixaEtaria: FaixaEtaria | null = null;
    let coorte: string | null = null;
    if (session?.user?.id) {
      const pessoa = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { dataNascimento: true },
      });
      coorte = coorteDe(session.user.id);
      if (pessoa?.dataNascimento) faixaEtaria = faixaDeNascimento(pessoa.dataNascimento);
    }

    const bairro = (localDoEvento(evento) ?? "").slice(0, 80);
    const cidade = cidadeDeEndereco(evento.endereco).slice(0, 80);
    await prisma.interacaoEvento.create({
      data: {
        eventoId: evento.id,
        tipo,
        categoria: (evento.category?.parent?.nome ?? evento.category?.nome ?? "Outros").slice(0, 80),
        bairro,
        cidade,
        faixaEtaria,
        coorte,
      },
    });
  } catch {
    // A coleta não pode derrubar a página do evento.
  }
}
