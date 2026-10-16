import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { modoDemo } from "@/lib/insights-coleta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AguardandoEmpresaPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.tipo !== "empresa") redirect("/cadastro/empresa");
  const empresa = await prisma.empresa.findUnique({ where: { userId: session.user.id } });
  if (!empresa) redirect("/cadastro/empresa");
  if (empresa.status === "aprovado") redirect("/insights");

  const rejeitada = empresa.status === "rejeitado";
  return (
    <main className="mx-auto grid max-w-lg gap-4 px-4 py-16">
      {modoDemo() ? <p className="rounded-full bg-warning-bg px-3 py-1 text-center text-sm font-medium text-warning">Dados de demonstração</p> : null}
      <h1 className="font-display text-3xl font-semibold tracking-display">{rejeitada ? "Cadastro não aprovado" : "Cadastro em análise"}</h1>
      <p className="text-sm text-muted-foreground">
        {rejeitada
          ? `${empresa.razaoSocial} não foi aprovada para o Culturama Insights.`
          : `${empresa.razaoSocial} está na fila. O painel abre quando a equipe aprovar o CNPJ.`}
      </p>
      <Link href="/" className="text-sm font-medium text-accent-solid">
        Voltar ao início
      </Link>
    </main>
  );
}
