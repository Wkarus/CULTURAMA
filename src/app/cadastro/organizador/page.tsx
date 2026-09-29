import { OrganizadorForm } from "@/components/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CadastroOrganizadorPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de organizador</CardTitle>
          <CardDescription>
            CNPJ é validado na BrasilAPI. CPF passa pelo dígito verificador e fica na fila de aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizadorForm />
        </CardContent>
      </Card>
    </main>
  );
}
