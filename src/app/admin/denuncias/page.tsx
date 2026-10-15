import type { DenunciaStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { DenunciaAcoes } from "@/components/admin/denuncia-acoes";
import { botaoAdmin, campoAdmin, focoAdmin, painelAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { MOTIVOS_DENUNCIA, ROTULO_RESOLUCAO, STATUS_DENUNCIA, type ResolucaoDenuncia } from "@/lib/denuncias";
import { estaNoAr } from "@/lib/event-filters";
import { labelStatus } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const POR_PAGINA = 30;
type Params = { status?: string; tipo?: string; pagina?: string };

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminDenunciasPage({ searchParams }: { searchParams: Params }) {
  await requireSecao("denuncias");

  const status: DenunciaStatus | null =
    searchParams.status === "todas" ? null : searchParams.status && searchParams.status in STATUS_DENUNCIA ? (searchParams.status as DenunciaStatus) : "aberta";
  const pagina = Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1);
  const where: Prisma.DenunciaWhereInput = {
    ...(status ? { status } : {}),
    ...(searchParams.tipo === "evento" ? { eventId: { not: null } } : {}),
    ...(searchParams.tipo === "comentario" ? { commentId: { not: null } } : {}),
  };

  const [denuncias, total] = await Promise.all([
    prisma.denuncia.findMany({
      where,
      include: {
        user: { select: { nome: true } },
        resolvidoPor: { select: { nome: true } },
        event: { select: { id: true, titulo: true, status: true, fonte: true, _count: { select: { denuncias: { where: { status: "aberta" } } } } } },
        comment: {
          select: {
            id: true,
            texto: true,
            oculto: true,
            user: { select: { nome: true } },
            event: { select: { id: true, titulo: true } },
            _count: { select: { denuncias: { where: { status: "aberta" } } } },
          },
        },
      },
      orderBy: { criadoEm: status === "aberta" ? "asc" : "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.denuncia.count({ where }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const linkPagina = (n: number) => {
    const query = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) if (valor && chave !== "pagina") query.set(chave, valor);
    if (n > 1) query.set("pagina", String(n));
    const texto = query.toString();
    return texto ? `/admin/denuncias?${texto}` : "/admin/denuncias";
  };

  return (
    <>
      <CabecalhoAdmin
        titulo="Denúncias"
        descricao="Vindas do público, de eventos e de comentários. Despublicar ou remover fecha todas as denúncias abertas do mesmo item."
      />

      <form className={cn(painelAdmin, "flex flex-wrap items-end gap-4 p-4")}>
        <label className={rotuloAdmin}>
          Situação
          <select name="status" defaultValue={searchParams.status ?? "aberta"} className={campoAdmin}>
            {Object.entries(STATUS_DENUNCIA).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}s
              </option>
            ))}
            <option value="todas">Todas</option>
          </select>
        </label>
        <label className={rotuloAdmin}>
          Tipo
          <select name="tipo" defaultValue={searchParams.tipo ?? ""} className={campoAdmin}>
            <option value="">Eventos e comentários</option>
            <option value="evento">Eventos</option>
            <option value="comentario">Comentários</option>
          </select>
        </label>
        <button type="submit" className={botaoAdmin("primario")}>
          Filtrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-on-dark" aria-live="polite">
        {total} {total === 1 ? "denúncia" : "denúncias"}
      </p>

      {denuncias.length === 0 ? (
        <div className="mt-3">
          <Vazio>{status === "aberta" ? "Nenhuma denúncia esperando decisão." : "Nada com esses filtros."}</Vazio>
        </div>
      ) : (
        <ul className="mt-3 grid gap-3">
          {denuncias.map((d) => {
            const outras = (d.event?._count.denuncias ?? d.comment?._count.denuncias ?? 0) - (d.status === "aberta" ? 1 : 0);
            const opcoes: ResolucaoDenuncia[] = ["descartar"];
            if (d.event && estaNoAr(d.event.status)) opcoes.push("despublicar");
            if (d.comment && !d.comment.oculto) opcoes.push("remover_comentario");
            const linkEvento = d.event?.id ?? d.comment?.event.id;

            return (
              <li key={d.id} className={cn(painelAdmin, "grid gap-3 p-5")}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-on-dark">
                  <span className="chip-dark rounded-pill px-2.5 py-0.5 text-on-dark">{d.event ? "Evento" : "Comentário"}</span>
                  <span className="rounded-pill bg-[color-mix(in_srgb,var(--color-accent-from)_22%,transparent)] px-2.5 py-0.5 text-on-dark">
                    {MOTIVOS_DENUNCIA[d.motivo]}
                  </span>
                  <span>
                    por {d.user.nome} · {formatoData.format(d.criadoEm)}
                  </span>
                  {outras > 0 ? (
                    <span className="text-accent-hover">
                      +{outras} {outras === 1 ? "outra aberta" : "outras abertas"} no mesmo item
                    </span>
                  ) : null}
                </div>

                {d.event ? (
                  <p className="font-display text-lg font-semibold tracking-display">
                    {d.event.titulo}
                    <span className="ml-2 align-middle text-xs font-normal text-muted-on-dark">{labelStatus(d.event.status)}</span>
                  </p>
                ) : d.comment ? (
                  <div className="grid gap-1">
                    <p className="text-xs text-muted-on-dark">
                      {d.comment.user.nome} em {d.comment.event.titulo}
                      {d.comment.oculto ? " · já removido" : ""}
                    </p>
                    <blockquote className="border-l-2 border-[color-mix(in_srgb,var(--color-on-dark)_20%,transparent)] pl-3 text-sm">
                      {d.comment.texto}
                    </blockquote>
                  </div>
                ) : null}

                {d.texto ? <p className="text-sm text-muted-on-dark">“{d.texto}”</p> : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {linkEvento ? (
                    <Link
                      href={`/eventos/${linkEvento}`}
                      target="_blank"
                      className={cn("rounded-sm text-sm text-accent-hover underline-offset-4 hover:underline", focoAdmin)}
                    >
                      Ver no site
                    </Link>
                  ) : (
                    <span />
                  )}
                  {d.status === "aberta" ? (
                    <DenunciaAcoes id={d.id} opcoes={opcoes} />
                  ) : (
                    <p className="text-xs text-muted-on-dark">
                      {d.resolucao && d.resolucao in ROTULO_RESOLUCAO ? ROTULO_RESOLUCAO[d.resolucao as ResolucaoDenuncia] : STATUS_DENUNCIA[d.status]}
                      {d.resolvidoPor ? ` por ${d.resolvidoPor.nome}` : ""}
                      {d.resolvidoEm ? ` · ${formatoData.format(d.resolvidoEm)}` : ""}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {paginas > 1 ? (
        <nav aria-label="Paginação" className="mt-6 flex items-center gap-3 text-sm">
          {pagina > 1 ? (
            <Link href={linkPagina(pagina - 1)} className={botaoAdmin("secundario", "sm")}>
              Anterior
            </Link>
          ) : null}
          <span className="text-muted-on-dark">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={linkPagina(pagina + 1)} className={botaoAdmin("secundario", "sm")}>
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
