/** Tipos de arquivo aceitos em upload, reconhecidos pelos primeiros bytes. */
export type TipoArquivo = "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

function comeca(bytes: Uint8Array, assinatura: number[], deslocamento = 0): boolean {
  return assinatura.every((byte, i) => bytes[deslocamento + i] === byte);
}

/**
 * Tipo real pelo conteúdo, não pelo que o navegador declarou: um .exe renomeado para .png não passa.
 * Precisa só dos 12 primeiros bytes.
 */
export function tipoPelosBytes(bytes: Uint8Array): TipoArquivo | null {
  if (comeca(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (comeca(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (comeca(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (comeca(bytes, [0x52, 0x49, 0x46, 0x46]) && comeca(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp"; // RIFF....WEBP
  return null;
}
