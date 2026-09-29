import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function ContaPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/conta");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organizer: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Minha conta</CardTitle>
          <CardDescription>Fundação do Culturama — autenticação e verificação.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {user.nome}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail:</span> {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Tipo:</span> {user.tipo}
          </p>
          {user.tipo === "admin" ? (
            <Link href="/admin" className={cn(buttonVariants(), "w-fit")}>
              Abrir painel admin
            </Link>
          ) : null}
          {user.organizer ? (
            <>
              <p>
                <span className="text-muted-foreground">Verificação:</span> {user.organizer.statusVerificacao} (
                {user.organizer.tipoDocumento} {user.organizer.documento})
              </p>
              <Link href="/conta/eventos" className={cn(buttonVariants(), "mt-2 w-fit")}>
                Meus eventos
              </Link>
            </>
          ) : (
            <Link href="/cadastro/organizador" className={cn(buttonVariants(), "mt-2 w-fit")}>
              Quero cadastrar eventos
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
