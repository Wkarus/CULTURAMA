import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmpresaForm } from "@/components/empresa-form";
import { AuthShell, AuthTroca } from "@/components/auth-shell";
import { capasDecorativas } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cadastro de empresa" };

export default async function CadastroEmpresaPage() {
  const session = await auth();
  let reenvio = false;
  if (session?.user?.id && session.user.tipo === "empresa") {
    const empresa = await prisma.empresa.findUnique({ where: { userId: session.user.id }, select: { status: true } });
    if (empresa?.status === "aprovado") redirect("/insights");
    if (empresa?.status === "pendente") redirect("/cadastro/empresa/aguardando");
    reenvio = empresa?.status === "rejeitado" || empresa?.status === "recusado_automaticamente";
  }
  const capas = await capasDecorativas();
  return (
    <AuthShell
      capas={capas}
      titulo={
        <>
          Culturama <span className="text-accent-gradient">Insights</span>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Conta de empresa, com CNPJ. O acesso ao painel começa depois da aprovação da equipe.
      </p>
      <EmpresaForm reenvio={reenvio} />
      <AuthTroca pergunta="Já tem conta?" href="/login?callbackUrl=/insights" acao="Entrar" />
    </AuthShell>
  );
}
