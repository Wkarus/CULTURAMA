import { OrganizadorDecisao } from "@/components/admin-forms";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminOrganizadoresPage() {
  await requireSecao("organizadores");
  const organizers = await prisma.organizer.findMany({
    include: { user: true },
    orderBy: { statusVerificacao: "asc" },
  });

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        CPF entra pendente. CNPJ ativo já chega aprovado. Aprovar libera a publicação de eventos.
      </p>
      {organizers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum organizador cadastrado.</p>
      ) : (
        <ul className="grid gap-4">
          {organizers.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-card bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-pill bg-muted px-2 py-0.5">{item.statusVerificacao}</span>
                <span>{item.tipoDocumento}</span>
              </div>
              <h2 className="text-lg font-medium tracking-display">{item.nomeEmpresa}</h2>
              <p className="text-sm">{item.user.nome}</p>
              <p className="text-sm text-muted-foreground">{item.user.email}</p>
              <p className="text-sm">{item.documento}</p>
              <a href={item.documentoUrl} target="_blank" rel="noreferrer" className="w-fit text-sm underline underline-offset-4">
                Ver documento enviado
              </a>
              {item.statusVerificacao === "pendente" ? <OrganizadorDecisao organizer={item} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
