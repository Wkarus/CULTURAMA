import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingInteresses } from "@/components/onboarding-interesses";
import { ensureCategorias } from "@/lib/categorias";
import { prisma } from "@/lib/prisma";

export default async function BoasVindasPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/boas-vindas");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { interesses: true } });
  if (!user) {
    redirect("/login");
  }
  if (user.interesses.length > 0) {
    redirect("/eventos");
  }

  const maes = (await ensureCategorias()).filter((c) => !c.parentId);

  return <OnboardingInteresses categorias={maes.map(({ id, nome, slug, icone }) => ({ id, nome, slug, icone }))} />;
}
