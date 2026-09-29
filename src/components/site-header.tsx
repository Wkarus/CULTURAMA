import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLink = "whitespace-nowrap text-caption transition-opacity hover:opacity-100";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface-dark) 92%, transparent)",
        borderColor: "color-mix(in srgb, var(--color-on-dark) 12%, transparent)",
        color: "var(--color-on-dark)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0 font-display text-base font-semibold tracking-display">
          Culturama
          <span
            className="ml-1 inline-block size-1.5 rounded-full bg-accent-gradient align-middle"
            aria-hidden="true"
          />
        </Link>
        <nav className="flex min-w-0 items-center gap-3 overflow-x-auto">
          <Link href="/eventos" className={navLink} style={{ color: "var(--color-muted-on-dark)" }}>
            Eventos
          </Link>
          <Link href="/mapa" className={navLink} style={{ color: "var(--color-muted-on-dark)" }}>
            Mapa
          </Link>
          {session?.user ? (
            <>
              {session.user.tipo === "admin" ? (
                <Link href="/admin" className={navLink} style={{ color: "var(--color-muted-on-dark)" }}>
                  Admin
                </Link>
              ) : null}
              <Link href="/conta" className={navLink} style={{ color: "var(--color-muted-on-dark)" }}>
                Conta
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-on-dark) 22%, transparent)",
                    background: "transparent",
                    color: "var(--color-on-dark)",
                  }}
                >
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={navLink} style={{ color: "var(--color-muted-on-dark)" }}>
                Entrar
              </Link>
              <Link href="/cadastro" className={cn(buttonVariants(), "shrink-0")}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
