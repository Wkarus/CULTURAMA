import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarPlus, HandCoins, MapPin, Users } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Para organizadores",
  description: "Coloque sua batalha, roda, encontro ou festa no mapa do Culturama. Cadastro grátis, com selo de organizador verificado.",
};

const FOCO_ESCURO =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

const CENAS = ["Batalha de rima", "Roda de samba", "Encontro de carros", "Anime e games", "Breaking", "Slam", "Corrida de rua", "Eletrônica", "Sarau", "Skate"];

const GANHOS = [
  { icone: MapPin, titulo: "Seu evento no mapa", texto: "Quem abre o Culturama vê o pin, a data e o endereço, com rota de carro, metrô, Uber e 99." },
  { icone: Users, titulo: "Público que já procura", texto: "A lista e o mapa entregam o evento para quem filtra pela sua cena, pela data e pela distância." },
  { icone: BadgeCheck, titulo: "Selo de verificado", texto: "CNPJ ativo pode ser aprovado na hora; CPF passa pela equipe. O selo passa confiança e afasta golpe." },
  { icone: HandCoins, titulo: "Sem custo para publicar", texto: "Cadastro e publicação são grátis. Quem paga são as marcas que querem chegar no seu público." },
];

const PASSOS = [
  { icone: CalendarPlus, titulo: "Crie a conta", texto: "E-mail e senha ou Google. Leva um minuto." },
  { icone: BadgeCheck, titulo: "Cadastre-se como organizador", texto: "CPF ou CNPJ, nome do coletivo ou da empresa e um documento." },
  { icone: MapPin, titulo: "Publique o evento", texto: "Data, local, capa e link do ingresso. Depois da aprovação, ele entra no mapa e na lista." },
];

export default async function ParaOrganizadoresPage() {
  const session = await auth();
  const logado = Boolean(session?.user?.id);
  const principal = logado ? { href: "/cadastro/organizador", rotulo: "Cadastrar como organizador" } : { href: "/cadastro", rotulo: "Criar conta grátis" };

  return (
    <main className="bg-surface-dark text-on-dark">
      <section className="relative isolate overflow-hidden pt-16">
        <div className="hero-orbs pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden>
          <span className="hero-orb hero-orb-a" />
          <span className="hero-orb hero-orb-b" />
          <span className="hero-orb hero-orb-c" />
        </div>
        <div className="mx-auto max-w-page px-4 py-20 text-center md:py-28">
          <p className="mx-auto inline-flex items-center gap-2 rounded-pill border border-on-dark/15 bg-on-dark/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
            Para quem organiza
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-display">
            Sua cena no <span className="text-accent-gradient">mapa</span> da cidade.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-on-dark sm:text-lg">
            A batalha, a roda, o encontro ou a festa que hoje só circula no grupo e no story aparece para quem procura o que fazer perto de casa.
            Cadastro grátis.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={principal.href} className={cn(buttonVariants(), "h-12 gap-2 px-6 text-base font-medium shadow-cta", FOCO_ESCURO)}>
              {principal.rotulo}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            {logado ? null : (
              <Link
                href="/login?callbackUrl=/cadastro/organizador"
                className={cn("chip-dark inline-flex h-12 items-center rounded-control px-6 text-base font-medium", FOCO_ESCURO)}
              >
                Já tenho conta
              </Link>
            )}
          </div>
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Cenas que já cabem no Culturama">
            {CENAS.map((cena) => (
              <li key={cena} className="chip-dark rounded-pill px-3 py-1.5 text-sm text-on-dark">
                {cena}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold tracking-display sm:text-4xl">O que você ganha</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GANHOS.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="panel-dark rounded-card p-6">
              <span className="chip-dark inline-flex size-10 items-center justify-center rounded-sm" aria-hidden>
                <Icone className="size-5 text-accent-hover" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-on-dark">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-page px-4 pb-16 md:pb-24">
        <h2 className="font-display text-3xl font-bold tracking-display sm:text-4xl">Como funciona</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="panel-dark flex gap-4 rounded-card p-6">
              <span className="font-display text-3xl font-bold leading-none text-accent-hover" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Icone className="size-4 text-accent-hover" strokeWidth={1.75} aria-hidden />
                  {titulo}
                </h3>
                <p className="mt-2 text-sm text-muted-on-dark">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-on-dark/10">
        <div className="mx-auto flex max-w-page flex-col items-center gap-5 px-4 py-16 text-center md:py-20">
          <h2 className="max-w-2xl text-balance font-display text-3xl font-bold tracking-display sm:text-4xl">Coletivo, assessoria ou clube com vários eventos?</h2>
          <p className="max-w-xl text-muted-on-dark">Um cadastro só publica todos os seus eventos, com o mesmo selo de verificado.</p>
          <Link href={principal.href} className={cn(buttonVariants(), "h-12 gap-2 px-6 text-base font-medium shadow-cta", FOCO_ESCURO)}>
            {principal.rotulo}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
