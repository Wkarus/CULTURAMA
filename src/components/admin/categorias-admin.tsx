"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import type { FormState } from "@/actions/auth";
import { criarCategoria, editarCategoria, excluirCategoria, moverCategoria } from "@/actions/admin-categorias";
import { botaoAdmin, campoAdmin, focoAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { iconeLucide, NOMES_ICONES } from "@/lib/perfil";
import { cn } from "@/lib/utils";

const iconeBotao = cn(
  "inline-flex size-8 items-center justify-center rounded-full text-muted-on-dark transition-colors hover:bg-[color-mix(in_srgb,var(--color-on-dark)_9%,transparent)] hover:text-on-dark disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4",
  focoAdmin,
);

function SeletorIcone({ inicial }: { inicial: string }) {
  const [escolhido, setEscolhido] = useState(inicial);

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Ícone</legend>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
        {NOMES_ICONES.map((icone) => {
          const Icone = iconeLucide(icone);
          const marcado = escolhido === icone;
          return (
            <label
              key={icone}
              title={icone}
              className={cn(
                "flex aspect-square cursor-pointer items-center justify-center rounded-sm border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-hover",
                marcado
                  ? "border-[var(--color-accent-to)] bg-[color-mix(in_srgb,var(--color-accent-to)_20%,transparent)] text-on-dark"
                  : "border-transparent text-muted-on-dark hover:bg-[color-mix(in_srgb,var(--color-on-dark)_7%,transparent)] hover:text-on-dark",
              )}
            >
              <input
                type="radio"
                name="icone"
                value={icone}
                checked={marcado}
                onChange={() => setEscolhido(icone)}
                className="sr-only"
                aria-label={icone}
              />
              <Icone className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Enviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botaoAdmin("primario", "sm")}>
      {pending ? "Salvando…" : rotulo}
    </button>
  );
}

export function NovaCategoriaForm({ maes }: { maes: { id: string; nome: string }[] }) {
  const [state, action] = useFormState(criarCategoria, {} as FormState);
  const [chave, setChave] = useState(0);

  useEffect(() => {
    if (state.ok) setChave((k) => k + 1);
  }, [state]);

  return (
    <form key={chave} action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={rotuloAdmin}>
          Nome
          <input name="nome" required minLength={2} maxLength={40} className={campoAdmin} />
        </label>
        <label className={rotuloAdmin}>
          Dentro de
          <select name="parentId" defaultValue="" className={campoAdmin}>
            <option value="">Nenhuma (categoria principal)</option>
            {maes.map((mae) => (
              <option key={mae.id} value={mae.id}>
                {mae.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <SeletorIcone inicial="Sparkles" />
      <div className="flex flex-wrap items-center gap-3">
        <Enviar rotulo="Criar categoria" />
        <p aria-live="polite" className="text-sm">
          {state.error ? <span className="text-danger">{state.error}</span> : state.ok ? <span className="text-muted-on-dark">Categoria criada.</span> : null}
        </p>
      </div>
    </form>
  );
}

function EditarForm({ id, nome, icone, onFechar }: { id: string; nome: string; icone: string; onFechar: () => void }) {
  const [state, action] = useFormState(editarCategoria, {} as FormState);

  useEffect(() => {
    if (state.ok) onFechar();
  }, [state, onFechar]);

  return (
    <form action={action} className="grid gap-4 rounded-sm border border-[color-mix(in_srgb,var(--color-on-dark)_10%,transparent)] p-4">
      <input type="hidden" name="id" value={id} />
      <label className={rotuloAdmin}>
        Nome
        <input name="nome" required minLength={2} maxLength={40} defaultValue={nome} className={campoAdmin} autoFocus />
      </label>
      <SeletorIcone inicial={icone} />
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Enviar rotulo="Salvar" />
        <button type="button" onClick={onFechar} className={botaoAdmin("fantasma", "sm")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function CategoriaLinha({
  categoria,
  eventos,
  subcategorias,
  primeira,
  ultima,
  filha = false,
}: {
  categoria: { id: string; nome: string; slug: string; icone: string };
  eventos: number;
  subcategorias: number;
  primeira: boolean;
  ultima: boolean;
  filha?: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const Icone = iconeLucide(categoria.icone);
  const bloqueio = eventos > 0 ? `${eventos} ${eventos === 1 ? "evento usa" : "eventos usam"} esta categoria` : subcategorias > 0 ? "Tem subcategorias" : null;

  const executar = (fn: () => Promise<FormState>) =>
    iniciar(async () => {
      const r = await fn();
      setErro(r.error ?? null);
    });

  return (
    <div className={cn("grid gap-3", filha ? "py-2 pl-6 sm:pl-10" : "py-3")}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-sm",
            filha ? "size-8 text-muted-on-dark" : "chip-dark size-10 text-accent-hover",
          )}
          aria-hidden
        >
          <Icone className={filha ? "size-4" : "size-5"} strokeWidth={1.75} />
        </span>
        <div className="grid min-w-0 flex-1">
          <span className={cn("truncate", filha ? "text-sm" : "font-display text-base font-semibold tracking-display")}>{categoria.nome}</span>
          <span className="truncate text-xs text-muted-on-dark">
            {categoria.slug} · {eventos} {eventos === 1 ? "evento" : "eventos"}
            {!filha ? ` · ${subcategorias} ${subcategorias === 1 ? "subcategoria" : "subcategorias"}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={iconeBotao}
            disabled={primeira || pendente}
            onClick={() => executar(() => moverCategoria(categoria.id, "subir"))}
            aria-label={`Subir ${categoria.nome}`}
            title="Subir"
          >
            <ArrowUp aria-hidden />
          </button>
          <button
            type="button"
            className={iconeBotao}
            disabled={ultima || pendente}
            onClick={() => executar(() => moverCategoria(categoria.id, "descer"))}
            aria-label={`Descer ${categoria.nome}`}
            title="Descer"
          >
            <ArrowDown aria-hidden />
          </button>
          <button
            type="button"
            className={iconeBotao}
            onClick={() => setEditando((v) => !v)}
            aria-expanded={editando}
            aria-label={`Editar ${categoria.nome}`}
            title="Renomear ou trocar ícone"
          >
            <Pencil aria-hidden />
          </button>
          <button
            type="button"
            className={cn(iconeBotao, "hover:text-danger")}
            disabled={Boolean(bloqueio) || pendente}
            onClick={() => {
              if (window.confirm(`Excluir a categoria "${categoria.nome}"?`)) executar(() => excluirCategoria(categoria.id));
            }}
            aria-label={`Excluir ${categoria.nome}`}
            title={bloqueio ? `Não dá para excluir: ${bloqueio.toLowerCase()}` : "Excluir"}
          >
            <Trash2 aria-hidden />
          </button>
        </div>
      </div>
      {erro ? (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      ) : null}
      {editando ? <EditarForm id={categoria.id} nome={categoria.nome} icone={categoria.icone} onFechar={() => setEditando(false)} /> : null}
    </div>
  );
}
