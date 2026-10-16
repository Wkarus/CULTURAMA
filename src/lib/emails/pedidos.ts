import { urlDoSite, type MensagemEmail } from "@/lib/email";
import { emailCulturama } from "@/lib/emails/modelo";
import { documentoMascarado, motivoManual, textoRecusa, type CodigoRecusa } from "@/lib/pedido-acesso";

export type PerfilPedido = "organizador" | "empresa";

function objetivo(perfil: PerfilPedido) {
  return perfil === "organizador" ? "publicar eventos no Culturama" : "acessar o plano Empresa do Culturama Insights";
}

function caminhoFormulario(perfil: PerfilPedido) {
  return perfil === "organizador" ? "/cadastro/organizador" : "/cadastro/empresa";
}

function caminhoPainel(perfil: PerfilPedido) {
  return perfil === "organizador" ? "/admin/organizadores" : "/admin/empresas";
}

export function emailNovoPedidoAdmin(entrada: {
  perfil: PerfilPedido;
  nome: string;
  email: string;
  tipoDocumento: string;
  documento: string;
  pedidoEm: Date;
  checagem: string;
}): MensagemEmail {
  const tipo = entrada.perfil === "organizador" ? "organizador" : "plano Empresa";
  const data = entrada.pedidoEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const corpo = emailCulturama({
    paragrafos: [
      `Tipo de pedido: ${tipo}.`,
      `Nome: ${entrada.nome}.`,
      `E-mail: ${entrada.email}.`,
      `Documento: ${documentoMascarado(entrada.tipoDocumento, entrada.documento)}.`,
      `Data do pedido: ${data}.`,
      `Checagem automática: ${entrada.checagem}.`,
    ],
    botao: { rotulo: "Revisar pedido", href: urlDoSite(caminhoPainel(entrada.perfil)) },
  });
  return { para: "", assunto: `Novo pedido para aprovar: ${entrada.nome}`, ...corpo };
}

export function emailRecusaAutomatica(entrada: {
  perfil: PerfilPedido;
  nome: string;
  para: string;
  codigo: CodigoRecusa;
}): MensagemEmail {
  const textos = textoRecusa(entrada.codigo);
  const corpo = emailCulturama({
    paragrafos: [
      `Olá, ${entrada.nome}.`,
      `Recebemos seu pedido para ${objetivo(entrada.perfil)}, mas ele não pôde ser aprovado automaticamente.`,
      `Motivo: ${textos.motivo}`,
      `Como resolver: ${textos.como}`,
      "Depois de corrigir, é só enviar um novo pedido.",
    ],
    botao: { rotulo: "Enviar novo pedido", href: urlDoSite(caminhoFormulario(entrada.perfil)) },
  });
  return { para: entrada.para, assunto: "Seu pedido no Culturama não foi aprovado", ...corpo };
}

export function emailRecusaManual(entrada: {
  perfil: PerfilPedido;
  nome: string;
  para: string;
  motivoCodigo: string;
  motivoTexto: string;
}): MensagemEmail {
  const manual = motivoManual(entrada.motivoCodigo);
  const motivo = [manual?.rotulo ?? "Recusado pela equipe", entrada.motivoTexto.trim()].filter(Boolean).join(". ");
  const como = manual?.como ?? "Se tiver dúvidas, responda este e-mail.";
  const corpo = emailCulturama({
    paragrafos: [
      `Olá, ${entrada.nome}.`,
      `Recebemos seu pedido para ${objetivo(entrada.perfil)}, mas ele não foi aprovado.`,
      `Motivo: ${motivo}`,
      `Como resolver: ${como}`,
      "Se tiver dúvidas, responda este e-mail.",
    ],
    botao: { rotulo: "Enviar novo pedido", href: urlDoSite(caminhoFormulario(entrada.perfil)) },
  });
  return { para: entrada.para, assunto: "Seu pedido no Culturama não foi aprovado", ...corpo };
}

export function emailAprovado(entrada: { perfil: PerfilPedido; nome: string; para: string }): MensagemEmail {
  const organizador = entrada.perfil === "organizador";
  const corpo = emailCulturama({
    paragrafos: [
      `Olá, ${entrada.nome}.`,
      "Seu pedido foi aprovado!",
      organizador
        ? "Você já pode publicar eventos no Culturama."
        : "O plano Empresa do Culturama Insights está liberado. Dá para ver o que está em alta e encontrar eventos para patrocinar.",
    ],
    botao: organizador
      ? { rotulo: "Publicar meu primeiro evento", href: urlDoSite("/conta/eventos/novo") }
      : { rotulo: "Abrir o Insights", href: urlDoSite("/insights") },
  });
  return { para: entrada.para, assunto: "Seu pedido foi aprovado!", ...corpo };
}
