import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveImagemLocal(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (file.type === "application/pdf") {
    return { ok: false, message: "A capa precisa ser uma imagem (JPG, PNG ou WebP)." };
  }
  return saveDocumentoLocal(file);
}

export async function saveDocumentoLocal(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!file || file.size === 0) {
    return { ok: false, message: "Envie um arquivo do documento (PDF ou imagem)." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Arquivo maior que 5 MB." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, message: "Formato inválido. Use PDF, JPG, PNG ou WebP." };
  }

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { ok: true, url: `/api/uploads/${filename}` };
}
