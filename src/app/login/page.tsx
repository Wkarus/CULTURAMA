import { LoginForm } from "@/components/auth-forms";
import { AuthFooterLink, AuthPanel } from "@/components/auth-panel";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; erro?: string };
}) {
  return (
    <AuthPanel
      title="Entrar"
      description="Use e-mail e senha. Google entra quando as chaves estiverem no ambiente."
      footer={<AuthFooterLink href="/cadastro" prompt="Não tem conta?" label="Criar conta" />}
    >
      <LoginForm callbackUrl={searchParams.callbackUrl ?? "/conta"} googleErro={searchParams.erro === "google"} />
    </AuthPanel>
  );
}
