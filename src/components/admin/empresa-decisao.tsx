"use client";

import { useFormState } from "react-dom";
import { decidirEmpresa } from "@/actions/empresa";
import type { FormState } from "@/actions/auth";
import { botaoAdmin } from "@/components/admin/estilos";

export function EmpresaDecisao({ id }: { id: string }) {
  const [state, action] = useFormState(decidirEmpresa, {} as FormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state.error ? <p className="w-full text-sm text-danger">{state.error}</p> : null}
      <button type="submit" name="decisao" value="aprovado" className={botaoAdmin("primario", "sm")}>
        Aprovar
      </button>
      <button type="submit" name="decisao" value="rejeitado" className={botaoAdmin("perigo", "sm")}>
        Rejeitar
      </button>
    </form>
  );
}
