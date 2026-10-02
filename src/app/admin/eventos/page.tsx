import type { EventStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { botaoAdmin, campoAdmin, focoAdmin, painelAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { EventoAcoes } from "@/components/admin/evento-acoes";
import { requireSecao } from "@/lib/admin";
import { podeExcluirEvento } from "@/lib/admin-permissoes";
import { ensureCategorias } from "@/lib/categorias";
import { idsDaCategoria, montarArvore } from "@/lib/categorias-arvore";
import { labelStatus } from "@/lib/eventos";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const POR_PAGINA = 30;
const FUSO = "-03:00";
const STATUS: EventStatus[] = ["publicado", "em_revisao", "rascunho", "adiado", "cancelado"];

type Params = { q?: string; status?: string; fonte?: string; categoria?: string; de?: string; ate?: string; pagina?: string };

function dataValida(valor: string | undefined): valor is string {
  return Boolean(valor && /^\d{4}-\d{2}-\d{2}$/.test(valor));
}

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const COR_STATUS: Record<EventStatus, string> = {
  publicado: "bg-[color-mix(in_srgb,var(--color-accent-to)_22%,transparent)] text-on-dark",
  em_revisao: "bg-[color-mix(in_srgb,var(--color-accent-from)_22%,transparent)] text-on-dark",
  rascunho: "chip-dark text-muted-on-dark",
  adiado: "chip-dark text-on-dark",
  cancelado: "chip-dark text-muted-on-dark line-through decoration-1",
};

export default async function AdminEventosPage({ searchParams }: { searchParams: Params }) {
  const user = await requireSecao("eventos");
  const categorias = await ensureCategorias();
  const arvore = montarArvore(categorias);

  const pagina = Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1);
  const q = searchParams.q?.trim() ?? "";
  const where: Prisma.EventWhereInput = {};
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { endereco: { contains: q, mode: "insensitive" } },
      { organizer: { nomeEmpresa: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (STATUS.includes(searchParams.status as EventStatus)) where.status = searchParams.status as EventStatus;
  if (searchParams.fonte === "interno" || searchParams.fonte === "ticketmaster") where.fonte = searchParams.fonte;
  if (searchParams.fonte === "destaque") where.destaque = true;
  const idsCategoria = idsDaCategoria(categorias, searchParams.categoria);
  if (idsCategoria) where.categoriaId = { in: idsCategoria };
  if (dataValida(searchParams.de) || dataValida(searchParams.ate)) {
    where.dataHora = {
      ...(dataValida(searchParams.de) ? { gte: new Date(`${searchParams.de}T00:00:00${FUSO}`) } : {}),
      ...(dataValida(searchParams.ate) ? { lte: new Date(`${searchParams.ate}T23:59:59.999${FUSO}`) } : {}),
    };
  }

  const [eventos, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { category: true, organizer: { select: { nomeEmpresa: true } } },
      orderBy: [{ dataHora: "desc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.event.count({ where }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const linkPagina = (n: number) => {
    const query = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) if (valor && chave !== "pagina") query.set(chave, valor);
    if (n > 1) query.set("pagina", String(n));
    const texto = query.toString();
    return texto ? `/admin/eventos?${texto}` : "/admin/eventos";
  };
  const filtrando = Object.entries(searchParams).some(([chave, valor]) => valor && chave !== "pagina");
  const podeExcluir = podeExcluirEvento(user.tipo);

  return (
    <>
      <CabecalhoAdmin
        titulo="Eventos"
        descricao="Locais e da Ticketmaster. Ticketmaster só sai do ar ou ganha destaque; o conteúdo vem da sincronização."
        acoes={
          <Link href="/admin/eventos/novo" className={botaoAdmin("primario")}>
            <Plus aria-hidden />
            Novo evento
          </Link>
        }
      />

      <form className={cn(painelAdmin, "grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end")} role="search">
        <label className={cn(rotuloAdmin, "sm:col-span-2")}>
          Buscar
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Título, endereço ou organizador"
            className={campoAdmin}
          />
        </label>
        <label className={rotuloAdmin}>
          Status
          <select name="status" defaultValue={searchParams.status ?? ""} className={campoAdmin}>
            <option value="">Todos</option>
            {STATUS.map((status) => (
              <option key={status} value={status}>
                {labelStatus(status)}
              </option>
            ))}
          </select>
        </label>
        <label className={rotuloAdmin}>
          Fonte
          <select name="fonte" defaultValue={searchParams.fonte ?? ""} className={campoAdmin}>
            <option value="">Todas</option>
            <option value="interno">Local</option>
            <option value="ticketmaster">Ticketmaster</option>
            <option value="destaque">Só destaques</option>
          </select>
        </label>
        <label className={cn(rotuloAdmin, "sm:col-span-2")}>
          Categoria
          <select name="categoria" defaultValue={searchParams.categoria ?? ""} className={campoAdmin}>
            <option value="">Todas</option>
            {arvore.map((mae) => (
              <optgroup key={mae.id} label={mae.nome}>
                <option value={mae.slug}>{mae.nome} (todas)</option>
                {mae.filhas.map((filha) => (
                  <option key={filha.id} value={filha.slug}>
                    {filha.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className={rotuloAdmin}>
          De
          <input type="date" name="de" defaultValue={searchParams.de ?? ""} className={campoAdmin} />
        </label>
        <label className={rotuloAdmin}>
          Até
          <input type="date" name="ate" defaultValue={searchParams.ate ?? ""} className={campoAdmin} />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
          {filtrando ? (
            <Link href="/admin/eventos" className={botaoAdmin("fantasma")}>
              Limpar
            </Link>
          ) : null}
          <button type="submit" className={botaoAdmin("primario")}>
            Filtrar
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-muted-on-dark" aria-live="polite">
        {total} {total === 1 ? "evento" : "eventos"}
      </p>

      {eventos.length === 0 ? (
        <div className="mt-3">
          <Vazio>Nenhum evento com esses filtros.</Vazio>
        </div>
      ) : (
        <div className={cn(painelAdmin, "mt-3 overflow-x-auto")}>
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.1em] text-muted-on-dark">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Evento
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Data
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoria
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id} className="border-t border-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] align-middle">
                  <td className="max-w-[22rem] px-4 py-3">
                    <Link
                      href={`/eventos/${evento.id}`}
                      target="_blank"
                      className={cn("line-clamp-1 rounded-sm font-medium underline-offset-4 hover:underline", focoAdmin)}
                    >
                      {evento.destaque ? <Star className="mr-1.5 inline size-3.5 fill-current align-[-2px] text-accent-hover" aria-label="Destaque" /> : null}
                      {evento.titulo}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-muted-on-dark">
                      {evento.fonte === "ticketmaster" ? "Ticketmaster" : (evento.organizer?.nomeEmpresa ?? "Equipe Culturama")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-on-dark">{formatoData.format(evento.dataHora)}</td>
                  <td className="px-4 py-3 text-muted-on-dark">{evento.category?.nome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-medium", COR_STATUS[evento.status])}>
                      {labelStatus(evento.status)}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <EventoAcoes
                      id={evento.id}
                      titulo={evento.titulo}
                      publicado={evento.status === "publicado"}
                      destaque={evento.destaque}
                      ticketmaster={evento.fonte === "ticketmaster"}
                      podeExcluir={podeExcluir}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
