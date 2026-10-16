import Link from "next/link";
import { decidirOrganizador } from "@/actions/admin";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { DecisaoAcesso, ReabrirPedido } from "@/components/admin/decisao-acesso";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { SuspenderOrganizador } from "@/components/admin/usuarios-acoes";
import { requireSecao } from "@/lib/admin";
import { documentoMascarado, textoMotivoVisivel } from "@/lib/pedido-acesso";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminOrganizadoresPage({ searchParams }: { searchParams: { aba?: string } }) {
  await requireSecao("organizadores");
  const recusados = searchParams.aba === "recusados";
  const organizers = await prisma.organizer.findMany({
    where: recusados ? { statusVerificacao: "recusado_automaticamente" } : { statusVerificacao: { not: "recusado_automaticamente" } },
    include: { user: true, _count: { select: { events: true } } },
    orderBy: { pedidoEm: "desc" },
  });

  return (
    <>
      <CabecalhoAdmin
        titulo="Organizadores"
        descricao="CPF entra na fila. CNPJ ativo já chega aprovado. Aprovar libera a publicação. A decisão é feita aqui, com a conta admin."
      />
      <Abas base="/admin/organizadores" recusados={recusados} />
      {organizers.length === 0 ? (
        <Vazio>{recusados ? "Nenhum pedido recusado automaticamente." : "Nenhum organizador nesta lista."}</Vazio>
      ) : (
        <ul className="grid gap-4">
          {organizers.map((item) => (
            <li key={item.id} className={cn(painelAdmin, "grid gap-3 p-5")}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-on-dark">
                <span className="chip-dark rounded-pill px-2.5 py-0.5 text-on-dark">{rotuloStatus(item.statusVerificacao)}</span>
                {item.suspensoEm ? (
                  <span className="rounded-pill border border-[color-mix(in_srgb,var(--color-danger-fg)_50%,transparent)] px-2.5 py-0.5 text-danger">
                    suspenso desde {item.suspensoEm.toLocaleDateString("pt-BR")}
                  </span>
                ) : null}
                <span className="tabular-nums">
                  {item._count.events} {item._count.events === 1 ? "evento" : "eventos"}
                </span>
                <span>{item.pedidoEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
              </div>
              <h2 className="font-display text-lg font-semibold tracking-display">{item.nomeEmpresa}</h2>
              <p className="text-sm">{item.user.nome}</p>
              <p className="text-sm text-muted-on-dark">{item.user.email}</p>
              <p className="text-sm tabular-nums">{documentoMascarado(item.tipoDocumento, item.documento)}</p>
              {item.observacao ? <p className="text-sm text-muted-on-dark">{item.observacao}</p> : null}
              {item.motivoCodigo ? <p className="text-sm">{textoMotivoVisivel(item.motivoCodigo, item.motivoTexto)}</p> : null}
              {item.documentoUrl ? (
                <a
                  href={`/api/organizadores/${item.id}/documento`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("w-fit rounded-sm text-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
                >
                  Ver documento enviado
                </a>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {item.statusVerificacao === "pendente" ? <DecisaoAcesso id={item.id} acao={decidirOrganizador} /> : null}
                {recusados ? <ReabrirPedido id={item.id} tipo="organizador" /> : null}
                <SuspenderOrganizador id={item.id} suspenso={Boolean(item.suspensoEm)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Abas({ base, recusados }: { base: string; recusados: boolean }) {
  const item = (ativo: boolean) =>
    cn("rounded-pill px-3 py-1.5 text-sm", ativo ? "bg-accent-gradient text-on-dark" : "text-muted-on-dark hover:text-on-dark", focoAdmin);
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Listas de pedidos">
      <Link href={base} className={item(!recusados)}>
        Cadastros
      </Link>
      <Link href={`${base}?aba=recusados`} className={item(recusados)}>
        Recusados automaticamente
      </Link>
    </nav>
  );
}

function rotuloStatus(status: string) {
  if (status === "pendente") return "Em análise";
  if (status === "aprovado") return "Aprovado";
  if (status === "recusado_automaticamente") return "Recusado automaticamente";
  return "Recusado";
}
