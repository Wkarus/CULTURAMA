import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { EmpresaDecisao } from "@/components/admin/empresa-decisao";
import { painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEmpresasPage() {
  await requireSecao("empresas");
  const empresas = await prisma.empresa.findMany({
    include: { user: { select: { nome: true, email: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <>
      <CabecalhoAdmin titulo="Empresas" descricao="CNPJ em análise. Aprovar libera o Culturama Insights. O painel não mostra dados pessoais." />
      {empresas.length === 0 ? (
        <Vazio>Nenhuma empresa cadastrada.</Vazio>
      ) : (
        <ul className="grid gap-4">
          {empresas.map((empresa) => (
            <li key={empresa.id} className={cn(painelAdmin, "grid gap-2 p-5")}>
              <span className="chip-dark w-fit rounded-pill px-2.5 py-0.5 text-xs text-on-dark">{empresa.status}</span>
              <h2 className="font-display text-lg font-semibold tracking-display">{empresa.razaoSocial}</h2>
              <p className="text-sm text-muted-on-dark">
                {empresa.user.nome} · {empresa.user.email}
              </p>
              <p className="text-sm tabular-nums text-muted-on-dark">CNPJ {empresa.cnpj}</p>
              <EmpresaDecisao id={empresa.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
