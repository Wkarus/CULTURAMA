import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, { params }: { params: { filename: string } }) {
  const filename = params.filename;
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Arquivo inválido", { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const filePath = path.join(process.cwd(), "uploads", filename);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Não encontrado", { status: 404 });
  }
}
