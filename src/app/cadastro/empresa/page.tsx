import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChartColumn, Handshake, MapPin, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { EmpresaForm } from "@/components/empresa-form";
import { AuthShell, AuthTroca, type Beneficio } from "@/components/auth-shell";
import { capasDecorativas } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cadastro de empresa" };

const BENEFICIOS_INSIGHTS: Beneficio[] = [
  { icone: ChartColumn, texto: "Veja quais cenas e categorias atraem mais interesse" },
  { icone: MapPin, texto: "Descubra onde o público procura eventos, por região" },
  { icone: Handshake, texto: "Encontre eventos e organizadores para patrocinar" },
  { icone: ShieldCheck, texto: "Só dados agregados e anônimos, dentro da LGPD" },
];

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
      beneficios={BENEFICIOS_INSIGHTS}
    >
      <EmpresaForm reenvio={reenvio} />
      <AuthTroca pergunta="Já tem conta?" href="/login?callbackUrl=/insights" acao="Entrar" />
    </AuthShell>
  );
}
