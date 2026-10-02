"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Category, Event } from "@prisma/client";
import { montarArvore } from "@/lib/categorias-arvore";
import type { FormState } from "@/actions/auth";
import { salvarEvento } from "@/actions/eventos";
import { areaAdmin, botaoAdmin, campoAdmin } from "@/components/admin/estilos";
import { PinoMapa } from "@/components/pino-mapa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RESTRICOES } from "@/lib/eventos";
import { hasValidCoords } from "@/lib/geo";
import { cn } from "@/lib/utils";

export type IntencaoEvento = "rascunho" | "publicar" | "revisao";

const ROTULOS: Record<IntencaoEvento, string> = {
  rascunho: "Salvar rascunho",
  publicar: "Publicar",
  revisao: "Enviar para revisão",
};

type Acao = (prev: FormState, formData: FormData) => Promise<FormState>;

function Actions({ intencoes, escuro }: { intencoes: IntencaoEvento[]; escuro: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      {intencoes.map((intencao) => {
        const principal = intencao !== "rascunho";
        const rotulo = pending && principal ? "Salvando…" : ROTULOS[intencao];
        return escuro ? (
          <button
            key={intencao}
            type="submit"
            name="intencao"
            value={intencao}
            disabled={pending}
            className={botaoAdmin(principal ? "primario" : "secundario")}
          >
            {rotulo}
          </button>
        ) : (
          <Button key={intencao} type="submit" name="intencao" value={intencao} variant={principal ? "default" : "outline"} disabled={pending}>
            {rotulo}
          </Button>
        );
      })}
    </div>
  );
}

function estilos(escuro: boolean) {
  return {
    select: escuro ? campoAdmin : "h-9 rounded-pill border border-input bg-card px-3 text-sm disabled:opacity-50",
    area: escuro ? areaAdmin : "w-full rounded-card border border-input bg-card px-3 py-2 text-base tracking-shop",
    input: escuro ? campoAdmin : "",
    rotulo: escuro ? "text-on-dark" : "",
  };
}

function Campo({ id, rotulo, escuro, children }: { id: string; rotulo: string; escuro: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className={estilos(escuro).rotulo}>
        {rotulo}
      </Label>
      {children}
    </div>
  );
}

function Entrada({ escuro, ...props }: React.ComponentProps<"input"> & { escuro: boolean }) {
  return escuro ? <input {...props} className={campoAdmin} /> : <Input {...props} />;
}

/** Mãe e subcategoria. Envia `categoriaId` com a subcategoria, ou a mãe quando não há subcategoria escolhida. */
function SelectCategoria({ categorias, inicial, escuro }: { categorias: Category[]; inicial: string | null; escuro: boolean }) {
  const arvore = useMemo(() => montarArvore(categorias), [categorias]);
  const atual = categorias.find((c) => c.id === inicial);
  const [maeId, setMaeId] = useState(atual ? (atual.parentId ?? atual.id) : "");
  const [subId, setSubId] = useState(atual?.parentId ? atual.id : "");
  const mae = arvore.find((m) => m.id === maeId);
  const { select } = estilos(escuro);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo id="categoriaMae" rotulo="Categoria" escuro={escuro}>
        <select
          id="categoriaMae"
          required
          value={maeId}
          onChange={(e) => {
            setMaeId(e.target.value);
            setSubId("");
          }}
          className={select}
        >
          <option value="" disabled>
            Selecione
          </option>
          {arvore.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="categoriaSub" rotulo="Subcategoria" escuro={escuro}>
        <select
          id="categoriaSub"
          value={subId}
          onChange={(e) => setSubId(e.target.value)}
          disabled={!mae || mae.filhas.length === 0}
          className={select}
        >
          <option value="">{mae ? `Outro em ${mae.nome}` : "Escolha a categoria antes"}</option>
          {mae?.filhas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </Campo>
      <input type="hidden" name="categoriaId" value={subId || maeId} />
    </div>
  );
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventForm({
  categorias,
  evento,
  intencoes,
  aviso,
  acao = salvarEvento,
  escuro = false,
  sucesso = "Evento salvo. Veja em Meus eventos ou na listagem pública se estiver publicado.",
}: {
  categorias: Category[];
  evento?: Event;
  intencoes: IntencaoEvento[];
  aviso?: string;
  acao?: Acao;
  escuro?: boolean;
  sucesso?: string;
}) {
  const [state, action] = useFormState(acao, {} as FormState);
  const css = estilos(escuro);

  if (state.ok) {
    return (
      <p role="status" className={cn("rounded-card px-4 py-3 text-sm", escuro ? "chip-dark" : "bg-muted")}>
        {sucesso}
      </p>
    );
  }

  const coords = evento && hasValidCoords(evento.latitude, evento.longitude) ? { lat: evento.latitude, lng: evento.longitude } : null;

  return (
    <form action={action} className="grid gap-4">
      {evento ? <input type="hidden" name="id" value={evento.id} /> : null}
      {state.error ? (
        <p
          role="alert"
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            escuro
              ? "border-[color-mix(in_srgb,var(--color-danger-fg)_40%,transparent)] text-danger"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {state.error}
        </p>
      ) : null}
      {aviso ? <p className={cn("text-sm", escuro ? "text-muted-on-dark" : "text-muted-foreground")}>{aviso}</p> : null}

      <Campo id="titulo" rotulo="Título" escuro={escuro}>
        <Entrada escuro={escuro} id="titulo" name="titulo" required defaultValue={evento?.titulo} />
      </Campo>
      <Campo id="descricao" rotulo="Descrição" escuro={escuro}>
        <textarea id="descricao" name="descricao" required defaultValue={evento?.descricao} rows={5} className={css.area} />
      </Campo>
      <SelectCategoria categorias={categorias} inicial={evento?.categoriaId ?? null} escuro={escuro} />
      <Campo id="dataHora" rotulo="Data e hora" escuro={escuro}>
        <Entrada
          escuro={escuro}
          id="dataHora"
          name="dataHora"
          type="datetime-local"
          required
          defaultValue={evento ? toLocalInput(evento.dataHora) : ""}
        />
      </Campo>
      <Campo id="endereco" rotulo="Endereço (rua, número, cidade)" escuro={escuro}>
        <Entrada escuro={escuro} id="endereco" name="endereco" required defaultValue={evento?.endereco} />
      </Campo>
      <PinoMapa inicial={coords} enderecoId="endereco" escuro={escuro} />
      <Campo id="restricaoIdade" rotulo="Restrição de idade" escuro={escuro}>
        <select id="restricaoIdade" name="restricaoIdade" defaultValue={evento?.restricaoIdade ?? "livre"} className={css.select}>
          {RESTRICOES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="tags" rotulo="Tags (separadas por vírgula)" escuro={escuro}>
        <Entrada escuro={escuro} id="tags" name="tags" defaultValue={evento?.tags.join(", ")} />
      </Campo>
      <Campo id="linkSaibaMais" rotulo="Link saiba mais" escuro={escuro}>
        <Entrada escuro={escuro} id="linkSaibaMais" name="linkSaibaMais" type="url" defaultValue={evento?.linkSaibaMais ?? ""} />
      </Campo>
      <Campo id="linkIngresso" rotulo="Link de ingresso (opcional)" escuro={escuro}>
        <Entrada escuro={escuro} id="linkIngresso" name="linkIngresso" type="url" defaultValue={evento?.linkIngresso ?? ""} />
      </Campo>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="gratuito"
          value="true"
          defaultChecked={evento?.gratuito}
          className={cn("size-4 rounded", escuro ? "accent-[var(--color-accent-to)]" : "border-input")}
        />
        Entrada gratuita
      </label>
      <Campo id="imagemCapa" rotulo={evento?.imagemCapa ? "Imagem de capa (envie só se for trocar)" : "Imagem de capa"} escuro={escuro}>
        <Entrada
          escuro={escuro}
          id="imagemCapa"
          name="imagemCapa"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
      </Campo>
      <Actions intencoes={intencoes} escuro={escuro} />
    </form>
  );
}
