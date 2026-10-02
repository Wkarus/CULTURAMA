import { auth } from "@/auth";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <SiteHeaderClient
      usuario={
        user
          ? { nome: user.name ?? null, email: user.email ?? null, admin: user.tipo === "admin" || user.tipo === "moderador" }
          : null
      }
    />
  );
}
