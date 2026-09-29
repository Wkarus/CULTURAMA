import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-3 px-4">
        <Link href="/" className="text-base tracking-shop">
          Culturama
          <span className="ml-0.5 inline-block size-1.5 rounded-full bg-primary align-middle" aria-hidden="true" />
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto sm:gap-2">
          <Link href="/eventos" className={cn(buttonVariants({ variant: "ghost" }))}>
            Eventos
          </Link>
          <Link href="/mapa" className={cn(buttonVariants({ variant: "ghost" }))}>
            Mapa
          </Link>
          <Link href="/privacidade" className={cn(buttonVariants({ variant: "ghost" }))}>
            Privacidade
          </Link>
          {session?.user ? (
            <>
              {session.user.tipo === "admin" ? (
                <Link href="/admin" className={cn(buttonVariants({ variant: "ghost" }))}>
                  Admin
                </Link>
              ) : null}
              <Link href="/conta" className={cn(buttonVariants({ variant: "ghost" }))}>
                Minha conta
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
                Entrar
              </Link>
              <Link href="/cadastro" className={cn(buttonVariants())}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
