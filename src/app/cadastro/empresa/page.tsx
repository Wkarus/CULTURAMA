import { EmpresaForm } from "@/components/empresa-form";
import { AuthShell, AuthTroca } from "@/components/auth-shell";
import { capasDecorativas } from "@/lib/eventos";

export const dynamic = "force-dynamic";

export default async function CadastroEmpresaPage() {
  const capas = await capasDecorativas();
  return (
    <AuthShell
      capas={capas}
      titulo={
        <>
          Culturama <span className="text-accent-gradient">Insights</span>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Conta de empresa, com CNPJ. O acesso ao painel começa depois da aprovação da equipe.
      </p>
      <EmpresaForm />
      <AuthTroca pergunta="Já tem conta?" href="/login?callbackUrl=/insights" acao="Entrar" />
    </AuthShell>
  );
}
