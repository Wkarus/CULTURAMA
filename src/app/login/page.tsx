import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; erro?: string };
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>E-mail e senha, ou Google quando as chaves estiverem no .env.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm callbackUrl={searchParams.callbackUrl ?? "/conta"} googleErro={searchParams.erro === "google"} />
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/cadastro" className="underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
