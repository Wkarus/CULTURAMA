import { LoginForm } from "@/components/auth-forms";
import { AuthShell, AuthTroca } from "@/components/auth-shell";
import { capasDecorativas } from "@/lib/eventos";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; erro?: string };
}) {
  const capas = await capasDecorativas();

  return (
    <AuthShell
      capas={capas}
      titulo={
        <>
          Bem-vindo de <span className="text-accent-gradient">volta</span>
        </>
      }
    >
      <LoginForm callbackUrl={searchParams.callbackUrl ?? "/conta"} googleErro={searchParams.erro === "google"} />
      <AuthTroca pergunta="Ainda não tem conta?" href="/cadastro" acao="Criar conta" />
    </AuthShell>
  );
}
