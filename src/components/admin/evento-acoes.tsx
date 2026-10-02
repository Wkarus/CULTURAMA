"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Dialog } from "@base-ui/react/dialog";
import { Eye, EyeOff, Pencil, Star, Trash2 } from "lucide-react";
import type { FormState } from "@/actions/auth";
import { alternarDestaque, alternarPublicacao, excluirEvento } from "@/actions/admin-eventos";
import { botaoAdmin, campoAdmin, focoAdmin } from "@/components/admin/estilos";
import { cn } from "@/lib/utils";

const iconeBotao = cn(
  "inline-flex size-8 items-center justify-center rounded-full text-muted-on-dark transition-colors hover:bg-[color-mix(in_srgb,var(--color-on-dark)_9%,transparent)] hover:text-on-dark disabled:opacity-40 [&_svg]:size-4",
  focoAdmin,
);

function BotaoExcluir() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botaoAdmin("perigo")}>
      {pending ? "Excluindo…" : "Excluir de vez"}
    </button>
  );
}

function ExcluirEvento({ id, titulo, ticketmaster }: { id: string; titulo: string; ticketmaster: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [state, action] = useFormState(excluirEvento, {} as FormState);

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto}>
      <Dialog.Trigger className={cn(iconeBotao, "hover:text-danger")} aria-label={`Excluir ${titulo}`} title="Excluir">
        <Trash2 aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--color-surface-dark)_75%,transparent)] backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="panel-dark fixed left-1/2 top-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-card p-6 text-on-dark shadow-card transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
          <Dialog.Title className="font-display text-xl font-semibold tracking-display">Excluir evento?</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-on-dark">
            <span className="text-on-dark">{titulo}</span> sai do banco com favoritos e comentários. Não dá para desfazer.
            {ticketmaster ? " Eventos da Ticketmaster voltam na próxima sincronização se ainda estiverem à venda; para tirar do ar, prefira despublicar." : ""}
          </Dialog.Description>
          <form action={action} className="grid gap-3">
            <input type="hidden" name="id" value={id} />
            <label className="grid gap-1.5 text-sm">
              Digite EXCLUIR para confirmar
              <input name="confirmacao" autoComplete="off" required className={campoAdmin} />
            </label>
            {state.error ? (
              <p role="alert" className="text-sm text-danger">
                {state.error}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Dialog.Close className={botaoAdmin("fantasma")}>Cancelar</Dialog.Close>
              <BotaoExcluir />
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function EventoAcoes({
  id,
  titulo,
  publicado,
  destaque,
  ticketmaster,
  podeExcluir,
}: {
  id: string;
  titulo: string;
  publicado: boolean;
  destaque: boolean;
  ticketmaster: boolean;
  podeExcluir: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const executar = (fn: () => Promise<FormState>) =>
    iniciar(async () => {
      const r = await fn();
      setErro(r.error ?? null);
    });

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={`/admin/eventos/${id}`} className={iconeBotao} aria-label={`Editar ${titulo}`} title={ticketmaster ? "Moderar" : "Editar"}>
        <Pencil aria-hidden />
      </Link>
      <button
        type="button"
        disabled={pendente}
        onClick={() => executar(() => alternarPublicacao(id))}
        className={iconeBotao}
        aria-label={`${publicado ? "Despublicar" : "Publicar"} ${titulo}`}
        title={publicado ? "Despublicar" : "Publicar"}
      >
        {publicado ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </button>
      <button
        type="button"
        disabled={pendente}
        onClick={() => executar(() => alternarDestaque(id))}
        className={cn(iconeBotao, destaque && "text-accent-hover")}
        aria-pressed={destaque}
        aria-label={`Destaque na home: ${titulo}`}
        title={destaque ? "Tirar destaque da home" : "Destacar na home"}
      >
        <Star className={cn(destaque && "fill-current")} aria-hidden />
      </button>
      {podeExcluir ? <ExcluirEvento id={id} titulo={titulo} ticketmaster={ticketmaster} /> : null}
      {erro ? (
        <span role="alert" className="ml-2 text-xs text-danger">
          {erro}
        </span>
      ) : null}
    </div>
  );
}
