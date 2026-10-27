"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { cadastrarEmpresa } from "@/actions/empresa";
import type { FormState } from "@/actions/auth";
import { AvisoTopo, BotaoEnviar, CAMPO, Campo, CampoSenha, CartaoAuth } from "@/components/auth-forms";

/** Mesmo cartão escuro e mesmos campos do login, para a empresa não cair num formulário com outra cara. */
export function EmpresaForm({ reenvio = false }: { reenvio?: boolean }) {
  const [state, action] = useFormState(cadastrarEmpresa, {} as FormState);
  if (state.ok && state.aviso) {
    return (
      <CartaoAuth titulo="Pedido enviado">
        <p className="text-sm text-on-dark">{state.aviso}</p>
      </CartaoAuth>
    );
  }
  return (
    <CartaoAuth titulo={reenvio ? "Novo pedido de acesso" : "Pedir acesso"} subtitulo="Conta de empresa, com CNPJ. O painel abre depois da aprovação da equipe.">
      <form action={action} className="grid gap-5">
        <AvisoTopo texto={state.error} />
        <AvisoTopo texto={state.aviso} />
        <Campo id="nome" rotulo="Seu nome">
          {(a11y) => <input {...a11y} name="nome" autoComplete="name" required className={CAMPO} />}
        </Campo>
        <Campo id="email" rotulo="E-mail de trabalho">
          {(a11y) => <input {...a11y} name="email" type="email" autoComplete="email" spellCheck={false} required className={CAMPO} />}
        </Campo>
        <CampoSenha id="senha" autoComplete="new-password" minLength={8} dica="Mínimo de 8 caracteres." obrigatoria={!reenvio} />
        <Campo id="razaoSocial" rotulo="Razão social">
          {(a11y) => <input {...a11y} name="razaoSocial" autoComplete="organization" required className={CAMPO} />}
        </Campo>
        <Campo id="cnpj" rotulo="CNPJ">
          {(a11y) => <input {...a11y} name="cnpj" inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" required className={CAMPO} />}
        </Campo>
        <label className="flex items-start gap-3 text-sm text-muted-on-dark">
          <input type="checkbox" name="aceite" className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent-solid)]" required />
          <span>
            Li a{" "}
            <Link href="/privacidade" className="font-medium text-accent-hover underline-offset-4 hover:underline">
              Política de Privacidade
            </Link>
            . O painel mostra só dados agregados, sem nome de quem visitou.
          </span>
        </label>
        <BotaoEnviar rotulo={reenvio ? "Enviar novo pedido" : "Pedir acesso"} carregando="Enviando…" />
      </form>
    </CartaoAuth>
  );
}
