import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { requireSecao } from "@/lib/admin";
import { ACOES_LOG, rotuloAcao } from "@/lib/admin-log";
import { prisma } from "@/lib/prisma";

const POR_PAGINA = 50;
const FUSO = "-03:00";

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
  if (searchParams.autor) where.autorId = searchParams.autor;
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

  return (
    <div className="grid gap-6">
      <form className="grid gap-3 rounded-card bg-card p-4 shadow-card sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          Pessoa
          <select name="autor" defaultValue={searchParams.autor ?? ""} className="rounded-control border bg-background px-3 py-2">
            <option value="">Todas</option>
            {autores.map((autor) => (
              <option key={autor.autorId} value={autor.autorId ?? ""}>
                {autor.autorNome}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Ação
          <select name="acao" defaultValue={searchParams.acao ?? ""} className="rounded-control border bg-background px-3 py-2">
            <option value="">Todas</option>
            {Object.entries(ACOES_LOG).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          De
          <input type="date" name="de" defaultValue={searchParams.de ?? ""} className="rounded-control border bg-background px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Até
          <input type="date" name="ate" defaultValue={searchParams.ate ?? ""} className="rounded-control border bg-background px-3 py-2" />
        </label>
        <button type="submit" className="rounded-control bg-foreground px-4 py-2 text-sm text-background">
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "registro" : "registros"}
      </p>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ação registrada com esses filtros.</p>
      ) : (
        <ol className="grid gap-2">
          {logs.map((log) => (
            <li key={log.id} className="grid gap-1 rounded-card bg-card p-4 text-sm shadow-card">
              <p>
                <span className="font-medium">{log.autorNome}</span> · {rotuloAcao(log.acao)}
                <span className="text-muted-foreground">
                  {" "}
                  · {log.alvoTipo}
                  {log.alvoId ? ` ${log.alvoId}` : ""}
                </span>
              </p>
              {resumoDetalhes(log.detalhes) ? <p className="text-muted-foreground">{resumoDetalhes(log.detalhes)}</p> : null}
              <time dateTime={log.criadoEm.toISOString()} className="text-xs text-muted-foreground">
                {formatoData.format(log.criadoEm)}
              </time>
            </li>
          ))}
        </ol>
      )}

      {paginas > 1 ? (
        <nav className="flex items-center gap-3 text-sm">
          {pagina > 1 ? <Link href={linkPagina(pagina - 1)}>Anterior</Link> : null}
          <span className="text-muted-foreground">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? <Link href={linkPagina(pagina + 1)}>Próxima</Link> : null}
        </nav>
      ) : null}
    </div>
  );
}
