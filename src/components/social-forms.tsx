"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/actions/auth";
import { comentarEvento, denunciarComentario, salvarInteresses, toggleFavorite } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

export function InteressesForm({ categorias, selecionados }: { categorias: { id: string; nome: string }[]; selecionados: string[] }) {
  const [state, action] = useFormState(salvarInteresses, {} as FormState);
  return (
    <form action={action} className="grid gap-3">
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm">Interesses salvos. A lista de eventos prioriza o que combina.</p> : null}
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Categorias que te interessam</legend>
        {categorias.map((cat) => (
          <label key={cat.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="interesse"
              value={cat.nome}
              defaultChecked={selecionados.includes(cat.nome)}
              className="size-4 rounded border-input"
            />
            {cat.nome}
          </label>
        ))}
      </fieldset>
      <Submit label="Salvar interesses" />
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
