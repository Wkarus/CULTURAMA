import Link from "next/link";
import { requireSecao } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  await requireSecao("visao-geral");
  const [pendentes, eventosPublicados, anunciosAtivos] = await Promise.all([
    prisma.organizer.count({ where: { statusVerificacao: "pendente" } }),
    prisma.event.count({ where: { status: "publicado" } }),
    prisma.adSlot.count({ where: { ativo: true } }),
  ]);

  const cards = [
    { href: "/admin/organizadores", label: "Organizadores pendentes", value: pendentes },
    { href: "/admin/eventos", label: "Eventos publicados", value: eventosPublicados },
    { href: "/admin/anuncios", label: "Anúncios ativos", value: anunciosAtivos },
  ];

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <li key={card.href}>
          <Link href={card.href} className="block rounded-card bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl tracking-display">{card.value}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
