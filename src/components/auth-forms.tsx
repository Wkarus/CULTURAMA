"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { cadastrarUsuario, completarPerfil, loginGoogle, loginUsuario, type FormState } from "@/actions/auth";
import { cadastrarOrganizador } from "@/actions/organizador";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Enviando…" : children}
    </Button>
  );
}

function FieldError({ state }: { state: FormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function CadastroForm() {
  const [state, action] = useFormState(cadastrarUsuario, {});

  return (
    <form action={action} className="grid gap-4">
      <FieldError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" required autoComplete="name" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="dataNascimento">Data de nascimento</Label>
        <Input id="dataNascimento" name="dataNascimento" type="date" required />
        <p className="text-xs text-muted-foreground">Cadastro só para maiores de 18 anos.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input id="aceite" name="aceite" type="checkbox" required className="mt-1 size-4" />
        <span>
          Li e aceito a{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      <SubmitButton>Criar conta</SubmitButton>
    </form>
  );
}

export function LoginForm({ callbackUrl, googleErro }: { callbackUrl: string; googleErro?: boolean }) {
  const [state, action] = useFormState(loginUsuario, {});

  return (
    <div className="grid gap-4">
      {googleErro ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Login com Google ainda não está configurado. Coloque AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET no .env.
        </p>
      ) : null}
      <form action={action} className="grid gap-4">
        <FieldError state={state} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <SubmitButton>Entrar</SubmitButton>
      </form>
      <form action={loginGoogle}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit" variant="outline" className="w-full">
          Continuar com Google
        </Button>
      </form>
    </div>
  );
}

export function CompletarPerfilForm() {
  const [state, action] = useFormState(completarPerfil, {});

  return (
    <form action={action} className="grid gap-4">
      <FieldError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="dataNascimento">Data de nascimento</Label>
        <Input id="dataNascimento" name="dataNascimento" type="date" required />
        <p className="text-xs text-muted-foreground">Cadastro só para maiores de 18 anos.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input id="aceite" name="aceite" type="checkbox" required className="mt-1 size-4" />
        <span>
          Li e aceito a{" "}
          <Link href="/privacidade" className="underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      <SubmitButton>Salvar e continuar</SubmitButton>
    </form>
  );
}

export function OrganizadorForm() {
  const [state, action] = useFormState(cadastrarOrganizador, {});

  if (state.ok) {
    return (
      <p className="rounded-md border bg-muted px-3 py-2 text-sm">
        Cadastro enviado. Seu status é <strong>pendente</strong> — a aprovação manual entra no painel admin (Fase 4).
        Você já consegue entrar, mas ainda não poderá publicar eventos.
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <FieldError state={state} />
      <div className="grid gap-1.5">
        <Label htmlFor="nomeEmpresa">Nome da empresa ou coletivo</Label>
        <Input id="nomeEmpresa" name="nomeEmpresa" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tipoDocumento">Tipo de documento</Label>
        <select
          id="tipoDocumento"
          name="tipoDocumento"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="CNPJ">CNPJ (validação automática)</option>
          <option value="CPF">CPF (dígito verificador + fila manual)</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="documento">Número do documento</Label>
        <Input id="documento" name="documento" required placeholder="Somente números ou com pontuação" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="documentoArquivo">Arquivo do documento (PDF ou imagem)</Label>
        <Input id="documentoArquivo" name="documentoArquivo" type="file" required accept=".pdf,image/jpeg,image/png,image/webp" />
      </div>
      <SubmitButton>Enviar para verificação</SubmitButton>
    </form>
  );
}
