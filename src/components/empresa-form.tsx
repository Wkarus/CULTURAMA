"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { cadastrarEmpresa } from "@/actions/empresa";
import type { FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmpresaForm({ reenvio = false }: { reenvio?: boolean }) {
  const [state, action] = useFormState(cadastrarEmpresa, {} as FormState);
  if (state.ok && state.aviso) {
    return <p className="rounded-card bg-muted px-4 py-3 text-sm text-foreground">{state.aviso}</p>;
  }
  return (
    <form action={action} className="grid gap-4">
      {state.error ? (
        <p role="alert" className="rounded-card bg-warning-bg px-3 py-2 text-sm text-warning">
          {state.error}
        </p>
      ) : null}
      {state.aviso ? (
        <p role="status" className="rounded-card bg-warning-bg px-3 py-2 text-sm text-warning">
          {state.aviso}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="nome">Seu nome</Label>
        <Input id="nome" name="nome" autoComplete="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail de trabalho</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required={!reenvio} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="razaoSocial">Razão social</Label>
        <Input id="razaoSocial" name="razaoSocial" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input id="cnpj" name="cnpj" inputMode="numeric" autoComplete="off" required />
      </div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="aceite" className="mt-1" required />
        <span>
          Li a <Link href="/privacidade" className="link-quiet">Política de Privacidade</Link>. O painel mostra só dados agregados.
        </span>
      </label>
      <Button type="submit" className="w-full">
        {reenvio ? "Enviar novo pedido" : "Pedir acesso"}
      </Button>
    </form>
  );
}
