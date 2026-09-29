import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventCard } from "@/components/event-card";
import { prisma } from "@/lib/prisma";

export default async function FavoritosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/conta/favoritos");

  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id, event: { status: "publicado" } },
    include: { event: { include: { category: true } } },
    orderBy: { event: { dataHora: "asc" } },
  });

  return (
    <main className="mx-auto max-w-page px-4 py-12">
      <h1 className="text-display">Favoritos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Eventos que você marcou. Abra o detalhe para tirar o favorito.</p>
      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Nada aqui ainda. Vá em <Link href="/eventos" className="underline underline-offset-4">eventos</Link> e use Favoritar.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <li key={row.eventId}>
              <EventCard event={row.event} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
