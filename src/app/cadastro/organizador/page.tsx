import { OrganizadorForm } from "@/components/auth-forms";
import { AuthPanel } from "@/components/auth-panel";

export default function CadastroOrganizadorPage() {
  return (
    <AuthPanel
      title="Publicar eventos"
      description="CNPJ é validado na BrasilAPI. CPF passa pelo dígito verificador e fica na fila de aprovação."
    >
      <OrganizadorForm />
    </AuthPanel>
  );
}
