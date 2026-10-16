import { visual } from "@/lib/visual-tokens";

const RODAPE = "Você recebeu este e-mail porque se cadastrou no Culturama";

export function escaparEmail(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailCulturama(entrada: { paragrafos: string[]; botao?: { rotulo: string; href: string } }) {
  const blocos = entrada.paragrafos
    .map(
      (paragrafo) =>
        `<p style="margin:0 0 16px;font-family:'IBM Plex Sans',sans-serif;font-size:16px;line-height:1.5;color:${visual.onLight};">${escaparEmail(paragrafo)}</p>`,
    )
    .join("");
  const botao = entrada.botao
    ? `<p style="margin:24px 0;"><a href="${escaparEmail(entrada.botao.href)}" style="display:inline-block;padding:12px 20px;border-radius:16px;background:${visual.accentSolid};color:${visual.onDark};font-family:'IBM Plex Sans',sans-serif;font-size:16px;font-weight:600;text-decoration:none;">${escaparEmail(entrada.botao.rotulo)}</a></p>`
    : "";
  const html = `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:24px;background:${visual.surfaceLight};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:${visual.onDark};border-radius:20px;padding:32px;"><tr><td><p style="margin:0 0 24px;font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:${visual.surfaceDark};">Culturama</p>${blocos}${botao}<p style="margin:24px 0 0;font-family:'IBM Plex Sans',sans-serif;font-size:12px;line-height:1.4;color:${visual.mutedOnLight};">${RODAPE}</p></td></tr></table></td></tr></table></body></html>`;
  const texto = [
    "Culturama",
    ...entrada.paragrafos,
    entrada.botao ? `${entrada.botao.rotulo}: ${entrada.botao.href}` : "",
    RODAPE,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { html, texto };
}
