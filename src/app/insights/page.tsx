import type { Metadata } from "next";
import Link from "next/link";
import { ContatoOrganizador } from "@/components/insights/contato-organizador";
import { GraficoCrescimento } from "@/components/insights/grafico-crescimento";
import { lerFiltros, type FiltrosInsights, type PainelInsights } from "@/lib/insights-agregar";
import { montarPainel } from "@/lib/insights-dados";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FOCO = "outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light";

function consulta(filtros: FiltrosInsights, patch: Partial<FiltrosInsights> = {}) {
  const dias = patch.dias ?? filtros.dias;
  const regiao = patch.regiao === undefined ? filtros.regiao : patch.regiao;
  const categoria = patch.categoria === undefined ? filtros.categoria : patch.categoria;
  const params = new URLSearchParams();
  if (dias !== 30) params.set("dias", String(dias));
  if (regiao) params.set("regiao", regiao);
  if (categoria) params.set("categoria", categoria);
  const texto = params.toString();
  return texto ? `/insights?${texto}` : "/insights";
}

function percentual(valor: number | null) {
  if (valor === null) return "nova no período";
  const pontos = Math.round(valor * 100);
  return `${pontos > 0 ? "+" : ""}${pontos}%`;
}

function Card({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <article className="rounded-card bg-card p-5 shadow-card">
      <h2 className="text-sm text-muted-foreground">{titulo}</h2>
      <p className="mt-2 font-display text-3xl font-semibold tracking-display">{valor}</p>
      {detalhe ? <p className="mt-1 text-sm text-muted-foreground">{detalhe}</p> : null}
    </article>
  );
}

function Painel({ painel, filtros }: { painel: PainelInsights; filtros: FiltrosInsights }) {
  const exportar = consulta(filtros).replace("/insights", "/insights/relatorio");
  return (
    <>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-display">Culturama Insights</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Leitura de interesse cultural. Números agregados, sem nome, e-mail ou identificador de pessoa.
          </p>
        </div>
        <a href={exportar} className={cn("rounded-full border border-border-light bg-card px-4 py-2 text-sm font-medium", FOCO)}>
          Exportar CSV
        </a>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <fieldset className="flex rounded-full bg-muted p-1">
          <legend className="sr-only">Período</legend>
          {([7, 30, 90] as const).map((dias) => (
            <Link
              key={dias}
              href={consulta(filtros, { dias })}
              aria-current={filtros.dias === dias ? "true" : undefined}
              className={cn("rounded-full px-3 py-1.5 text-sm", FOCO, filtros.dias === dias ? "bg-surface-dark text-on-dark" : "text-muted-foreground")}
            >
              {dias} dias
            </Link>
          ))}
        </fieldset>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Região
          <select name="regiao" defaultValue={filtros.regiao ?? ""} className={cn("rounded-full border border-border-light bg-card px-3 py-2 text-on-light", FOCO)}>
            <option value="">Todas</option>
            {painel.regioes.map((regiao) => (
              <option key={regiao} value={regiao}>
                {regiao}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Categoria
          <select name="categoria" defaultValue={filtros.categoria ?? ""} className={cn("rounded-full border border-border-light bg-card px-3 py-2 text-on-light", FOCO)}>
            <option value="">Todas</option>
            {painel.categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>
        {filtros.dias !== 30 ? <input type="hidden" name="dias" value={filtros.dias} /> : null}
        <button type="submit" className={cn("rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-on-dark", FOCO)}>
          Aplicar
        </button>
      </form>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card titulo="Interações" valor={painel.total.toLocaleString("pt-BR")} detalhe="Visualizações, favoritos, rotas e ingressos" />
        <Card titulo="Categoria em alta" valor={painel.categoriaEmAlta ?? "—"} />
        <Card
          titulo="Maior crescimento"
          valor={painel.maiorCrescimento?.categoria ?? "—"}
          detalhe={painel.maiorCrescimento ? percentual(painel.maiorCrescimento.variacao) : undefined}
        />
      </section>

      <section className="mt-8 rounded-card bg-card p-5 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-display">Ranking por impacto</h2>
        <p className="mt-1 text-sm text-muted-foreground">Visualização vale 1, favorito vale 3, como chegar e ingresso valem 5.</p>
        {painel.ranking.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma interação neste recorte.</p>
        ) : (
          <ol className="mt-4 grid gap-3">
            {painel.ranking.map((item, indice) => (
              <li key={item.eventoId} className="flex items-baseline justify-between gap-3 border-b border-border-light pb-3 last:border-0">
                <span>
                  <span className="mr-2 text-sm text-muted-foreground">{indice + 1}</span>
                  {item.titulo}
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {item.categoria} · {item.regiao}
                  </span>
                </span>
                <span className="font-display text-lg font-semibold tabular-nums">{item.indice}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8 rounded-card bg-card p-5 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-display">Crescimento por categoria</h2>
        {painel.crescimento.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sem série neste recorte.</p>
        ) : (
          <div className="mt-4">
            <GraficoCrescimento dados={painel.crescimento} />
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-display">Bairros por interesse</h2>
          {painel.bairrosInsuficientes || painel.bairros.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">dados insuficientes</p>
          ) : (
            <ol className="mt-4 grid gap-2">
              {painel.bairros.map((bairro) => (
                <li key={bairro.nome} className="flex justify-between gap-3 text-sm">
                  <span>{bairro.nome}</span>
                  <span className="tabular-nums text-muted-foreground">{bairro.indice}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-display">Perfil agregado</h2>
          <h3 className="mt-4 text-sm text-muted-foreground">Faixas etárias</h3>
          {painel.faixas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">dados insuficientes</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {painel.faixas.map((faixa) => (
                <li key={faixa.faixa} className="flex justify-between gap-3 text-sm">
                  <span>{faixa.rotulo}</span>
                  <span className="text-muted-foreground">{faixa.pessoas === "insuficiente" ? "dados insuficientes" : `${faixa.pessoas} pessoas`}</span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 text-sm text-muted-foreground">O mesmo público também curte</h3>
          {painel.tambemCurte === "insuficiente" ? (
            <p className="mt-2 text-sm text-muted-foreground">dados insuficientes</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {painel.tambemCurte.map((item) => (
                <li key={item.categoria} className="flex justify-between gap-3 text-sm">
                  <span>{item.categoria}</span>
                  <span className="text-muted-foreground">{item.pessoas} pessoas</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 grid gap-4">
        <h2 className="font-display text-xl font-semibold tracking-display">Oportunidades</h2>
        <p className="text-sm text-muted-foreground">Eventos com impacto e sem patrocinador ativo apontando para eles.</p>
        {painel.oportunidades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma oportunidade neste recorte.</p>
        ) : (
          <ul className="grid gap-4">
            {painel.oportunidades.map((item) => (
              <li key={item.eventoId} className="rounded-card bg-card p-5 shadow-card">
                <p className="font-display text-lg font-semibold">{item.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.categoria} · índice {item.indice}
                </p>
                <div className="mt-3">
                  <ContatoOrganizador eventoId={item.eventoId} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export const metadata: Metadata = { title: "Culturama Insights" };

export default async function InsightsPage({ searchParams }: { searchParams: { dias?: string; regiao?: string; categoria?: string } }) {
  const filtros = lerFiltros(searchParams);
  const painel = await montarPainel(filtros);
  return <Painel painel={painel} filtros={filtros} />;
}
