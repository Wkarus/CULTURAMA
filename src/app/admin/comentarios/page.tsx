import { ocultarComentario } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Denúncias. Ocultar tira o comentário do site público, sem apagar o histórico.</p>
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma denúncia no momento.</p>
      ) : (
        <ul className="grid gap-4">
          {reports.map((item) => (
            <li key={item.id} className="grid gap-2 rounded-card bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">
                {item.comment.oculto ? "já oculto" : "visível"} · evento {item.comment.event.titulo}
              </p>
              <p className="text-sm font-medium">{item.comment.user.nome}</p>
              <p className="text-sm">{item.comment.texto}</p>
              <p className="text-sm text-muted-foreground">
                Denúncia de {item.user.nome}: {item.motivo}
              </p>
              {!item.comment.oculto ? (
                <form
                  action={async () => {
                    "use server";
                    await ocultarComentario(item.commentId);
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    Ocultar
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
