import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIAS_ARVORE } from "@/lib/categorias-dados";
import { labelRestricao } from "@/lib/eventos";
import { ClienteMapas, coletarInstancia, type ColetaInstancia } from "@/lib/mapas-culturais";
import { descreverRegiao, lerConfigMapas } from "@/lib/mapas-culturais-config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NOME_CATEGORIA = new Map<string, string>(CATEGORIAS_ARVORE.flatMap((m) => [[m.slug, m.nome], ...m.filhas.map((f) => [f.slug, f.nome] as [string, string])]));

/** Só em desenvolvimento: busca ao vivo na API e mostra como os eventos entrariam, sem gravar no banco. */
export default async function TesteMapasCulturaisPage({
  searchParams,
}: {
  searchParams: { instancia?: string; dias?: string; semRegiao?: string };
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const config = lerConfigMapas();
  const instancia = config.instancias.find((i) => i.url === searchParams.instancia) ?? config.instancias[0];
  const dias = Math.min(365, Math.max(1, Number(searchParams.dias) || config.dias));
  const semRegiao = searchParams.semRegiao === "1";
  const regiao = semRegiao ? { ufs: null, raio: null } : config.regiao;

  let coleta: ColetaInstancia | null = null;
  let falha: string | null = null;
  const inicio = Date.now();
  if (instancia) {
    try {
      coleta = await coletarInstancia(new ClienteMapas(instancia, config), { dias, regiao });
    } catch (erro) {
      falha = erro instanceof Error ? erro.message : String(erro);
    }
  }
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  const formato = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: instancia?.fuso });

  return (
    <main className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-xs text-muted-foreground">Teste local · nada é gravado no banco</p>
      <h1 className="mt-3 text-display">Importação do Mapas Culturais</h1>

      {config.instancias.length === 0 ? (
        <p className="mt-6 text-body-lg">Defina MAPAS_CULTURAIS_INSTANCIAS no .env.</p>
      ) : (
        <form className="mt-6 flex flex-wrap items-end gap-3 text-sm">
          <label className="grid gap-1">
            Instância
            <select name="instancia" defaultValue={instancia?.url} className="rounded-control border bg-card px-3 py-2">
              {config.instancias.map((i) => (
                <option key={i.url} value={i.url}>
                  {i.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            Próximos dias
            <input name="dias" type="number" min={1} max={365} defaultValue={dias} className="w-24 rounded-control border bg-card px-3 py-2" />
          </label>
          <label className="flex items-center gap-2 py-2">
            <input name="semRegiao" type="checkbox" value="1" defaultChecked={semRegiao} />
            Ignorar filtro de região ({descreverRegiao(config.regiao)})
          </label>
          <button type="submit" className="rounded-pill bg-accent-gradient px-4 py-2 font-medium text-on-dark">
            Buscar
          </button>
        </form>
      )}

      {falha ? (
        <p role="alert" className="mt-8 rounded-card bg-card p-6 text-danger shadow-card">
          {instancia?.nome} falhou: {falha}
        </p>
      ) : null}

      {coleta ? (
        <>
          <dl className="mt-8 grid gap-3 rounded-card bg-card p-6 text-sm shadow-card sm:grid-cols-5">
            <div>
              <dt className="text-muted-foreground">Ocorrências</dt>
              <dd className="text-body-lg tabular-nums">{coleta.ocorrencias}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Eventos normalizados</dt>
              <dd className="text-body-lg tabular-nums">{coleta.eventos.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fora da região ({descreverRegiao(regiao)})</dt>
              <dd className="text-body-lg tabular-nums">{coleta.foraDaRegiao}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sem coordenadas na fonte</dt>
              <dd className="text-body-lg tabular-nums">{coleta.eventos.filter((e) => e.latitude === null).length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tempo</dt>
              <dd className="text-body-lg tabular-nums">{segundos}s</dd>
            </div>
            {coleta.linguagensNaoMapeadas.length ? (
              <div className="sm:col-span-5">
                <dt className="text-muted-foreground">Linguagens sem mapeamento (iriam para Outros)</dt>
                <dd>{coleta.linguagensNaoMapeadas.join(", ")}</dd>
              </div>
            ) : null}
            {coleta.erros.length ? (
              <div className="sm:col-span-5">
                <dt className="text-muted-foreground">Erros (o resto seguiu)</dt>
                <dd className="text-danger">{coleta.erros.join(" · ")}</dd>
              </div>
            ) : null}
          </dl>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coleta.eventos.map((e) => (
              <li key={e.idExterno} className="overflow-hidden rounded-card bg-card shadow-card">
                <div className="aspect-[16/10] bg-muted">
                  {e.imagemCapa ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.imagemCapa} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex size-full items-end bg-surface-dark p-4">
                      <p className="font-display text-xl text-on-dark">{NOME_CATEGORIA.get(e.categoriaSlug)}</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-2 p-5">
                  <p className="text-caption text-muted-foreground">
                    via {instancia?.nome} · {NOME_CATEGORIA.get(e.categoriaSlug) ?? e.categoriaSlug} · {e.gratuito ? "Entrada franca" : "Pago"} ·{" "}
                    {labelRestricao(e.restricaoIdade)}
                  </p>
                  <h2 className="font-display text-lg font-semibold tracking-display">{e.titulo}</h2>
                  <p className="text-caption">
                    {formato.format(e.dataHora)}
                    {e.dataFim ? ` até ${formato.format(e.dataFim)}` : ""}
                  </p>
                  <p className={cn("text-caption", e.latitude === null ? "text-danger" : "text-muted-foreground")}>
                    {e.endereco}
                    {e.latitude === null ? " · sem coordenada (fora do mapa)" : ` · ${e.latitude.toFixed(4)}, ${e.longitude?.toFixed(4)}`}
                  </p>
                  {e.linguagens.length ? <p className="text-caption text-muted-foreground">{e.linguagens.join(" · ")}</p> : null}
                  {e.linkSaibaMais ? (
                    <p className="text-caption">
                      Fonte:{" "}
                      <a href={e.linkSaibaMais} target="_blank" rel="noreferrer" className="link-quiet">
                        {instancia?.nome}
                      </a>
                    </p>
                  ) : null}
                  <details className="text-caption">
                    <summary className="cursor-pointer text-muted-foreground">Ver como seria gravado</summary>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-control bg-muted p-3 text-[11px]">
                      {JSON.stringify({ ...e, fonte: "mapas_culturais", fonteInstancia: instancia?.url }, null, 2)}
                    </pre>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-12 text-caption text-muted-foreground">
        Esta página só existe em desenvolvimento. <Link href="/" className="link-quiet">Voltar ao início</Link>
      </p>
    </main>
  );
}
