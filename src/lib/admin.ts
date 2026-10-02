import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { inicioDoPainel, podeAcessar, type PapelPainel, type SecaoPainel } from "@/lib/admin-permissoes";
import { prisma } from "@/lib/prisma";

export type UsuarioPainel = { id: string; nome: string; email: string; tipo: PapelPainel };

const EQUIPE: PapelPainel[] = ["admin", "moderador"];

function ehPapelPainel(tipo: string): tipo is PapelPainel {
  return tipo === "admin" || tipo === "moderador";
}

/** Lê o papel no banco: o JWT pode estar desatualizado após promoção ou rebaixamento. */
export async function getUsuarioPainel(papeis: PapelPainel[] = EQUIPE): Promise<UsuarioPainel | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, nome: true, email: true, tipo: true, suspensoEm: true },
  });
  if (!user || user.suspensoEm) return null;
  const { tipo } = user;
  if (!ehPapelPainel(tipo) || !papeis.includes(tipo)) return null;

  return { id: user.id, nome: user.nome, email: user.email, tipo };
}

export async function requireRole(papeis: PapelPainel[], callbackUrl = "/admin"): Promise<UsuarioPainel> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await getUsuarioPainel(papeis);
  if (user) return user;

  const equipe = await getUsuarioPainel(EQUIPE);
  redirect(equipe ? inicioDoPainel(equipe.tipo) : "/conta");
}

export async function requireAdmin(): Promise<UsuarioPainel> {
  return requireRole(["admin"]);
}

/** Para páginas: exige papel com acesso à seção do painel. */
export async function requireSecao(secao: SecaoPainel): Promise<UsuarioPainel> {
  const destino = secao === "visao-geral" ? "/admin" : `/admin/${secao}`;
  const user = await requireRole(EQUIPE, destino);
  if (!podeAcessar(user.tipo, secao)) redirect(inicioDoPainel(user.tipo));
  return user;
}
