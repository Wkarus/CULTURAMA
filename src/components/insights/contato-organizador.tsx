"use client";

import { useFormState, useFormStatus } from "react-dom";
import { contatarOrganizador } from "@/actions/insights";
import type { FormState } from "@/actions/auth";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent-gradient px-4 py-2 text-sm font-medium text-on-dark outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light disabled:opacity-60"
    >
      {pending ? "Enviando…" : "Contatar organizador"}
    </button>
  );
}

export function ContatoOrganizador({ eventoId }: { eventoId: string }) {
  const [state, action] = useFormState(contatarOrganizador, {} as FormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="eventoId" value={eventoId} />
      <Enviar />
      {state.ok ? <p className="text-sm text-success">Pedido enviado. O contato do organizador não aparece aqui.</p> : null}
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
