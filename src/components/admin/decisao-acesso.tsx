"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { reabrirPedido } from "@/actions/admin";
import type { FormState } from "@/actions/auth";
import { botaoAdmin, campoAdmin, rotuloAdmin } from "@/components/admin/estilos";
import { MOTIVOS_MANUAIS } from "@/lib/pedido-acesso";

export function DecisaoAcesso({
  id,
  acao,
}: {
  id: string;
  acao: (estado: FormState, dados: FormData) => Promise<FormState>;
}) {
  const [state, action] = useFormState(acao, {} as FormState);
  const [recusando, setRecusando] = useState(false);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" name="decisao" value="aprovado" formNoValidate className={botaoAdmin("primario", "sm")}>
          Aprovar
        </button>
        <button type="button" className={botaoAdmin("perigo", "sm")} onClick={() => setRecusando((aberto) => !aberto)}>
          Recusar
        </button>
      </div>
      {recusando ? (
        <div className="grid max-w-md gap-3">
          <label className={rotuloAdmin}>
            Motivo
            <select name="motivo" required className={campoAdmin} defaultValue="">
              <option value="" disabled>
                Escolha um motivo
              </option>
              {MOTIVOS_MANUAIS.map((item) => (
                <option key={item.codigo} value={item.codigo}>
                  {item.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className={rotuloAdmin}>
            Comentário
            <span className="font-normal text-muted-on-dark"> opcional</span>
            <textarea name="motivoTexto" rows={3} className={campoAdmin} />
          </label>
          <button type="submit" name="decisao" value="rejeitado" className={botaoAdmin("perigo", "sm")}>
            Confirmar recusa
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function ReabrirPedido({ id, tipo }: { id: string; tipo: "organizador" | "empresa" }) {
  const [state, action] = useFormState(reabrirPedido, {} as FormState);
  return (
    <form action={action}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="id" value={id} />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" className={botaoAdmin("secundario", "sm")}>
        Voltar para em análise
      </button>
    </form>
  );
}
