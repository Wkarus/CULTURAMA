import type { Metadata } from "next";
import { OrganizadorForm } from "@/components/auth-forms";
import { AuthPanel } from "@/components/auth-panel";
import { modoTesteOrganizador } from "@/lib/cnpj";

export const metadata: Metadata = { title: "Cadastro de organizador" };

export default function CadastroOrganizadorPage() {
  const modoTeste = modoTesteOrganizador();
  return (
    <AuthPanel
      title="Publicar eventos"
      description={
        modoTeste
          ? "Modo de teste: CPF ou CNPJ com dígito verificador. O pedido fica pendente até a aprovação."
          : "CNPJ é validado na BrasilAPI. CPF passa pelo dígito verificador e fica na fila de aprovação."
      }
    >
      <OrganizadorForm modoTeste={modoTeste} />
    </AuthPanel>
  );
}
