import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { modoDemo } from "@/lib/insights-coleta";
import { prisma } from "@/lib/prisma";

export async function exigirEmpresa() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/insights");
  if (session.user.tipo === "admin") {
    return { empresaId: null, razao: session.user.name || "Administração" };
  }

  try {
    const conta = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tipo: true, nome: true, suspensoEm: true },
    });
    if (conta?.tipo === "admin" && !conta.suspensoEm) {
      return { empresaId: null, razao: conta.nome || "Administração" };
    }
  } catch (error) {
    if (!modoDemo()) throw error;
  }

  if (session.user.tipo !== "empresa") redirect("/cadastro/empresa");

  try {
    const empresa = await prisma.empresa.findUnique({ where: { userId: session.user.id } });
    if (!empresa) redirect("/cadastro/empresa");
    if (empresa.status !== "aprovado") redirect("/cadastro/empresa/aguardando");
    return { empresaId: empresa.id, razao: empresa.razaoSocial };
  } catch (error) {
    if (modoDemo()) return { empresaId: null, razao: session.user.name ?? "Empresa" };
    throw error;
  }
}
