import { prisma } from "@/lib/prisma";

export function adminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export async function promoteIfAdminEmail(userId: string, email: string): Promise<boolean> {
  const expected = adminEmail();
  if (!expected || email.toLowerCase() !== expected) return false;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tipo: true } });
  if (!user) return false;
  if (user.tipo === "admin") return true;

  await prisma.user.update({ where: { id: userId }, data: { tipo: "admin" } });
  return true;
}
