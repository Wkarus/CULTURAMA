import { randomUUID } from "crypto";

export type Bucket = "capas" | "documentos";

/** Prefixo gravado no banco para arquivos do bucket privado; a URL real é assinada na hora de abrir. */
export const PREFIXO_PRIVADO = "storage:documentos/";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && chave ? { url, chave } : null;
}

export function storageConfigurado(): boolean {
  return config() !== null;
}

function cabecalhos(chave: string, extra?: Record<string, string>) {
  return { Authorization: `Bearer ${chave}`, apikey: chave, ...extra };
}

const CONFIG_BUCKET: Record<Bucket, { public: boolean; allowed_mime_types: string[] }> = {
  capas: { public: true, allowed_mime_types: ["image/jpeg", "image/png", "image/webp"] },
  documentos: { public: false, allowed_mime_types: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
};

async function criarBucket(cfg: { url: string; chave: string }, bucket: Bucket) {
  await fetch(`${cfg.url}/storage/v1/bucket`, {
    method: "POST",
    headers: cabecalhos(cfg.chave, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: bucket, name: bucket, file_size_limit: 5 * 1024 * 1024, ...CONFIG_BUCKET[bucket] }),
    cache: "no-store",
  });
}

export async function enviarArquivo(
  bucket: Bucket,
  file: File,
  ext: string,
): Promise<{ ok: true; caminho: string } | { ok: false; message: string }> {
  const cfg = config();
  if (!cfg) return { ok: false, message: "Storage não configurado." };

  const caminho = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const corpo = Buffer.from(await file.arrayBuffer());
  const enviar = () =>
    fetch(`${cfg.url}/storage/v1/object/${bucket}/${caminho}`, {
      method: "POST",
      headers: cabecalhos(cfg.chave, { "Content-Type": file.type, "x-upsert": "false", "Cache-Control": "31536000" }),
      body: corpo,
      cache: "no-store",
    });

  let resposta = await enviar();
  if (!resposta.ok && /bucket not found/i.test(await resposta.clone().text())) {
    await criarBucket(cfg, bucket);
    resposta = await enviar();
  }
  if (!resposta.ok) {
    console.error("[storage] upload falhou", bucket, resposta.status, await resposta.text().catch(() => ""));
    return { ok: false, message: "Não consegui enviar o arquivo agora. Tente de novo." };
  }
  return { ok: true, caminho };
}

export function urlPublica(bucket: Bucket, caminho: string): string {
  const cfg = config();
  if (!cfg) throw new Error("Storage não configurado.");
  return `${cfg.url}/storage/v1/object/public/${bucket}/${caminho}`;
}

export async function urlAssinada(bucket: Bucket, caminho: string, segundos = 300): Promise<string | null> {
  const cfg = config();
  if (!cfg) return null;
  const resposta = await fetch(`${cfg.url}/storage/v1/object/sign/${bucket}/${caminho}`, {
    method: "POST",
    headers: cabecalhos(cfg.chave, { "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn: segundos }),
    cache: "no-store",
  });
  if (!resposta.ok) return null;
  const { signedURL } = (await resposta.json()) as { signedURL?: string };
  return signedURL ? `${cfg.url}/storage/v1${signedURL}` : null;
}

export async function removerArquivo(bucket: Bucket, caminho: string): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  await fetch(`${cfg.url}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: cabecalhos(cfg.chave, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: [caminho] }),
    cache: "no-store",
  }).catch(() => undefined);
}

/** Caminho dentro do bucket `capas` quando a URL pública é nossa; senão null (Ticketmaster, uploads locais). */
export function caminhoDeCapa(url: string | null | undefined): string | null {
  const cfg = config();
  if (!cfg || !url) return null;
  const prefixo = `${cfg.url}/storage/v1/object/public/capas/`;
  return url.startsWith(prefixo) ? url.slice(prefixo.length) : null;
}
