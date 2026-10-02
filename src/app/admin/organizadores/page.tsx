import { OrganizadorDecisao } from "@/components/admin-forms";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { SuspenderOrganizador } from "@/components/admin/usuarios-acoes";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminOrganizadoresPage() {
  await requireSecao("organizadores");
  const organizers = await prisma.organizer.findMany({
    include: { user: true, _count: { select: { events: true } } },
    orderBy: { statusVerificacao: "asc" },
  });

  return (
    <>
      <CabecalhoAdmin
        titulo="Organizadores"
        descricao="CPF entra pendente. CNPJ ativo já chega aprovado. Aprovar libera a publicação de eventos. Suspender tira os eventos do site público até reativar."
      />
      {organizers.length === 0 ? (
        <Vazio>Nenhum organizador cadastrado.</Vazio>
      ) : (
        <ul className="grid gap-4">
          {organizers.map((item) => (
            <li key={item.id} className={cn(painelAdmin, "grid gap-3 p-5")}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-on-dark">
                <span className="chip-dark rounded-pill px-2.5 py-0.5 text-on-dark">{item.statusVerificacao}</span>
                {item.suspensoEm ? (
                  <span className="rounded-pill border border-[color-mix(in_srgb,var(--color-danger-fg)_50%,transparent)] px-2.5 py-0.5 text-danger">
                    suspenso desde {item.suspensoEm.toLocaleDateString("pt-BR")}
                  </span>
                ) : null}
                <span>{item.tipoDocumento}</span>
                <span className="tabular-nums">
                  {item._count.events} {item._count.events === 1 ? "evento" : "eventos"}
                </span>
              </div>
              <h2 className="font-display text-lg font-semibold tracking-display">{item.nomeEmpresa}</h2>
              <p className="text-sm">{item.user.nome}</p>
              <p className="text-sm text-muted-on-dark">{item.user.email}</p>
              <p className="text-sm tabular-nums">{item.documento}</p>
              <a
                href={`/api/organizadores/${item.id}/documento`}
                target="_blank"
                rel="noreferrer"
                className={cn("w-fit rounded-sm text-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
              >
                Ver documento enviado
              </a>
              <div className="flex flex-wrap items-center gap-3">
                {item.statusVerificacao === "pendente" ? <OrganizadorDecisao organizer={item} /> : null}
                <SuspenderOrganizador id={item.id} suspenso={Boolean(item.suspensoEm)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
