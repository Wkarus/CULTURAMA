import { CadastroForm } from "@/components/auth-forms";
import { AuthFooterLink, AuthPanel } from "@/components/auth-panel";

export default function CadastroPage() {
  return (
    <AuthPanel
      title="Criar conta"
      description="Cadastro para maiores de 18 anos, com aceite da política de privacidade. Depois você pode publicar eventos."
      footer={<AuthFooterLink href="/login" prompt="Já tem conta?" label="Entrar" />}
    >
      <CadastroForm />
    </AuthPanel>
  );
}
