import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { botaoAdmin, campoAdmin, painelAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { requireSecao } from "@/lib/admin";
import { ACOES_LOG, AUTOR_CRON, rotuloAcao } from "@/lib/admin-log";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const POR_PAGINA = 50;
const FUSO = "-03:00";
const AUTOR_SISTEMA = "sistema";

type Params = { autor?: string; acao?: string; de?: string; ate?: string; pagina?: string };

function dataValida(valor: string | undefined): valor is string {
  return Boolean(valor && /^\d{4}-\d{2}-\d{2}$/.test(valor));
}

function resumoDetalhes(detalhes: Prisma.JsonValue | null): string {
  if (!detalhes || typeof detalhes !== "object" || Array.isArray(detalhes)) return "";
  return Object.entries(detalhes)
    .map(([chave, valor]) => `${chave}: ${typeof valor === "object" ? JSON.stringify(valor) : String(valor)}`)
    .join(" · ");
}

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminHistoricoPage({ searchParams }: { searchParams: Params }) {
  await requireSecao("historico");

  const pagina = Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1);
  const where: Prisma.AdminLogWhereInput = {};
  if (searchParams.autor === AUTOR_SISTEMA) where.autorId = null;
  else if (searchParams.autor) where.autorId = searchParams.autor;
  if (searchParams.acao) where.acao = searchParams.acao;
  if (dataValida(searchParams.de) || dataValida(searchParams.ate)) {
    where.criadoEm = {
      ...(dataValida(searchParams.de) ? { gte: new Date(`${searchParams.de}T00:00:00${FUSO}`) } : {}),
      ...(dataValida(searchParams.ate) ? { lte: new Date(`${searchParams.ate}T23:59:59.999${FUSO}`) } : {}),
    };
  }

  const [logs, total, autores] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.adminLog.count({ where }),
    prisma.adminLog.findMany({
      where: { autorId: { not: null } },
      distinct: ["autorId"],
      select: { autorId: true, autorNome: true },
      orderBy: { autorNome: "asc" },
    }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const linkPagina = (n: number) => {
    const query = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) {
      if (valor && chave !== "pagina") query.set(chave, valor);
    }
    if (n > 1) query.set("pagina", String(n));
    const texto = query.toString();
    return texto ? `/admin/historico?${texto}` : "/admin/historico";
  };
  const linkPaginacao = botaoAdmin("secundario", "sm");

  return (
    <>
      <CabecalhoAdmin titulo="Histórico" descricao="Tudo o que a equipe fez no painel, com quem, quando e em quê." />

      <form className={cn(painelAdmin, "grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end")}>
        <label className={rotuloAdmin}>
          Pessoa
          <select name="autor" defaultValue={searchParams.autor ?? ""} className={campoAdmin}>
            <option value="">Todas</option>
            {autores.map((autor) => (
              <option key={autor.autorId} value={autor.autorId ?? ""}>
                {autor.autorNome}
              </option>
            ))}
            <option value={AUTOR_SISTEMA}>{AUTOR_CRON}</option>
          </select>
        </label>
        <label className={rotuloAdmin}>
          Ação
          <select name="acao" defaultValue={searchParams.acao ?? ""} className={campoAdmin}>
            <option value="">Todas</option>
            {Object.entries(ACOES_LOG).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
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
        <button type="submit" className={botaoAdmin("primario")}>
          Filtrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-on-dark" aria-live="polite">
        {total} {total === 1 ? "registro" : "registros"}
      </p>

      {logs.length === 0 ? (
        <div className="mt-3">
          <Vazio>Nenhuma ação registrada com esses filtros.</Vazio>
        </div>
      ) : (
        <ol className={cn(painelAdmin, "mt-3 grid overflow-hidden")}>
          {logs.map((log) => {
            const detalhes = resumoDetalhes(log.detalhes);
            return (
              <li
                key={log.id}
                className="grid gap-1 border-t border-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] px-5 py-4 text-sm first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
              >
                <time dateTime={log.criadoEm.toISOString()} className="tabular-nums text-muted-on-dark">
                  {formatoData.format(log.criadoEm)}
                </time>
                <div className="grid min-w-0 gap-1">
                  <p>
                    <span className="font-medium">{log.autorNome}</span>
                    <span className="text-muted-on-dark"> · </span>
                    {rotuloAcao(log.acao)}
                    <span className="text-muted-on-dark">
                      {" "}
                      · {log.alvoTipo}
                      {log.alvoId ? ` ${log.alvoId}` : ""}
                    </span>
                  </p>
                  {detalhes ? <p className="break-words text-muted-on-dark">{detalhes}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {paginas > 1 ? (
        <nav aria-label="Paginação" className="mt-6 flex items-center gap-3 text-sm">
          {pagina > 1 ? (
            <Link href={linkPagina(pagina - 1)} className={linkPaginacao}>
              Anterior
            </Link>
          ) : null}
          <span className="text-muted-on-dark">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={linkPagina(pagina + 1)} className={linkPaginacao}>
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
