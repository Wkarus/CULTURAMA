import { CompletarPerfilForm } from "@/components/auth-forms";
import { AuthPanel } from "@/components/auth-panel";

export default function CompletarCadastroPage() {
  return (
    <AuthPanel
      title="Complete seu cadastro"
      description="Contas Google precisam confirmar idade (18+) e aceitar a Política de Privacidade."
    >
      <CompletarPerfilForm />
    </AuthPanel>
  );
}
