import Link from "next/link";
import { ExternalLink, ImageOff } from "lucide-react";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { focoAdmin, painelAdmin } from "@/components/admin/estilos";
import { RevisaoAcoes } from "@/components/admin/revisao-acoes";
import { requireSecao } from "@/lib/admin";
import { labelRestricao } from "@/lib/eventos";
import { imagemMesmaOrigem } from "@/lib/imagem";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminRevisaoPage() {
  await requireSecao("revisao");
  const fila = await prisma.event.findMany({
    where: { status: "em_revisao" },
    include: {
      category: { include: { parent: { select: { nome: true } } } },
      organizer: { select: { nomeEmpresa: true, statusVerificacao: true, user: { select: { nome: true, email: true } } } },
    },
    orderBy: { dataHora: "asc" },
  });

  return (
    <>
      <CabecalhoAdmin
        titulo="Revisão"
        descricao="Eventos enviados por organizadores em análise. Aprovar publica na hora; recusar ou pedir ajuste volta para rascunho com a sua mensagem."
      />
      {fila.length === 0 ? (
        <Vazio>Nada esperando revisão.</Vazio>
      ) : (
        <ul className="grid gap-5">
          {fila.map((evento) => {
            const categoria = evento.category
              ? evento.category.parent
                ? `${evento.category.parent.nome} › ${evento.category.nome}`
                : evento.category.nome
              : "Sem categoria";
            return (
              <li key={evento.id} className={cn(painelAdmin, "grid overflow-hidden lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]")}>
                <article className="grid content-start gap-4 p-5 sm:p-6">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--color-on-dark)_6%,transparent)]">
                    {evento.imagemCapa ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagemMesmaOrigem(evento.imagemCapa)} alt="" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-on-dark">
                        <ImageOff className="size-4" aria-hidden />
                        Sem capa
                      </span>
                    )}
                  </div>
                  <div className="grid gap-1.5">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent-hover">{categoria}</p>
                    <h2 className="font-display text-xl font-semibold tracking-display">{evento.titulo}</h2>
                    <p className="text-sm text-muted-on-dark">
                      {formatoData.format(evento.dataHora)} · {evento.gratuito ? "Gratuito" : "Pago"} · {labelRestricao(evento.restricaoIdade)}
                    </p>
                    <p className="text-sm">{evento.endereco}</p>
                  </div>
                  <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-on-dark">{evento.descricao}</p>
                  <Link
                    href={`/eventos/${evento.id}`}
                    target="_blank"
                    className={cn("inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
                  >
                    Ver como no site
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">(abre em nova aba)</span>
                  </Link>
                </article>
                <div className="grid content-start gap-5 border-t border-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] p-5 sm:p-6 lg:border-l lg:border-t-0">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="grid gap-0.5">
                      <dt className="text-muted-on-dark">Organizador</dt>
                      <dd>{evento.organizer?.nomeEmpresa ?? "Equipe Culturama"}</dd>
                    </div>
                    <div className="grid gap-0.5">
                      <dt className="text-muted-on-dark">Responsável</dt>
                      <dd className="truncate">
                        {evento.organizer ? `${evento.organizer.user.nome} · ${evento.organizer.user.email}` : "—"}
                      </dd>
                    </div>
                    <div className="grid gap-0.5">
                      <dt className="text-muted-on-dark">Verificação</dt>
                      <dd>{evento.organizer?.statusVerificacao ?? "—"}</dd>
                    </div>
                    {evento.linkIngresso || evento.linkSaibaMais ? (
                      <div className="grid gap-0.5">
                        <dt className="text-muted-on-dark">Link</dt>
                        <dd className="truncate">
                          <a
                            href={evento.linkIngresso ?? evento.linkSaibaMais ?? "#"}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={cn("rounded-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
                          >
                            {evento.linkIngresso ?? evento.linkSaibaMais}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <RevisaoAcoes eventoId={evento.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
