import { ocultarComentario } from "@/actions/social";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { botaoAdmin, painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminComentariosPage() {
  await requireSecao("comentarios");
  const reports = await prisma.commentReport.findMany({
    include: {
      user: { select: { nome: true, email: true } },
      comment: { include: { user: { select: { nome: true } }, event: { select: { id: true, titulo: true } } } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <>
      <CabecalhoAdmin titulo="Comentários" descricao="Denúncias. Ocultar tira o comentário do site público, sem apagar o histórico." />
      {reports.length === 0 ? (
        <Vazio>Nenhuma denúncia no momento.</Vazio>
      ) : (
        <ul className="grid gap-4">
          {reports.map((item) => (
            <li key={item.id} className={cn(painelAdmin, "grid gap-2 p-5")}>
              <p className="text-xs text-muted-on-dark">
                {item.comment.oculto ? "já oculto" : "visível"} · evento {item.comment.event.titulo}
              </p>
              <p className="text-sm font-medium">{item.comment.user.nome}</p>
              <p className="text-sm">{item.comment.texto}</p>
              <p className="text-sm text-muted-on-dark">
                Denúncia de {item.user.nome}: {item.motivo}
              </p>
              {!item.comment.oculto ? (
                <form
                  action={async () => {
                    "use server";
                    await ocultarComentario(item.commentId);
                  }}
                >
                  <button type="submit" className={botaoAdmin("perigo", "sm")}>
                    Ocultar
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
