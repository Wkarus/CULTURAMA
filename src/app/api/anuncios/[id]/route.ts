import { NextResponse } from "next/server";
import { anuncioNoAr, contaComoExibicao, linkSeguro } from "@/lib/anuncios";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Clique rastreado: conta só anúncio no ar e visitante humano; sempre leva ao link do patrocinador se ele for http(s). */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const slot = await prisma.adSlot.findUnique({ where: { id: params.id }, select: { id: true, link: true } });
  const destino = slot ? linkSeguro(slot.link) : null;
  if (!slot || !destino) return NextResponse.redirect(new URL("/", request.url));

  if (contaComoExibicao(request.headers)) {
    await prisma.adSlot.updateMany({
      where: { id: slot.id, ...anuncioNoAr(new Date()) },
      data: { cliques: { increment: 1 } },
    });
  }
  return NextResponse.redirect(destino, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
