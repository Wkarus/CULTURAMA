import { CompletarPerfilForm } from "@/components/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompletarCadastroPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Complete seu cadastro</CardTitle>
          <CardDescription>
            Contas Google precisam confirmar idade (18+) e aceitar a Política de Privacidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompletarPerfilForm />
        </CardContent>
      </Card>
    </main>
  );
}
