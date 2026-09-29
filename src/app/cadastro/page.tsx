import Link from "next/link";
import { CadastroForm } from "@/components/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CadastroPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Usuário comum. Depois você pode virar organizador.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <CadastroForm />
          <p className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
