import { NextResponse, type NextRequest } from "next/server";
import { dominiosDasInstancias } from "@/lib/mapas-culturais-config";

const DOMINIOS_FIXOS = ["ticketm.net", "ticketmaster.com", "ticketmaster.com.br"];
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function dominiosPermitidos(): string[] {
  const extras = (process.env.IMAGEM_DOMINIOS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabase) {
    try {
      extras.push(new URL(supabase).hostname);
    } catch {}
  }
  return [...DOMINIOS_FIXOS, ...extras, ...dominiosDasInstancias()];
}

function permitido(url: URL): boolean {
  if (url.protocol !== "https:" || url.port || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return dominiosPermitidos().some((dominio) => host === dominio || host.endsWith(`.${dominio}`));
}

function erro(status: number, mensagem: string) {
  return new NextResponse(mensagem, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return erro(400, "Parâmetro url ausente");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return erro(400, "URL inválida");
  }
  if (!permitido(url)) return erro(403, "Domínio não permitido");

  let resposta: Response | null = null;
  try {
    for (let salto = 0; salto <= MAX_REDIRECTS; salto++) {
      resposta = await fetch(url, {
        redirect: "manual",
        cache: "no-store",
        headers: { Accept: "image/avif,image/webp,image/*" },
        signal: AbortSignal.timeout(8000),
      });
      const destino = resposta.headers.get("location");
      if (resposta.status < 300 || resposta.status >= 400 || !destino) break;
      url = new URL(destino, url);
      if (!permitido(url)) return erro(403, "Redirecionamento para domínio não permitido");
      resposta = null;
    }
  } catch {
    return erro(502, "Falha ao buscar a imagem");
  }

  if (!resposta || !resposta.ok) return erro(502, "Imagem indisponível");

  const tipo = (resposta.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!TIPOS.has(tipo)) return erro(415, "Tipo de arquivo não suportado");

  const tamanho = Number(resposta.headers.get("content-length") ?? 0);
  if (tamanho > MAX_BYTES) return erro(413, "Imagem grande demais");

  const corpo = await resposta.arrayBuffer();
  if (corpo.byteLength > MAX_BYTES) return erro(413, "Imagem grande demais");

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(corpo.byteLength),
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
