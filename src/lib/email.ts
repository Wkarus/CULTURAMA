import { Resend } from "resend";
import { adminEmail } from "@/lib/admin-email";

export type MensagemEmail = { para: string; assunto: string; html: string; texto: string };

export function urlDoSite(caminho: string) {
  const explicita = process.env.AUTH_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();
  const base = (explicita || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
  return `${base}${caminho}`;
}

export function prepararEnvio(mensagem: MensagemEmail, ambiente: { modoTeste: boolean; admin: string | null }) {
  if (!ambiente.modoTeste) return { para: mensagem.para, assunto: mensagem.assunto };
  if (!ambiente.admin) return null;
  return { para: ambiente.admin, assunto: `[TESTE → ${mensagem.para}] ${mensagem.assunto}` };
}

/** Sem chave, só registra no console. Nunca lança erro para o cadastro. */
export async function enviarEmail(mensagem: MensagemEmail) {
  try {
    const preparado = prepararEnvio(mensagem, {
      modoTeste: process.env.EMAIL_MODO_TESTE === "true",
      admin: adminEmail(),
    });
    if (!preparado) {
      console.warn("E-mail de teste não enviado: defina ADMIN_EMAIL.");
      return;
    }
    const chave = process.env.RESEND_API_KEY?.trim();
    if (!chave) {
      console.info("E-mail não enviado (sem RESEND_API_KEY).", { para: preparado.para, assunto: preparado.assunto });
      return;
    }
    const remetente = process.env.EMAIL_REMETENTE?.trim();
    if (!remetente) {
      console.warn("E-mail não enviado: defina EMAIL_REMETENTE.");
      return;
    }
    const resend = new Resend(chave);
    const { error } = await resend.emails.send({
      from: remetente,
      to: preparado.para,
      subject: preparado.assunto,
      html: mensagem.html,
      text: mensagem.texto,
    });
    if (error) console.error("Falha ao enviar e-mail.", error.message);
  } catch (erro) {
    console.error("Falha ao enviar e-mail.", erro instanceof Error ? erro.message : erro);
  }
}
