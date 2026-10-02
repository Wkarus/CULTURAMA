import Link from "next/link";
import { ocultarComentario } from "@/actions/social";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { botaoAdmin, focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { MOTIVOS_DENUNCIA } from "@/lib/denuncias";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminComentariosPage() {
  await requireSecao("comentarios");
  const comentarios = await prisma.comment.findMany({
    where: { oculto: false, denuncias: { some: { status: "aberta" } } },
    include: {
      user: { select: { nome: true } },
      event: { select: { id: true, titulo: true } },
      denuncias: { where: { status: "aberta" }, include: { user: { select: { nome: true } } }, orderBy: { criadoEm: "asc" } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <>
      <CabecalhoAdmin
        titulo="Comentários"
        descricao="Comentários visíveis com denúncia aberta. Ocultar tira do site público sem apagar e fecha as denúncias dele."
      />
      {comentarios.length === 0 ? (
        <Vazio>Nenhum comentário denunciado no momento.</Vazio>
      ) : (
        <ul className="grid gap-4">
          {comentarios.map((item) => (
            <li key={item.id} className={cn(painelAdmin, "grid gap-2 p-5")}>
              <p className="text-xs text-muted-on-dark">
                <Link
                  href={`/eventos/${item.event.id}`}
                  target="_blank"
                  className={cn("rounded-sm underline-offset-4 hover:underline", focoAdmin)}
                >
                  {item.event.titulo}
                </Link>
              </p>
              <p className="text-sm font-medium">{item.user.nome}</p>
              <p className="text-sm">{item.texto}</p>
              <ul className="grid gap-1 text-sm text-muted-on-dark">
                {item.denuncias.map((d) => (
                  <li key={d.id}>
                    {d.user.nome}: {MOTIVOS_DENUNCIA[d.motivo]}
                    {d.texto ? ` — ${d.texto}` : ""}
                  </li>
                ))}
              </ul>
              <form
                action={async () => {
                  "use server";
                  await ocultarComentario(item.id);
                }}
              >
                <button type="submit" className={botaoAdmin("perigo", "sm")}>
                  Ocultar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
