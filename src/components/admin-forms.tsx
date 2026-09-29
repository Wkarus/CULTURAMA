"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { AdSlot, Event, Organizer, User } from "@prisma/client";
import type { FormState } from "@/actions/auth";
import { decidirOrganizador, moderarEvento, salvarAnuncio, alternarAnuncio } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { labelStatus } from "@/lib/eventos";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}

export function ModeracaoForm({ event }: { event: Event }) {
  const [state, action] = useFormState(moderarEvento, {} as FormState);

  return (
    <form action={action} className="grid gap-3 rounded-card bg-muted p-4">
      <input type="hidden" name="id" value={event.id} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm">Status e nota interna salvos.</p> : null}
      <p className="text-xs text-muted-foreground">Agora: {labelStatus(event.status)}</p>
      <div className="grid gap-1.5">
        <Label htmlFor={`status-${event.id}`}>Status público</Label>
        <select
          id={`status-${event.id}`}
          name="status"
          defaultValue={event.status}
          className="h-9 rounded-pill border border-input bg-card px-3 text-sm"
        >
          <option value="publicado">Publicado</option>
          <option value="adiado">Adiado</option>
          <option value="cancelado">Oculto / cancelado</option>
          <option value="rascunho">Rascunho</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`nota-${event.id}`}>Nota interna (nunca no site público)</Label>
        <textarea
          id={`nota-${event.id}`}
          name="notaAdmin"
          defaultValue={event.notaAdmin ?? ""}
          rows={3}
          className="w-full rounded-card border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      {event.fonte === "ticketmaster" ? (
        <p className="text-xs text-muted-foreground">Ticketmaster: só status e nota. O texto do evento não muda.</p>
      ) : null}
      <Submit label="Salvar moderação" />
    </form>
  );
}

export function OrganizadorDecisao({ organizer }: { organizer: Organizer & { user: User } }) {
  const [state, action] = useFormState(decidirOrganizador, {} as FormState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={organizer.id} />
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" name="decisao" value="aprovado">
        Aprovar
      </Button>
      <Button type="submit" name="decisao" value="rejeitado" variant="outline">
        Rejeitar
      </Button>
    </form>
  );
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AnuncioForm({ slot }: { slot?: AdSlot }) {
  const [state, action] = useFormState(salvarAnuncio, {} as FormState);

  return (
    <form action={action} className="grid gap-3">
      {slot ? <input type="hidden" name="id" value={slot.id} /> : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm">Anúncio salvo. Ele ainda não aparece no site (Fase 6).</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="tipo">Tipo</Label>
        <select id="tipo" name="tipo" defaultValue={slot?.tipo ?? "banner_home"} className="h-9 rounded-pill border border-input bg-card px-3 text-sm">
          <option value="banner_home">Banner da home</option>
          <option value="banner_categoria">Banner de categoria</option>
          <option value="destaque_evento">Destaque de evento</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="patrocinador">Patrocinador</Label>
        <Input id="patrocinador" name="patrocinador" required defaultValue={slot?.patrocinador} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="link">Link</Label>
        <Input id="link" name="link" type="url" required defaultValue={slot?.link} />
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="dataInicio">Início</Label>
          <Input id="dataInicio" name="dataInicio" type="datetime-local" required defaultValue={slot ? toLocalInput(slot.dataInicio) : ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dataFim">Fim</Label>
          <Input id="dataFim" name="dataFim" type="datetime-local" required defaultValue={slot ? toLocalInput(slot.dataFim) : ""} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ativo" value="true" defaultChecked={slot?.ativo ?? false} className="size-4 rounded border-input" />
        Ativo no período
      </label>
      <div className="grid gap-1.5">
        <Label htmlFor="imagem">Imagem {slot ? "(envie só se for trocar)" : ""}</Label>
        <Input id="imagem" name="imagem" type="file" accept="image/jpeg,image/png,image/webp" required={!slot} />
      </div>
      <Submit label={slot ? "Atualizar anúncio" : "Criar anúncio"} />
    </form>
  );
}

export function AlternarAnuncioButton({ id, ativo }: { id: string; ativo: boolean }) {
  return (
    <form
      action={async () => {
        await alternarAnuncio(id);
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        {ativo ? "Desativar" : "Ativar"}
      </Button>
    </form>
  );
}
