"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/actions/auth";
import { resolverDenuncia } from "@/actions/admin-denuncias";
import { botaoAdmin } from "@/components/admin/estilos";
import type { ResolucaoDenuncia } from "@/lib/denuncias";

const TEXTOS: Record<ResolucaoDenuncia, { texto: string; variante: "fantasma" | "perigo" }> = {
  descartar: { texto: "Descartar", variante: "fantasma" },
  despublicar: { texto: "Despublicar evento", variante: "perigo" },
  remover_comentario: { texto: "Remover comentário", variante: "perigo" },
};

function Botao({ resolucao }: { resolucao: ResolucaoDenuncia }) {
  const { pending, data } = useFormStatus();
  const esta = data?.get("resolucao") === resolucao;
  const { texto, variante } = TEXTOS[resolucao];
  return (
    <button type="submit" name="resolucao" value={resolucao} disabled={pending} className={botaoAdmin(variante, "sm")}>
      {pending && esta ? "Salvando…" : texto}
    </button>
  );
}

export function DenunciaAcoes({ id, opcoes }: { id: string; opcoes: ResolucaoDenuncia[] }) {
  const [state, action] = useFormState(resolverDenuncia, {} as FormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {opcoes.map((resolucao) => (
        <Botao key={resolucao} resolucao={resolucao} />
      ))}
      {state.error ? (
        <span role="alert" className="text-xs text-danger">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
