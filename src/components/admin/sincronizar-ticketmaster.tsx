"use client";

import { useFormState, useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { importarMapasCulturaisAgora, sincronizarTicketmasterAgora, type SyncState } from "@/actions/admin";
import { botaoAdmin } from "@/components/admin/estilos";
import { cn } from "@/lib/utils";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botaoAdmin("secundario")}>
      <RefreshCw className={cn(pending && "animate-spin motion-reduce:animate-none")} aria-hidden />
      {pending ? "Sincronizando…" : "Sincronizar agora"}
    </button>
  );
}

function Sincronizar({ acao }: { acao: () => Promise<SyncState> }) {
  const [state, action] = useFormState(acao, {} as SyncState);

  return (
    <form action={action} className="grid justify-items-start gap-2">
      <Botao />
      <p aria-live="polite" className="text-sm">
        {state.error ? <span className="text-danger">{state.error}</span> : null}
        {state.ok ? <span className="text-muted-on-dark">{state.importados} eventos atualizados.</span> : null}
      </p>
    </form>
  );
}

export function SincronizarTicketmaster() {
  return <Sincronizar acao={sincronizarTicketmasterAgora} />;
}

export function ImportarMapasCulturais() {
  return <Sincronizar acao={importarMapasCulturaisAgora} />;
}
