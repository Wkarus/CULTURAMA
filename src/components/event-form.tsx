"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Category, Event } from "@prisma/client";
import type { FormState } from "@/actions/auth";
import { salvarEvento } from "@/actions/eventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RESTRICOES } from "@/lib/eventos";

function Actions({ podePublicar }: { podePublicar: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" name="intencao" value="rascunho" variant="outline" disabled={pending}>
        Salvar rascunho
      </Button>
      <Button type="submit" name="intencao" value="publicar" disabled={pending || !podePublicar}>
        {pending ? "Salvando…" : "Publicar"}
      </Button>
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
  podePublicar,
}: {
  categorias: Category[];
  evento?: Event;
  podePublicar: boolean;
}) {
  const [state, action] = useFormState(salvarEvento, {} as FormState);

  if (state.ok) {
    return <p className="rounded-card bg-muted px-4 py-3 text-sm">Evento salvo. Veja em Meus eventos ou na listagem pública se estiver publicado.</p>;
  }

  return (
    <form action={action} className="grid gap-4">
      {evento ? <input type="hidden" name="id" value={evento.id} /> : null}
      {state.error ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {!podePublicar ? (
        <p className="text-sm text-muted-foreground">Verificação pendente: você pode salvar rascunho, mas ainda não publicar.</p>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" required defaultValue={evento?.titulo} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <textarea
          id="descricao"
          name="descricao"
          required
          defaultValue={evento?.descricao}
          rows={5}
          className="w-full rounded-card border border-input bg-card px-3 py-2 text-base tracking-shop"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="categoriaId">Categoria</Label>
        <select
          id="categoriaId"
          name="categoriaId"
          required
          defaultValue={evento?.categoriaId ?? ""}
          className="h-9 rounded-pill border border-input bg-card px-3 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="dataHora">Data e hora</Label>
        <Input id="dataHora" name="dataHora" type="datetime-local" required defaultValue={evento ? toLocalInput(evento.dataHora) : ""} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="endereco">Endereço (rua, número, cidade)</Label>
        <Input id="endereco" name="endereco" required defaultValue={evento?.endereco} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="restricaoIdade">Restrição de idade</Label>
        <select
          id="restricaoIdade"
          name="restricaoIdade"
          defaultValue={evento?.restricaoIdade ?? "livre"}
          className="h-9 rounded-pill border border-input bg-card px-3 text-sm"
        >
          {RESTRICOES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" name="tags" defaultValue={evento?.tags.join(", ")} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="linkSaibaMais">Link saiba mais</Label>
        <Input id="linkSaibaMais" name="linkSaibaMais" type="url" defaultValue={evento?.linkSaibaMais ?? ""} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="linkIngresso">Link de ingresso (opcional)</Label>
        <Input id="linkIngresso" name="linkIngresso" type="url" defaultValue={evento?.linkIngresso ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="gratuito" value="true" defaultChecked={evento?.gratuito} className="size-4 rounded border-input" />
        Entrada gratuita
      </label>
      <div className="grid gap-1.5">
        <Label htmlFor="imagemCapa">Imagem de capa</Label>
        <Input id="imagemCapa" name="imagemCapa" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <Actions podePublicar={podePublicar} />
    </form>
  );
}
