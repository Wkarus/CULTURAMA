"use client";

import { useId } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Check, MessageSquareReply, X } from "lucide-react";
import type { FormState } from "@/actions/auth";
import { revisarEvento } from "@/actions/admin-eventos";
import { areaAdmin, botaoAdmin, dicaAdmin, rotuloAdmin } from "@/components/admin/estilos";

function Botoes() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-2">
      <button type="submit" name="decisao" value="aprovar" disabled={pending} className={botaoAdmin("primario", "sm")}>
        <Check aria-hidden />
        Aprovar e publicar
      </button>
      <button type="submit" name="decisao" value="ajuste" disabled={pending} className={botaoAdmin("secundario", "sm")}>
        <MessageSquareReply aria-hidden />
        Pedir ajuste
      </button>
      <button type="submit" name="decisao" value="recusar" disabled={pending} className={botaoAdmin("perigo", "sm")}>
        <X aria-hidden />
        Recusar
      </button>
    </div>
  );
}

export function RevisaoAcoes({ eventoId }: { eventoId: string }) {
  const [state, action] = useFormState(revisarEvento, {} as FormState);
  const id = useId();

  if (state.ok) {
    return <p className="chip-dark rounded-sm px-4 py-3 text-sm" role="status">Decisão registrada. O organizador já vê o resultado em Meus eventos.</p>;
  }

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={eventoId} />
      <label htmlFor={id} className={rotuloAdmin}>
        <span>
          Mensagem ao organizador <span className={dicaAdmin}>(obrigatória para recusar ou pedir ajuste)</span>
        </span>
      </label>
      <textarea id={id} name="mensagem" rows={3} maxLength={1000} className={areaAdmin} placeholder="Ex.: a capa está cortada, envie uma imagem horizontal." />
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Botoes />
    </form>
  );
}
