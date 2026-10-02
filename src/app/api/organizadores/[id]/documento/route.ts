import { NextResponse } from "next/server";
import { podeVerDocumento, responderArquivoLocal } from "@/lib/documentos";
import { prisma } from "@/lib/prisma";
import { PREFIXO_PRIVADO, urlAssinada } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const organizer = await prisma.organizer.findUnique({
    where: { id: params.id },
    select: { userId: true, documentoUrl: true },
  });
  if (!organizer || !(await podeVerDocumento(organizer))) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const { documentoUrl } = organizer;
  if (documentoUrl.startsWith(PREFIXO_PRIVADO)) {
    const assinada = await urlAssinada("documentos", documentoUrl.slice(PREFIXO_PRIVADO.length), 60);
    if (!assinada) return new NextResponse("Documento indisponível no momento.", { status: 503 });
    return NextResponse.redirect(assinada, { headers: { "Cache-Control": "no-store" } });
  }
  if (documentoUrl.startsWith("/api/uploads/")) {
    return responderArquivoLocal(documentoUrl.slice("/api/uploads/".length), true);
  }
  return new NextResponse("Não encontrado", { status: 404 });
}
