import type { Prisma, UserTipo } from "@prisma/client";
import Link from "next/link";
import { CabecalhoAdmin, Vazio } from "@/components/admin/cabecalho";
import { botaoAdmin, campoAdmin, painelAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { ExcluirConta, MudarPapel, SuspenderUsuario } from "@/components/admin/usuarios-acoes";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const POR_PAGINA = 30;
const FUSO = "-03:00";
const PAPEIS: { valor: UserTipo; rotulo: string }[] = [
  { valor: "comum", rotulo: "Público" },
  { valor: "organizador", rotulo: "Organizador" },
  { valor: "empresa", rotulo: "Empresa" },
  { valor: "moderador", rotulo: "Moderador" },
  { valor: "admin", rotulo: "Admin" },
];
const ROTULO_PAPEL = Object.fromEntries(PAPEIS.map((p) => [p.valor, p.rotulo])) as Record<UserTipo, string>;

type Params = { q?: string; papel?: string; situacao?: string; de?: string; ate?: string; pagina?: string };

function dataValida(valor: string | undefined): valor is string {
  return Boolean(valor && /^\d{4}-\d{2}-\d{2}$/.test(valor));
}

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

export default async function AdminUsuariosPage({ searchParams }: { searchParams: Params }) {
  const admin = await requireSecao("usuarios");

  const pagina = Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1);
  const q = searchParams.q?.trim() ?? "";
  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [{ nome: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
  }
  if (PAPEIS.some((p) => p.valor === searchParams.papel)) where.tipo = searchParams.papel as UserTipo;
  if (searchParams.situacao === "suspensos") where.suspensoEm = { not: null };
  if (searchParams.situacao === "ativos") where.suspensoEm = null;
  if (dataValida(searchParams.de) || dataValida(searchParams.ate)) {
    where.criadoEm = {
      ...(dataValida(searchParams.de) ? { gte: new Date(`${searchParams.de}T00:00:00${FUSO}`) } : {}),
      ...(dataValida(searchParams.ate) ? { lte: new Date(`${searchParams.ate}T23:59:59.999${FUSO}`) } : {}),
    };
  }

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        criadoEm: true,
        suspensoEm: true,
        organizer: { select: { nomeEmpresa: true, _count: { select: { events: true } } } },
        _count: { select: { comments: true, favorites: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.user.count({ where }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const linkPagina = (n: number) => {
    const query = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) if (valor && chave !== "pagina") query.set(chave, valor);
    if (n > 1) query.set("pagina", String(n));
    const texto = query.toString();
    return texto ? `/admin/usuarios?${texto}` : "/admin/usuarios";
  };
  const filtrando = Object.entries(searchParams).some(([chave, valor]) => valor && chave !== "pagina");

  return (
    <>
      <CabecalhoAdmin
        titulo="Usuários"
        descricao="Suspender bloqueia o login e tira do ar os eventos da pessoa. Moderadores cuidam de revisão, eventos, comentários e denúncias."
      />

      <form className={cn(painelAdmin, "grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end")} role="search">
        <label className={cn(rotuloAdmin, "sm:col-span-2")}>
          Buscar
          <input type="search" name="q" defaultValue={q} placeholder="Nome ou e-mail" className={campoAdmin} />
        </label>
        <label className={rotuloAdmin}>
          Papel
          <select name="papel" defaultValue={searchParams.papel ?? ""} className={campoAdmin}>
            <option value="">Todos</option>
            {PAPEIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className={rotuloAdmin}>
          Situação
          <select name="situacao" defaultValue={searchParams.situacao ?? ""} className={campoAdmin}>
            <option value="">Todas</option>
            <option value="ativos">Ativos</option>
            <option value="suspensos">Suspensos</option>
          </select>
        </label>
        <label className={rotuloAdmin}>
          Cadastro de
          <input type="date" name="de" defaultValue={searchParams.de ?? ""} className={campoAdmin} />
        </label>
        <label className={rotuloAdmin}>
          até
          <input type="date" name="ate" defaultValue={searchParams.ate ?? ""} className={campoAdmin} />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
          {filtrando ? (
            <Link href="/admin/usuarios" className={botaoAdmin("fantasma")}>
              Limpar
            </Link>
          ) : null}
          <button type="submit" className={botaoAdmin("primario")}>
            Filtrar
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-muted-on-dark" aria-live="polite">
        {total} {total === 1 ? "pessoa" : "pessoas"}
      </p>

      {usuarios.length === 0 ? (
        <div className="mt-3">
          <Vazio>Ninguém com esses filtros.</Vazio>
        </div>
      ) : (
        <ul className="mt-3 grid gap-3">
          {usuarios.map((u) => {
            const editavel = u.id !== admin.id && u.tipo !== "admin";
            return (
              <li key={u.id} className={cn(painelAdmin, "grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center")}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{u.nome}</span>
                    <span className="chip-dark rounded-pill px-2.5 py-0.5 text-xs text-on-dark">{ROTULO_PAPEL[u.tipo]}</span>
                    {u.suspensoEm ? (
                      <span className="rounded-pill border border-[color-mix(in_srgb,var(--color-danger-fg)_50%,transparent)] px-2.5 py-0.5 text-xs text-danger">suspenso</span>
                    ) : null}
                    {u.id === admin.id ? <span className="text-xs text-muted-on-dark">(você)</span> : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-on-dark">{u.email}</p>
                  <p className="mt-1 text-xs tabular-nums text-muted-on-dark">
                    Desde {formatoData.format(u.criadoEm)} · {u._count.favorites} favoritos · {u._count.comments} comentários
                    {u.organizer ? ` · ${u.organizer.nomeEmpresa} (${u.organizer._count.events} eventos)` : ""}
                  </p>
                </div>
                {editavel ? (
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <MudarPapel id={u.id} moderador={u.tipo === "moderador"} />
                    <SuspenderUsuario id={u.id} suspenso={Boolean(u.suspensoEm)} />
                    <ExcluirConta id={u.id} nome={u.nome} email={u.email} eventos={u.organizer ? u.organizer._count.events : null} />
                  </div>
                ) : null}
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
