import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { modoDemo } from "@/lib/insights-coleta";
import { textoMotivoVisivel } from "@/lib/pedido-acesso";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AguardandoEmpresaPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.tipo !== "empresa") redirect("/cadastro/empresa");
  const empresa = await prisma.empresa.findUnique({ where: { userId: session.user.id } });
  if (!empresa) redirect("/cadastro/empresa");
  if (empresa.status === "aprovado") redirect("/insights");

  const rejeitada = empresa.status === "rejeitado" || empresa.status === "recusado_automaticamente";
  return (
    <main className="mx-auto grid max-w-lg gap-4 px-4 py-16">
      {modoDemo() ? <p className="rounded-full bg-warning-bg px-3 py-1 text-center text-sm font-medium text-warning">Dados de demonstração</p> : null}
      <h1 className="font-display text-3xl font-semibold tracking-display">{rejeitada ? "Pedido recusado" : "Pedido em análise"}</h1>
      <p className="text-sm text-muted-foreground">
        {rejeitada
          ? textoMotivoVisivel(empresa.motivoCodigo, empresa.motivoTexto)
          : `${empresa.razaoSocial} está na fila. O painel abre quando a equipe aprovar o plano Empresa.`}
      </p>
      {rejeitada ? (
        <Link href="/cadastro/empresa" className="text-sm font-semibold text-accent-ink">
          Enviar novo pedido
        </Link>
      ) : null}
      <Link href="/" className="text-sm font-medium text-accent-ink">
        Voltar ao início
      </Link>
    </main>
  );
}
