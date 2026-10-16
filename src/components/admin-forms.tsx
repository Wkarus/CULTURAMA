"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { AdSlot, Event } from "@prisma/client";
import type { FormState } from "@/actions/auth";
import { moderarEvento, salvarAnuncio, alternarAnuncio } from "@/actions/admin";
import { areaAdmin, botaoAdmin, campoAdmin, dicaAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { labelStatus } from "@/lib/eventos";
import { cn } from "@/lib/utils";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botaoAdmin("primario")}>
      {pending ? "Salvando…" : label}
    </button>
  );
}

function Mensagem({ state, sucesso }: { state: FormState; sucesso: string }) {
  return (
    <p aria-live="polite" className="text-sm empty:hidden">
      {state.error ? <span className="text-danger">{state.error}</span> : state.ok ? <span className="text-muted-on-dark">{sucesso}</span> : null}
    </p>
  );
}

export function ModeracaoForm({ event }: { event: Event }) {
  const [state, action] = useFormState(moderarEvento, {} as FormState);

  return (
    <form action={action} className="grid gap-3 rounded-sm border border-[color-mix(in_srgb,var(--color-on-dark)_10%,transparent)] p-4">
      <input type="hidden" name="id" value={event.id} />
      <Mensagem state={state} sucesso="Status e nota interna salvos." />
      <p className={dicaAdmin}>Agora: {labelStatus(event.status)}</p>
      <label className={rotuloAdmin}>
        Status público
        <select name="status" defaultValue={event.status} className={campoAdmin}>
          <option value="publicado">Publicado</option>
          {event.fonte === "mapas_culturais" ? (
            <>
              <option value="importado">Importado (no ar, sem revisão)</option>
              <option value="inativo">Inativo</option>
            </>
          ) : null}
          <option value="em_revisao">Em revisão</option>
          <option value="adiado">Adiado</option>
          <option value="cancelado">Oculto / cancelado</option>
          <option value="rascunho">Rascunho</option>
        </select>
      </label>
      <label className={rotuloAdmin}>
        Nota interna (nunca no site público)
        <textarea name="notaAdmin" defaultValue={event.notaAdmin ?? ""} rows={3} className={areaAdmin} />
      </label>
      {event.fonte === "ticketmaster" ? <p className={dicaAdmin}>Ticketmaster: só status e nota. O texto do evento não muda.</p> : null}
      {event.fonte === "mapas_culturais" ? (
        <p className={dicaAdmin}>
          Mapas Culturais: oculto, rascunho, adiado e em revisão são respeitados pela importação. Importado, publicado e inativo ela
          atualiza sozinha conforme a fonte.
        </p>
      ) : null}
      <Submit label="Salvar moderação" />
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
    <form action={action} className="grid gap-4">
      {slot ? <input type="hidden" name="id" value={slot.id} /> : null}
      <Mensagem state={state} sucesso="Anúncio salvo. Banner da home entra no ar quando estiver ativo e dentro do período." />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={rotuloAdmin}>
          Tipo
          <select name="tipo" defaultValue={slot?.tipo ?? "banner_home"} className={campoAdmin}>
            <option value="banner_home">Banner da home</option>
            <option value="banner_categoria">Banner de categoria</option>
            <option value="destaque_evento">Destaque de evento</option>
          </select>
        </label>
        <label className={rotuloAdmin}>
          Patrocinador
          <input name="patrocinador" required defaultValue={slot?.patrocinador} className={campoAdmin} />
        </label>
      </div>
      <label className={rotuloAdmin}>
        Link
        <input name="link" type="url" required defaultValue={slot?.link} className={campoAdmin} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={rotuloAdmin}>
          Início
          <input name="dataInicio" type="datetime-local" required defaultValue={slot ? toLocalInput(slot.dataInicio) : ""} className={campoAdmin} />
        </label>
        <label className={rotuloAdmin}>
          Fim
          <input name="dataFim" type="datetime-local" required defaultValue={slot ? toLocalInput(slot.dataFim) : ""} className={campoAdmin} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ativo" value="true" defaultChecked={slot?.ativo ?? false} className="size-4 accent-[var(--color-accent-to)]" />
        Ativo no período
      </label>
      <label className={rotuloAdmin}>
        <span>
          Imagem {slot ? <span className={dicaAdmin}>(envie só se for trocar)</span> : null}
        </span>
        <input
          name="imagem"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={!slot}
          className={cn(campoAdmin, "py-2 file:mr-3 file:rounded-pill file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-accent-hover")}
        />
      </label>
      <div>
        <Submit label={slot ? "Atualizar anúncio" : "Criar anúncio"} />
      </div>
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
      <button type="submit" className={botaoAdmin("secundario", "sm")}>
        {ativo ? "Desativar" : "Ativar"}
      </button>
    </form>
  );
}
