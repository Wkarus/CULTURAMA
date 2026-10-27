import type { Metadata } from "next";
import { CadastroForm } from "@/components/auth-forms";
import { AuthShell, AuthTroca } from "@/components/auth-shell";
import { capasDecorativas } from "@/lib/eventos";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage() {
  const capas = await capasDecorativas();

  return (
    <AuthShell
      capas={capas}
      titulo={
        <>
          Seu próximo <span className="text-accent-gradient">rolê</span> começa aqui
        </>
      }
    >
      <CadastroForm />
      <AuthTroca pergunta="Já tem conta?" href="/login" acao="Entrar" />
    </AuthShell>
  );
}
