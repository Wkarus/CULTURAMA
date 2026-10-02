import { NextResponse } from "next/server";
import { organizerDoArquivoLocal, podeVerDocumento, responderArquivoLocal } from "@/lib/documentos";

export async function GET(_request: Request, { params }: { params: { filename: string } }) {
  const dono = await organizerDoArquivoLocal(params.filename);
  if (dono && !(await podeVerDocumento(dono))) {
    return new NextResponse("Não encontrado", { status: 404 });
  }
  return responderArquivoLocal(params.filename, Boolean(dono));
}
