import Link from "next/link";
import { decidirEmpresa } from "@/actions/empresa";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { DecisaoAcesso, ReabrirPedido } from "@/components/admin/decisao-acesso";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { documentoMascarado, textoMotivoVisivel } from "@/lib/pedido-acesso";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEmpresasPage({ searchParams }: { searchParams: { aba?: string } }) {
  await requireSecao("empresas");
  const recusados = searchParams.aba === "recusados";
  const empresas = await prisma.empresa.findMany({
    where: recusados ? { status: "recusado_automaticamente" } : { status: { not: "recusado_automaticamente" } },
    include: { user: { select: { nome: true, email: true } } },
    orderBy: { pedidoEm: "desc" },
  });
  const item = (ativo: boolean) =>
    cn("rounded-pill px-3 py-1.5 text-sm", ativo ? "bg-accent-gradient text-on-dark" : "text-muted-on-dark hover:text-on-dark", focoAdmin);

  return (
    <>
      <CabecalhoAdmin
        titulo="Empresas"
        descricao="O plano Empresa fica em análise até a aprovação. A decisão é feita neste painel, com a conta admin."
      />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Listas de pedidos">
        <Link href="/admin/empresas" className={item(!recusados)}>
          Cadastros
        </Link>
        <Link href="/admin/empresas?aba=recusados" className={item(recusados)}>
          Recusados automaticamente
        </Link>
      </nav>
      {empresas.length === 0 ? (
        <Vazio>{recusados ? "Nenhum pedido recusado automaticamente." : "Nenhuma empresa nesta lista."}</Vazio>
      ) : (
        <ul className="grid gap-4">
          {empresas.map((empresa) => (
            <li key={empresa.id} className={cn(painelAdmin, "grid gap-2 p-5")}>
              <span className="chip-dark w-fit rounded-pill px-2.5 py-0.5 text-xs text-on-dark">{rotuloStatus(empresa.status)}</span>
              <h2 className="font-display text-lg font-semibold tracking-display">{empresa.razaoSocial}</h2>
              <p className="text-sm text-muted-on-dark">
                {empresa.user.nome} · {empresa.user.email}
              </p>
              <p className="text-sm tabular-nums text-muted-on-dark">{documentoMascarado("CNPJ", empresa.cnpj)}</p>
              <p className="text-sm text-muted-on-dark">{empresa.pedidoEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              {empresa.observacao ? <p className="text-sm text-muted-on-dark">{empresa.observacao}</p> : null}
              {empresa.motivoCodigo ? <p className="text-sm">{textoMotivoVisivel(empresa.motivoCodigo, empresa.motivoTexto)}</p> : null}
              {empresa.status === "pendente" ? <DecisaoAcesso id={empresa.id} acao={decidirEmpresa} /> : null}
              {recusados ? <ReabrirPedido id={empresa.id} tipo="empresa" /> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function rotuloStatus(status: string) {
  if (status === "pendente") return "Em análise";
  if (status === "aprovado") return "Aprovado";
  if (status === "recusado_automaticamente") return "Recusado automaticamente";
  return "Recusado";
}
