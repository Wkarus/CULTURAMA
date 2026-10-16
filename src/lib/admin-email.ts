import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Cliente = PrismaClient | Prisma.TransactionClient;

export function adminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

/** Cadastro de organizador do admin. Sem e-mail, senha ou chave. */
export function dadosOrganizadorAdmin(nome: string) {
  return {
    nomeEmpresa: nome.trim() || "Culturama",
    documento: "00000000000000",
    tipoDocumento: "CNPJ" as const,
    statusVerificacao: "aprovado" as const,
    dataVerificacao: new Date(),
    documentoUrl: "",
    suspensoEm: null,
  };
}

export async function garantirOrganizadorAdmin(cliente: Cliente, userId: string, nome: string) {
  const dados = dadosOrganizadorAdmin(nome);
  return cliente.organizer.upsert({
    where: { userId },
    create: { userId, ...dados },
    update: {
      statusVerificacao: "aprovado",
      dataVerificacao: new Date(),
      suspensoEm: null,
    },
    include: { user: { select: { suspensoEm: true } } },
  });
}

export async function promoteIfAdminEmail(userId: string, email: string): Promise<boolean> {
  const expected = adminEmail();
  if (!expected || email.toLowerCase() !== expected) return false;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tipo: true, nome: true } });
  if (!user) return false;
  if (user.tipo !== "admin") {
    await prisma.user.update({ where: { id: userId }, data: { tipo: "admin" } });
  }
  await garantirOrganizadorAdmin(prisma, userId, user.nome);
  return true;
}
