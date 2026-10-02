import { OrganizadorDecisao } from "@/components/admin-forms";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminOrganizadoresPage() {
  await requireSecao("organizadores");
  const organizers = await prisma.organizer.findMany({
    include: { user: true },
    orderBy: { statusVerificacao: "asc" },
  });

  return (
    <>
      <CabecalhoAdmin
        titulo="Organizadores"
        descricao="CPF entra pendente. CNPJ ativo já chega aprovado. Aprovar libera a publicação de eventos."
      />
      {organizers.length === 0 ? (
        <Vazio>Nenhum organizador cadastrado.</Vazio>
      ) : (
        <ul className="grid gap-4">
          {organizers.map((item) => (
            <li key={item.id} className={cn(painelAdmin, "grid gap-3 p-5")}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-on-dark">
                <span className="chip-dark rounded-pill px-2.5 py-0.5 text-on-dark">{item.statusVerificacao}</span>
                <span>{item.tipoDocumento}</span>
              </div>
              <h2 className="font-display text-lg font-semibold tracking-display">{item.nomeEmpresa}</h2>
              <p className="text-sm">{item.user.nome}</p>
              <p className="text-sm text-muted-on-dark">{item.user.email}</p>
              <p className="text-sm tabular-nums">{item.documento}</p>
              <a
                href={item.documentoUrl}
                target="_blank"
                rel="noreferrer"
                className={cn("w-fit rounded-sm text-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
              >
                Ver documento enviado
              </a>
              {item.statusVerificacao === "pendente" ? <OrganizadorDecisao organizer={item} /> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
