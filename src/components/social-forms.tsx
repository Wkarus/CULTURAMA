"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2, type LucideIcon } from "lucide-react";
import type { FormState } from "@/actions/auth";
import { comentarEvento, denunciarComentario, salvarInteresses, toggleFavorite } from "@/actions/social";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { montarArvore, normalizarInteresses, type CategoriaBase, type MaeComFilhas } from "@/lib/categorias-arvore";
import { iconeLucide } from "@/lib/perfil";
import { cn } from "@/lib/utils";

const FOCO_ESCURO =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando…" : label}
    </Button>
  );
}

export function FavoriteButton({ eventId, favorito }: { eventId: string; favorito: boolean }) {
  return (
    <form
      action={async () => {
        await toggleFavorite(eventId);
      }}
    >
      <Button type="submit" variant={favorito ? "default" : "outline"} className="w-full">
        {favorito ? "Nos favoritos" : "Favoritar"}
      </Button>
    </form>
  );
}

type EstadoChip = "marcado" | "incluido" | "livre";

function ChipInteresse({
  rotulo,
  icone: Icone,
  estado,
  sub = false,
  onAlternar,
  reduce,
}: {
  rotulo: string;
  icone: LucideIcon;
  estado: EstadoChip;
  sub?: boolean;
  onAlternar: () => void;
  reduce: boolean;
}) {
  const marcado = estado !== "livre";
  const tamanhoIcone = sub ? "size-4" : "size-5";
  return (
    <label className="cursor-pointer">
      <input type="checkbox" checked={marcado} onChange={onAlternar} className="peer sr-only" />
      <motion.span
        animate={{ scale: estado === "marcado" && !reduce ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className={cn(
          "inline-flex select-none items-center border font-medium transition-colors duration-200",
          sub ? "h-10 gap-2 rounded-sm px-3.5 text-sm" : "h-14 gap-2.5 rounded-control px-5 text-base",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-accent-hover peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-dark",
          estado === "marcado"
            ? "border-transparent bg-accent-gradient text-on-dark shadow-cta"
            : estado === "incluido"
              ? "border-[color-mix(in_srgb,var(--color-accent-hover-text)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent-to)_16%,transparent)] text-on-dark"
              : "border-[color-mix(in_srgb,var(--color-on-dark)_16%,transparent)] bg-transparent text-muted-on-dark hover:border-[color-mix(in_srgb,var(--color-on-dark)_32%,transparent)] hover:text-on-dark",
        )}
      >
        <Icone className={cn(tamanhoIcone, "shrink-0")} strokeWidth={1.75} aria-hidden />
        {rotulo}
        <AnimatePresence initial={false}>
          {marcado ? (
            <motion.span
              key="check"
              className="inline-flex overflow-hidden"
              initial={reduce ? false : { width: 0, opacity: 0, scale: 0.4 }}
              animate={{ width: "auto", opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { width: 0, opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              aria-hidden
            >
              <Check className={cn(tamanhoIcone, "shrink-0")} strokeWidth={2.25} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.span>
    </label>
  );
}

function BotaoSalvarInteresses({ mudou, salvo }: { mudou: boolean; salvo: boolean }) {
  const { pending } = useFormStatus();
  const mostrandoSalvo = salvo && !mudou && !pending;
  return (
    <button
      type="submit"
      disabled={pending || !mudou}
      className={cn(
        buttonVariants(),
        "h-12 gap-2 px-6 text-base font-medium disabled:opacity-50",
        mostrandoSalvo && "disabled:opacity-100",
        FOCO_ESCURO,
      )}
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
      {mostrandoSalvo ? <Check className="size-5" strokeWidth={2.25} aria-hidden /> : null}
      {pending ? "Salvando…" : mostrandoSalvo ? "Salvo!" : "Salvar interesses"}
    </button>
  );
}

export function InteressesForm({ categorias, selecionados }: { categorias: CategoriaBase[]; selecionados: string[] }) {
  const [state, action] = useFormState(salvarInteresses, {} as FormState);
  const reduce = !!useReducedMotion();
  const arvore = useMemo(() => montarArvore(categorias), [categorias]);
  const [marcados, setMarcados] = useState(() => normalizarInteresses(categorias, selecionados));
  const [salvos, setSalvos] = useState(marcados);
  const [salvo, setSalvo] = useState(false);
  const enviados = useRef<string[] | null>(null);

  useEffect(() => {
    if (!state.ok || !enviados.current) return;
    setSalvos(enviados.current);
    enviados.current = null;
    setSalvo(true);
    const id = window.setTimeout(() => setSalvo(false), 2000);
    return () => window.clearTimeout(id);
  }, [state]);

  const conjunto = new Set(marcados);
  const mudou = [...marcados].sort().join() !== [...salvos].sort().join();

  const aplicar = (mudar: (s: Set<string>) => void) => {
    const proximo = new Set(marcados);
    mudar(proximo);
    setMarcados(normalizarInteresses(categorias, Array.from(proximo)));
  };

  const alternarMae = (mae: MaeComFilhas<CategoriaBase>) =>
    aplicar((s) => {
      const tinha = s.has(mae.slug);
      s.delete(mae.slug);
      mae.filhas.forEach((f) => s.delete(f.slug));
      if (!tinha) s.add(mae.slug);
    });

  const alternarFilha = (mae: MaeComFilhas<CategoriaBase>, filha: CategoriaBase) =>
    aplicar((s) => {
      if (s.has(mae.slug)) {
        s.delete(mae.slug);
        mae.filhas.forEach((f) => f.id !== filha.id && s.add(f.slug));
      } else if (s.has(filha.slug)) {
        s.delete(filha.slug);
      } else {
        s.add(filha.slug);
      }
    });

  return (
    <form
      action={action}
      onSubmit={() => {
        enviados.current = marcados;
      }}
      className="grid gap-6"
    >
      {marcados.map((slug) => (
        <input key={slug} type="hidden" name="interesse" value={slug} />
      ))}
      <div className="grid gap-5">
        {arvore.map((mae) => {
          const maeMarcada = conjunto.has(mae.slug);
          return (
            <fieldset key={mae.id} className="flex flex-wrap items-center gap-2.5">
              <legend className="sr-only">{mae.nome} e subcategorias</legend>
              <ChipInteresse
                rotulo={mae.nome}
                icone={iconeLucide(mae.icone)}
                estado={maeMarcada ? "marcado" : "livre"}
                onAlternar={() => alternarMae(mae)}
                reduce={reduce}
              />
              {mae.filhas.map((filha) => (
                <ChipInteresse
                  key={filha.id}
                  sub
                  rotulo={filha.nome}
                  icone={iconeLucide(filha.icone)}
                  estado={maeMarcada ? "incluido" : conjunto.has(filha.slug) ? "marcado" : "livre"}
                  onAlternar={() => alternarFilha(mae, filha)}
                  reduce={reduce}
                />
              ))}
            </fieldset>
          );
        })}
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <BotaoSalvarInteresses mudou={mudou} salvo={salvo} />
        <p className="text-sm text-muted-on-dark">
          {marcados.length === 0 ? "Nenhum selecionado" : marcados.length === 1 ? "1 selecionado" : `${marcados.length} selecionados`}
        </p>
        <p className="sr-only" aria-live="polite">
          {salvo && !mudou ? "Interesses salvos." : ""}
        </p>
      </div>
    </form>
  );
}

export function ComentarioForm({ eventId }: { eventId: string }) {
  const [state, action] = useFormState(comentarEvento, {} as FormState);
  return (
    <form action={action} className="grid gap-3 rounded-card bg-card p-4 shadow-card">
      <input type="hidden" name="eventId" value={eventId} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="nota">Nota (1 a 5)</Label>
        <select id="nota" name="nota" defaultValue="5" className="h-9 rounded-pill border border-input bg-card px-3 text-sm">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="texto">Comentário</Label>
        <textarea id="texto" name="texto" required rows={3} className="w-full rounded-card border border-input bg-card px-3 py-2 text-sm" />
      </div>
      <Submit label="Publicar" />
    </form>
  );
}

export function DenunciaForm({ commentId }: { commentId: string }) {
  const [state, action] = useFormState(denunciarComentario, {} as FormState);
  return (
    <form action={action} className="mt-2 grid gap-2">
      <input type="hidden" name="commentId" value={commentId} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm">Denúncia enviada ao admin.</p> : null}
      <input
        name="motivo"
        required
        placeholder="Motivo da denúncia"
        className="h-9 rounded-pill border border-input bg-card px-3 text-sm"
      />
      <Button type="submit" variant="outline" size="sm">
        Denunciar
      </Button>
    </form>
  );
}
