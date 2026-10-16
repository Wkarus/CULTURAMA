import Link from "next/link";
import { redirect } from "next/navigation";
import type { Organizer, UserTipo } from "@prisma/client";
import { ArrowRight, CalendarPlus, Clock, Heart, Megaphone, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { InteressesForm } from "@/components/social-forms";
import { buttonVariants } from "@/components/ui/button";
import { inicioDoPainel } from "@/lib/admin-permissoes";
import { ensureCategorias } from "@/lib/categorias";
import { EVENTO_PUBLICO } from "@/lib/event-filters";
import { iniciais, visualCategoria } from "@/lib/perfil";
import { textoMotivoVisivel } from "@/lib/pedido-acesso";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const FOCO_ESCURO =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

const LINK_ACCENT = cn(
  "inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-accent-hover underline-offset-4 hover:underline",
  FOCO_ESCURO,
);

function seloConta(tipo: UserTipo, organizer: Organizer | null): { rotulo: string; icone: LucideIcon } {
  if (tipo === "admin") return { rotulo: "Admin", icone: ShieldCheck };
  if (tipo === "moderador") return { rotulo: "Moderação", icone: ShieldCheck };
  if (tipo === "empresa") return { rotulo: "Empresa", icone: Megaphone };
  if (organizer?.statusVerificacao === "aprovado") return { rotulo: "Organizador", icone: Megaphone };
  if (organizer?.statusVerificacao === "pendente") return { rotulo: "Em análise", icone: Clock };
  if (organizer) return { rotulo: "Recusado", icone: Clock };
  return { rotulo: "Explorador", icone: Sparkles };
}

function plural(n: number, um: string, varios: string) {
  return n === 1 ? um : varios;
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-sm text-muted-on-dark">{rotulo}</dt>
      <dd className="font-display text-3xl font-bold tracking-display">{valor}</dd>
    </div>
  );
}

function textoOrganizador(status: string): string {
  if (status === "aprovado") return "Crie, edite e acompanhe o que você publicou.";
  if (status === "pendente") return "Seu pedido está em análise. Enquanto isso, você já pode salvar eventos como rascunho.";
  return "Seu pedido de organizador foi recusado.";
}

function rotuloPedido(status: string) {
  if (status === "aprovado") return "Aprovado";
  if (status === "pendente") return "Em análise";
  return "Recusado";
}

export default async function ContaPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/conta");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organizer: true, empresa: true },
  });

  if (!user) {
    redirect("/login");
  }

  const favoritosPublicados = { userId: user.id, event: EVENTO_PUBLICO };
  const [categorias, totalFavoritos, favoritos, eventosPublicados] = await Promise.all([
    ensureCategorias(),
    prisma.favorite.count({ where: favoritosPublicados }),
    prisma.favorite.findMany({
      where: favoritosPublicados,
      include: { event: { select: { id: true, titulo: true, imagemCapa: true, category: { select: { nome: true } } } } },
      orderBy: { event: { dataHora: "asc" } },
      take: 4,
    }),
    user.organizer
      ? prisma.event.count({ where: { organizerId: user.organizer.id, status: "publicado" } })
      : Promise.resolve(null),
  ]);

  const selo = seloConta(user.tipo, user.organizer);
  const IconeSelo = selo.icone;

  return (
    <main className="min-h-dvh bg-surface-dark pt-16 text-on-dark">
      <div className="mx-auto grid max-w-page gap-6 px-4 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:py-14">
        <div className="grid gap-6">
          <section aria-labelledby="perfil-nome" className="panel-dark rounded-card p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-5">
              <span
                className="inline-flex size-20 shrink-0 items-center justify-center rounded-full bg-accent-gradient font-display text-3xl font-bold text-on-dark shadow-cta lg:size-24 lg:text-4xl"
                aria-hidden
              >
                {iniciais({ nome: user.nome, email: user.email })}
              </span>
              <div className="grid min-w-0 gap-1.5">
                <h1 id="perfil-nome" className="truncate font-display text-2xl font-bold tracking-display lg:text-3xl">
                  {user.nome}
                </h1>
                <p className="truncate text-sm text-muted-on-dark">{user.email}</p>
                <p className="chip-dark mt-1 inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-medium">
                  <IconeSelo className="size-4 text-accent-hover" strokeWidth={1.75} aria-hidden />
                  {selo.rotulo}
                </p>
              </div>
            </div>

            <dl className="mt-6 flex gap-10 border-t pt-6" style={{ borderColor: "color-mix(in srgb, var(--color-on-dark) 10%, transparent)" }}>
              <Numero valor={totalFavoritos} rotulo={plural(totalFavoritos, "favorito", "favoritos")} />
              {eventosPublicados !== null ? (
                <Numero valor={eventosPublicados} rotulo={plural(eventosPublicados, "evento publicado", "eventos publicados")} />
              ) : null}
            </dl>

            {user.tipo === "admin" || user.tipo === "moderador" ? (
              <Link href={inicioDoPainel(user.tipo)} className={cn(LINK_ACCENT, "mt-6")}>
                {user.tipo === "admin" ? "Abrir painel admin" : "Abrir painel de moderação"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : null}
          </section>

          <section aria-labelledby="organizador-titulo" className="panel-dark relative isolate overflow-hidden rounded-card p-6 shadow-card sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 75% 85% at 100% 0%, color-mix(in srgb, var(--color-accent-to) 30%, transparent), transparent 70%)",
              }}
              aria-hidden
            />
            <span className="chip-dark inline-flex size-11 items-center justify-center rounded-sm" aria-hidden>
              <CalendarPlus className="size-5 text-accent-hover" strokeWidth={1.75} />
            </span>
            {user.organizer ? (
              <>
                <h2 id="organizador-titulo" className="mt-4 font-display text-2xl font-semibold tracking-display">
                  Meus eventos
                </h2>
                <p className="mt-2 text-sm font-medium text-accent-hover">{rotuloPedido(user.organizer.statusVerificacao)}</p>
                <p className="mt-2 max-w-[42ch] text-muted-on-dark">{textoOrganizador(user.organizer.statusVerificacao)}</p>
                {user.organizer.statusVerificacao === "rejeitado" || user.organizer.statusVerificacao === "recusado_automaticamente" ? (
                  <>
                    <p className="mt-3 max-w-[48ch] text-sm text-on-dark">{textoMotivoVisivel(user.organizer.motivoCodigo, user.organizer.motivoTexto)}</p>
                    <Link href="/cadastro/organizador" className={cn(buttonVariants(), "mt-6 h-11 px-5", FOCO_ESCURO)}>
                      Enviar novo pedido
                    </Link>
                  </>
                ) : (
                  <Link href="/conta/eventos" className={cn(buttonVariants(), "mt-6 h-11 gap-2 px-5", FOCO_ESCURO)}>
                    Abrir meus eventos
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </>
            ) : (
              <>
                <h2 id="organizador-titulo" className="mt-4 font-display text-2xl font-semibold tracking-display">
                  Organiza eventos?
                </h2>
                <p className="mt-2 max-w-[42ch] text-muted-on-dark">
                  Publique seus eventos e apareça no mapa pra quem está perto.
                </p>
                <Link href="/cadastro/organizador" className={cn(buttonVariants(), "mt-6 h-11 px-5", FOCO_ESCURO)}>
                  Quero cadastrar eventos
                </Link>
              </>
            )}
          </section>

          {user.empresa ? (
            <section aria-labelledby="empresa-titulo" className="panel-dark rounded-card p-6 shadow-card sm:p-8">
              <h2 id="empresa-titulo" className="font-display text-2xl font-semibold tracking-display">
                Plano Empresa
              </h2>
              <p className="mt-2 text-sm font-medium text-accent-hover">{rotuloPedido(user.empresa.status)}</p>
              <p className="mt-2 max-w-[42ch] text-muted-on-dark">
                {user.empresa.status === "aprovado"
                  ? "O Culturama Insights está liberado para esta conta."
                  : user.empresa.status === "pendente"
                    ? "Seu pedido de plano Empresa está em análise."
                    : "Seu pedido de plano Empresa foi recusado."}
              </p>
              {user.empresa.status === "rejeitado" || user.empresa.status === "recusado_automaticamente" ? (
                <>
                  <p className="mt-3 max-w-[48ch] text-sm text-on-dark">{textoMotivoVisivel(user.empresa.motivoCodigo, user.empresa.motivoTexto)}</p>
                  <Link href="/cadastro/empresa" className={cn(buttonVariants(), "mt-6 h-11 px-5", FOCO_ESCURO)}>
                    Enviar novo pedido
                  </Link>
                </>
              ) : user.empresa.status === "aprovado" ? (
                <Link href="/insights" className={cn(buttonVariants(), "mt-6 h-11 px-5", FOCO_ESCURO)}>
                  Abrir o Insights
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="grid gap-6">
          <section aria-labelledby="interesses-titulo" className="panel-dark rounded-card p-6 shadow-card sm:p-8">
            <h2 id="interesses-titulo" className="font-display text-2xl font-semibold tracking-display">
              Do que você curte?
            </h2>
            <p className="mt-1.5 text-muted-on-dark">A gente usa isso pra destacar eventos pra você.</p>
            <div className="mt-6">
              <InteressesForm categorias={categorias} selecionados={user.interesses} />
            </div>
          </section>

          <section aria-labelledby="favoritos-titulo" className="panel-dark rounded-card p-6 shadow-card sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="favoritos-titulo" className="font-display text-2xl font-semibold tracking-display">
                Seus favoritos
              </h2>
              {favoritos.length > 0 ? (
                <Link href="/conta/favoritos" className={LINK_ACCENT}>
                  Ver todos
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>

            {favoritos.length > 0 ? (
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {favoritos.map(({ event }) => (
                  <li key={event.id}>
                    <Link href={`/eventos/${event.id}`} className={cn("group block rounded-card", FOCO_ESCURO)}>
                      <span className="chip-dark block aspect-[4/5] overflow-hidden rounded-card">
                        {event.imagemCapa ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.imagemCapa}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
                          />
                        ) : (
                          <span className="flex size-full items-end p-3 font-display text-sm font-semibold text-muted-on-dark">
                            {event.category ? visualCategoria(event.category.nome).rotulo : "Evento"}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-accent-hover">
                        {event.titulo}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <span className="chip-dark inline-flex size-12 shrink-0 items-center justify-center rounded-sm" aria-hidden>
                  <Heart className="size-5 text-accent-hover" strokeWidth={1.75} />
                </span>
                <p className="flex-1 text-muted-on-dark">Você ainda não salvou nenhum evento.</p>
                <Link href="/eventos" className={cn(buttonVariants(), "h-11 px-5", FOCO_ESCURO)}>
                  Explorar eventos
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
