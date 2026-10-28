import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Limites por janela. Contados no banco (tabela `rate_limits`) porque na Vercel cada pedido pode cair num servidor
 * diferente: contador em memória não segura quem insiste.
 */
export const LIMITES = {
  /** Por IP: segura quem testa senhas em muitas contas. */
  login: { max: 20, janelaSeg: 15 * 60 },
  /** Por e-mail: segura quem testa muitas senhas numa conta só. */
  loginConta: { max: 8, janelaSeg: 15 * 60 },
  cadastro: { max: 5, janelaSeg: 60 * 60 },
  comentario: { max: 10, janelaSeg: 10 * 60 },
  denuncia: { max: 10, janelaSeg: 60 * 60 },
  /** Cada pedido de rota faz 3 chamadas pagas à Directions API do Google. */
  rota: { max: 20, janelaSeg: 60 * 60 },
} as const;

export type TipoLimite = keyof typeof LIMITES;

export const AVISO_LIMITE_CADASTRO = "Muitos cadastros a partir desta conexão. Tente de novo em uma hora.";

/** Primeiro IP do X-Forwarded-For (a Vercel põe o do visitante na frente). */
export function ipDe(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || cabecalhos.get("x-real-ip")?.trim() || "sem-ip";
}

/** LGPD: o banco guarda só um hash com segredo do servidor, nunca o IP ou o e-mail. */
export function chaveDoLimite(tipo: TipoLimite, valor: string): string {
  const segredo = process.env.AUTH_SECRET ?? "culturama";
  const hash = createHash("sha256").update(`${segredo}:${tipo}:${valor.trim().toLowerCase()}`).digest("hex").slice(0, 40);
  return `${tipo}:${hash}`;
}

/**
 * Conta mais uma tentativa e diz se ainda cabe na janela. Em erro do banco (inclusive tabela ainda não criada),
 * deixa passar: limite fora do ar não pode derrubar login nem cadastro.
 */
export async function registrarTentativa(tipo: TipoLimite, valor: string): Promise<boolean> {
  const { max, janelaSeg } = LIMITES[tipo];
  const chave = chaveDoLimite(tipo, valor);
  try {
    const [linha] = await prisma.$queryRaw<{ contagem: number }[]>`
      INSERT INTO rate_limits (chave, contagem, expira_em)
      VALUES (${chave}, 1, now() + ${janelaSeg}::int * interval '1 second')
      ON CONFLICT (chave) DO UPDATE SET
        contagem = CASE WHEN rate_limits.expira_em <= now() THEN 1 ELSE rate_limits.contagem + 1 END,
        expira_em = CASE WHEN rate_limits.expira_em <= now() THEN now() + ${janelaSeg}::int * interval '1 second' ELSE rate_limits.expira_em END
      RETURNING contagem`;
    return (linha?.contagem ?? 0) <= max;
  } catch (erro) {
    console.warn("[limite] contador indisponível, deixando passar", tipo, erro instanceof Error ? erro.message : erro);
    return true;
  }
}

/** Só consulta, sem contar: usado para explicar ao usuário por que o login parou. */
export async function estourouLimite(tipo: TipoLimite, valor: string): Promise<boolean> {
  try {
    const linha = await prisma.rateLimit.findUnique({ where: { chave: chaveDoLimite(tipo, valor) } });
    return Boolean(linha && linha.expiraEm > new Date() && linha.contagem > LIMITES[tipo].max);
  } catch {
    return false;
  }
}

/** Faxina do cron diário: janelas vencidas não servem para nada. */
export async function apagarLimitesVencidos(): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({ where: { expiraEm: { lt: new Date() } } }).catch(() => ({ count: 0 }));
  return count;
}
