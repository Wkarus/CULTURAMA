import { auth } from "@/auth";
import { SiteHeaderClient } from "@/components/site-header-client";
import { prisma } from "@/lib/prisma";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  let tipo = user?.tipo;
  if (user?.id) {
    try {
      const conta = await prisma.user.findUnique({ where: { id: user.id }, select: { tipo: true } });
      if (conta?.tipo) tipo = conta.tipo;
    } catch {
      tipo = user.tipo;
    }
  }

  return (
    <SiteHeaderClient
      usuario={
        user
          ? {
              nome: user.name ?? null,
              email: user.email ?? null,
              admin: tipo === "admin",
              moderador: tipo === "moderador",
              empresa: tipo === "empresa",
            }
          : null
      }
    />
  );
}
