"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { cadastrarUsuario, completarPerfil, loginGoogle, loginUsuario, type FormState } from "@/actions/auth";
import { cadastrarOrganizador } from "@/actions/organizador";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function SubmitButton({ children }: { children: ReactNode }) {
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
    <p role="alert" className="rounded-card bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </p>
  );
}

const SENHA_MINIMA = 8;
const CAMPO = "auth-field h-12 w-full rounded-control px-4 text-base";
const FOCO_ESCURO =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

/** Trecho da mensagem da server action → campo onde ela aparece. O que não casar vai para o topo do formulário. */
type MapaErros = [trecho: string, campo: string][];

const ERROS_CADASTRO: MapaErros = [
  ["A senha precisa", "senha"],
  ["Política de Privacidade", "aceite"],
  ["data de nascimento", "dataNascimento"],
  ["maiores de 18", "dataNascimento"],
  ["Já existe uma conta", "email"],
];

const ERROS_LOGIN: MapaErros = [["E-mail ou senha", "password"]];

function mensagemNativa(campo: HTMLInputElement): string {
  const { validity } = campo;
  if (validity.valueMissing) {
    if (campo.type === "checkbox") return "Aceite a Política de Privacidade para continuar.";
    if (campo.type === "date") return "Informe sua data de nascimento.";
    return "Preencha este campo.";
  }
  if (validity.typeMismatch && campo.type === "email") return "Digite um e-mail válido, como nome@exemplo.com.";
  if (validity.tooShort) return `Use pelo menos ${campo.minLength} caracteres.`;
  return campo.validationMessage;
}

/** Mostra o erro nativo do navegador (required, email, minLength) e o da server action embaixo do campo certo. */
function useErrosDeCampo(state: FormState, mapa: MapaErros) {
  const [locais, setLocais] = useState<Record<string, string>>({});
  const [servidorDispensado, setServidorDispensado] = useState(false);
  const focou = useRef(false);

  useEffect(() => setServidorDispensado(false), [state]);

  const campoServidor = state.error ? (mapa.find(([trecho]) => state.error?.includes(trecho))?.[1] ?? "geral") : null;

  const erro = (campo: string) =>
    locais[campo] ?? (!servidorDispensado && campoServidor === campo ? state.error : undefined);

  const eventos = {
    onInvalidCapture(event: FormEvent<HTMLFormElement>) {
      const alvo = event.target;
      if (!(alvo instanceof HTMLInputElement)) return;
      event.preventDefault();
      setLocais((atual) => ({ ...atual, [alvo.name]: mensagemNativa(alvo) }));
      if (!focou.current) {
        focou.current = true;
        alvo.focus();
        window.setTimeout(() => {
          focou.current = false;
        }, 0);
      }
    },
    onChangeCapture(event: FormEvent<HTMLFormElement>) {
      const alvo = event.target;
      if (!(alvo instanceof HTMLInputElement) || !alvo.name) return;
      setLocais((atual) => {
        if (!(alvo.name in atual)) return atual;
        const resto = { ...atual };
        delete resto[alvo.name];
        return resto;
      });
      if (campoServidor === alvo.name) setServidorDispensado(true);
    },
  };

  return { erro, eventos };
}

function MensagemErro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {texto}
    </p>
  );
}

function AvisoTopo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-sm px-3 py-2.5 text-sm text-danger"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-danger-fg) 12%, transparent)" }}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {texto}
    </p>
  );
}

type A11yCampo = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

function Campo({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: (a11y: A11yCampo) => ReactNode;
}) {
  const descritores = [dica ? `${id}-dica` : null, erro ? `${id}-erro` : null].filter(Boolean).join(" ");
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-on-dark">
        {rotulo}
      </label>
      {children({ id, "aria-invalid": erro ? true : undefined, "aria-describedby": descritores || undefined })}
      {dica ? (
        <p id={`${id}-dica`} className="text-xs text-muted-on-dark">
          {dica}
        </p>
      ) : null}
      <MensagemErro id={`${id}-erro`} texto={erro} />
    </div>
  );
}

function CampoSenha({
  id,
  autoComplete,
  minLength,
  dica,
  erro,
}: {
  id: string;
  autoComplete: string;
  minLength?: number;
  dica?: string;
  erro?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Campo id={id} rotulo="Senha" erro={erro} dica={dica}>
      {(a11y) => (
        <div className="relative">
          <input
            {...a11y}
            name={id}
            type={visivel ? "text" : "password"}
            required
            minLength={minLength}
            autoComplete={autoComplete}
            className={cn(CAMPO, "pr-12")}
          />
          <button
            type="button"
            onClick={() => setVisivel((atual) => !atual)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-controls={id}
            className={cn(
              "absolute right-1 top-1 inline-flex size-10 items-center justify-center rounded-sm text-muted-on-dark transition-colors hover:text-on-dark",
              FOCO_ESCURO,
            )}
          >
            {visivel ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      )}
    </Campo>
  );
}

function BotaoEnviar({ rotulo, carregando }: { rotulo: string; carregando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants(), "mt-2 h-12 w-full gap-2 text-base font-medium disabled:opacity-80", FOCO_ESCURO)}
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" aria-hidden />
          {carregando}
        </>
      ) : (
        rotulo
      )}
    </button>
  );
}

function BotaoGoogleEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "chip-dark inline-flex h-12 w-full items-center justify-center gap-2 rounded-control text-base font-medium text-on-dark transition-colors hover:bg-[color-mix(in_srgb,var(--color-on-dark)_14%,transparent)] disabled:opacity-70",
        FOCO_ESCURO,
      )}
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
      {pending ? "Abrindo o Google…" : "Continuar com Google"}
    </button>
  );
}

function BlocoGoogle({ callbackUrl }: { callbackUrl: string }) {
  return (
    <>
      <form action={loginGoogle}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <BotaoGoogleEnviar />
      </form>
      <div className="my-6 flex items-center gap-3 text-xs font-medium text-muted-on-dark">
        <span className="rule-dark h-px flex-1" aria-hidden />
        ou com e-mail
        <span className="rule-dark h-px flex-1" aria-hidden />
      </div>
    </>
  );
}

function CartaoAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="panel-dark rounded-card p-6 shadow-card sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-display text-on-dark">{titulo}</h2>
      {subtitulo ? <p className="mt-1 text-sm text-muted-on-dark">{subtitulo}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function CadastroForm() {
  const [state, action] = useFormState(cadastrarUsuario, {});
  const { erro, eventos } = useErrosDeCampo(state, ERROS_CADASTRO);

  return (
    <CartaoAuth titulo="Criar conta" subtitulo="Cadastro só para maiores de 18 anos.">
      <BlocoGoogle callbackUrl="/conta" />
      <form action={action} className="grid gap-5" {...eventos}>
        <AvisoTopo texto={erro("geral")} />
        <Campo id="nome" rotulo="Nome" erro={erro("nome")}>
          {(a11y) => <input {...a11y} name="nome" required autoComplete="name" className={CAMPO} />}
        </Campo>
        <Campo id="email" rotulo="E-mail" erro={erro("email")}>
          {(a11y) => <input {...a11y} name="email" type="email" required autoComplete="email" className={CAMPO} />}
        </Campo>
        <CampoSenha
          id="senha"
          autoComplete="new-password"
          minLength={SENHA_MINIMA}
          dica={`Mínimo de ${SENHA_MINIMA} caracteres.`}
          erro={erro("senha")}
        />
        <Campo id="dataNascimento" rotulo="Data de nascimento" erro={erro("dataNascimento")}>
          {(a11y) => <input {...a11y} name="dataNascimento" type="date" required className={CAMPO} />}
        </Campo>
        <div className="grid gap-2">
          <label htmlFor="aceite" className="flex cursor-pointer items-start gap-3 text-sm text-on-dark">
            <input
              id="aceite"
              name="aceite"
              type="checkbox"
              required
              aria-invalid={erro("aceite") ? true : undefined}
              aria-describedby={erro("aceite") ? "aceite-erro" : undefined}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent-from [color-scheme:dark]"
            />
            <span>
              Li e aceito a{" "}
              <Link
                href="/privacidade"
                className={cn("rounded-sm font-medium text-accent-hover underline underline-offset-4", FOCO_ESCURO)}
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          <MensagemErro id="aceite-erro" texto={erro("aceite")} />
        </div>
        <BotaoEnviar rotulo="Criar conta" carregando="Criando conta…" />
      </form>
    </CartaoAuth>
  );
}

export function LoginForm({
  callbackUrl,
  googleErro,
  contaSuspensa,
}: {
  callbackUrl: string;
  googleErro?: boolean;
  contaSuspensa?: boolean;
}) {
  const [state, action] = useFormState(loginUsuario, {});
  const { erro, eventos } = useErrosDeCampo(state, ERROS_LOGIN);

  return (
    <CartaoAuth titulo="Entrar">
      {googleErro ? (
        <div className="mb-4">
          <AvisoTopo texto="Login com Google ainda não está configurado. Coloque AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET no .env." />
        </div>
      ) : null}
      {contaSuspensa ? (
        <div className="mb-4">
          <AvisoTopo texto="Esta conta está suspensa. Fale com a equipe do Culturama." />
        </div>
      ) : null}
      <BlocoGoogle callbackUrl={callbackUrl} />
      <form action={action} className="grid gap-5" {...eventos}>
        <AvisoTopo texto={erro("geral")} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Campo id="email" rotulo="E-mail" erro={erro("email")}>
          {(a11y) => <input {...a11y} name="email" type="email" required autoComplete="email" className={CAMPO} />}
        </Campo>
        <CampoSenha id="password" autoComplete="current-password" erro={erro("password")} />
        <BotaoEnviar rotulo="Entrar" carregando="Entrando…" />
      </form>
    </CartaoAuth>
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
      <p className="rounded-card bg-muted px-4 py-3 text-sm">
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
          className="h-10 w-full rounded-pill border border-input bg-card px-3 text-sm"
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
