import { readFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsuarioPainel } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { documentoVencido, RETENCAO_DOCUMENTO_DIAS } from "@/lib/retencao-documento";
import { PREFIXO_PRIVADO, removerArquivo } from "@/lib/storage";

/**
 * Apaga o arquivo de CPF/CNPJ dos pedidos decididos há mais de RETENCAO_DOCUMENTO_DIAS. Roda no cron diário.
 * Só limpa a referência no banco quando o arquivo saiu de fato; se o Storage falhar, tenta de novo amanhã.
 */
export async function apagarDocumentosVencidos(agora = new Date()): Promise<{ apagados: number; falhas: number }> {
  const corte = new Date(agora.getTime() - RETENCAO_DOCUMENTO_DIAS * 24 * 60 * 60 * 1000);
  const candidatos = await prisma.organizer.findMany({
    where: { documentoUrl: { not: "" }, statusVerificacao: { not: "pendente" }, dataVerificacao: { lt: corte } },
    select: { id: true, statusVerificacao: true, dataVerificacao: true, documentoUrl: true },
    take: 200,
  });
  let apagados = 0;
  let falhas = 0;
  for (const organizer of candidatos.filter((o) => documentoVencido(o, agora))) {
    const url = organizer.documentoUrl;
    let saiu = true;
    if (url.startsWith(PREFIXO_PRIVADO)) {
      saiu = await removerArquivo("documentos", url.slice(PREFIXO_PRIVADO.length));
    } else if (url.startsWith("/api/uploads/")) {
      const nome = url.slice("/api/uploads/".length);
      if (!nome.includes("/") && !nome.includes("\\") && !nome.includes("..")) {
        saiu = await unlink(path.join(process.cwd(), "uploads", nome)).then(
          () => true,
          (erro: NodeJS.ErrnoException) => erro.code === "ENOENT",
        );
      }
    }
    // Outros valores (modo de teste guarda só o nome do arquivo) não têm arquivo para apagar.
    if (!saiu) {
      falhas++;
      continue;
    }
    await prisma.organizer.update({ where: { id: organizer.id }, data: { documentoUrl: "" } });
    apagados++;
  }
  return { apagados, falhas };
}

const TIPOS: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Documento de organizador só abre para admin ou para o próprio dono. */
export async function podeVerDocumento(organizer: { userId: string }): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.id === organizer.userId) return true;
  return Boolean(await getUsuarioPainel(["admin"]));
}

export async function organizerDoArquivoLocal(filename: string) {
  return prisma.organizer.findFirst({
    where: { documentoUrl: `/api/uploads/${filename}` },
    select: { userId: true },
  });
}

export async function responderArquivoLocal(filename: string, privado: boolean) {
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Arquivo inválido", { status: 400 });
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  try {
    const data = await readFile(path.join(process.cwd(), "uploads", filename));
    return new NextResponse(data, {
      headers: {
        "Content-Type": TIPOS[ext] ?? "application/octet-stream",
        "Cache-Control": privado ? "private, no-store" : "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Não encontrado", { status: 404 });
  }
}
