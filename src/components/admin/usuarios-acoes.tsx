"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Dialog } from "@base-ui/react/dialog";
import type { FormState } from "@/actions/auth";
import {
  alternarSuspensaoOrganizador,
  alternarSuspensaoUsuario,
  excluirContaEDados,
  mudarPapel,
} from "@/actions/admin-usuarios";
import { botaoAdmin, campoAdmin } from "@/components/admin/estilos";

type Acao = (prev: FormState, formData: FormData) => Promise<FormState>;

function Enviar({ texto, enviando, variante }: { texto: string; enviando: string; variante: "secundario" | "perigo" | "fantasma" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botaoAdmin(variante, "sm")}>
      {pending ? enviando : texto}
    </button>
  );
}

function FormAcao({
  acao,
  campos,
  texto,
  enviando,
  variante = "secundario",
}: {
  acao: Acao;
  campos: Record<string, string>;
  texto: string;
  enviando: string;
  variante?: "secundario" | "perigo" | "fantasma";
}) {
  const [state, action] = useFormState(acao, {} as FormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {Object.entries(campos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Enviar texto={texto} enviando={enviando} variante={variante} />
      {state.error ? (
        <span role="alert" className="text-xs text-danger">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

export function SuspenderOrganizador({ id, suspenso }: { id: string; suspenso: boolean }) {
  return (
    <FormAcao
      acao={alternarSuspensaoOrganizador}
      campos={{ id }}
      texto={suspenso ? "Reativar organizador" : "Suspender organizador"}
      enviando={suspenso ? "Reativando…" : "Suspendendo…"}
      variante={suspenso ? "secundario" : "perigo"}
    />
  );
}

export function SuspenderUsuario({ id, suspenso }: { id: string; suspenso: boolean }) {
  return (
    <FormAcao
      acao={alternarSuspensaoUsuario}
      campos={{ id }}
      texto={suspenso ? "Reativar" : "Suspender"}
      enviando={suspenso ? "Reativando…" : "Suspendendo…"}
      variante={suspenso ? "secundario" : "fantasma"}
    />
  );
}

export function MudarPapel({ id, moderador }: { id: string; moderador: boolean }) {
  return (
    <FormAcao
      acao={mudarPapel}
      campos={{ id, papel: moderador ? "remover" : "moderador" }}
      texto={moderador ? "Remover moderação" : "Tornar moderador"}
      enviando="Salvando…"
      variante={moderador ? "fantasma" : "secundario"}
    />
  );
}

function BotaoExcluir() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={botaoAdmin("perigo")}>
      {pending ? "Excluindo…" : "Excluir conta e dados"}
    </button>
  );
}

export function ExcluirConta({ id, nome, email, eventos }: {
  id: string;
  nome: string;
  email: string;
  /** `null` quando a conta não tem cadastro de organizador. */
  eventos: number | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, action] = useFormState(excluirContaEDados, {} as FormState);

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto}>
      <Dialog.Trigger className={botaoAdmin("fantasma", "sm")}>
        <span className="text-danger">Excluir conta e dados</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--color-surface-dark)_75%,transparent)] backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="panel-dark fixed left-1/2 top-1/2 z-50 grid w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-card p-6 text-on-dark shadow-card transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
          <Dialog.Title className="font-display text-xl font-semibold tracking-display">Excluir conta e dados?</Dialog.Title>
          <Dialog.Description className="grid gap-2 text-sm text-muted-on-dark">
            <span>
              Pedido de exclusão (LGPD) de <span className="text-on-dark">{nome}</span>. Sai tudo: conta, favoritos,
              comentários, denúncias feitas
              {eventos === null
                ? ""
                : `, cadastro de organizador, documento enviado e ${eventos} ${eventos === 1 ? "evento" : "eventos"} com as capas`}
              .
            </span>
            <span>Não dá para desfazer. O histórico guarda só que a exclusão aconteceu, sem o e-mail.</span>
          </Dialog.Description>
          <form action={action} className="grid gap-3">
            <input type="hidden" name="id" value={id} />
            <label className="grid gap-1.5 text-sm">
              Digite o e-mail da conta para confirmar
              <span className="select-all text-xs text-muted-on-dark">{email}</span>
              <input name="confirmacao" type="email" autoComplete="off" required className={campoAdmin} />
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
