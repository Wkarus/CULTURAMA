import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, DollarSign, Sparkles, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeB2BPartners() {
  const beneficios = [
    {
      icone: DollarSign,
      titulo: "Divulgação do evento",
      descricao: "Publique data, endereço e ingresso para quem busca cultura perto de casa.",
    },
    {
      icone: Users,
      titulo: "Público que já está procurando",
      descricao: "A lista e o mapa mostram o evento para quem filtra por categoria, data e distância.",
    },
    {
      icone: CreditCard,
      titulo: "Pagamentos",
      descricao: "Em breve: Mercado Pago, Stripe e Pix. Ainda não há checkout no site.",
      emBreve: true,
    },
    {
      icone: BadgeCheck,
      titulo: "Selo de organizador verificado",
      descricao: "CPF entra em análise. CNPJ ativo pode ser aprovado na hora. O selo aparece depois da aprovação.",
    },
  ];

  return (
    <section className="relative border-t border-border-light bg-surface-light px-4 py-20 text-on-light md:py-28">
      <div className="mx-auto max-w-page">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-from/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-solid">
              <Sparkles className="size-3.5" aria-hidden />
              Para quem organiza
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-display text-on-light sm:text-4xl md:text-5xl">
              Publique seu evento para quem está procurando cultura.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-on-light">
              Festival, galeria, teatro ou casa de shows: o cadastro de organizador libera a publicação no mapa e na lista.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/cadastro/organizador" className={cn(buttonVariants(), "gap-2 px-6 font-medium shadow-cta")}>
                Cadastrar como organizador
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "font-medium")}>
                Já tenho conta
              </Link>
            </div>

            <p className="mt-8 border-t border-border-light pt-6 text-xs text-muted-on-light">
              Pagamentos por Mercado Pago, Stripe e Pix: em breve.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            {beneficios.map((item) => {
              const Icone = item.icone;
              return (
                <div key={item.titulo} className="rounded-card border border-border-light bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-control bg-accent-from/10 text-accent-solid">
                      <Icone className="size-5" aria-hidden />
                    </div>
                    {item.emBreve ? (
                      <span className="rounded-pill bg-warning-bg px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning">
                        Em breve
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-on-light">{item.titulo}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-on-light">{item.descricao}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
