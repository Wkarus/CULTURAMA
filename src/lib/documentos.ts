import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsuarioPainel } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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
