"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Menu as MenuIcon, X } from "lucide-react";
import { sair } from "@/actions/auth";
import { iniciais } from "@/lib/perfil";
import { cn } from "@/lib/utils";

export type UsuarioHeader = { nome: string | null; email: string | null; admin: boolean; moderador?: boolean; empresa?: boolean };

const LINKS = [
  { href: "/eventos", label: "Eventos" },
  { href: "/mapa", label: "Mapa" },
  { href: "/para-organizadores", label: "Para organizadores" },
  { href: "/cadastro/empresa", label: "Para empresas" },
];

/** Páginas que abrem sobre fundo escuro: o header começa transparente e sobrepõe o topo, como na home. */
const ROTAS_ESCURAS = new Set(["/", "/login", "/cadastro", "/conta", "/boas-vindas"]);

const LIMIAR_FUNDO = 40;
const LIMIAR_ESCONDER = 120;
const DELTA_MIN = 6;

const mix = (cor: string, pct: number) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;

const foco =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

const ctaPequeno = cn(
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-pill bg-accent-gradient px-3.5 text-sm font-medium text-on-dark shadow-cta transition-transform hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none",
  foco,
);

function ativo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itensConta(usuario: UsuarioHeader) {
  if (usuario.admin) {
    return [
      { href: "/admin", label: "Admin" },
      { href: "/conta/eventos", label: "Meus eventos" },
      { href: "/insights", label: "Insights" },
    ];
  }
  return [
    { href: "/conta", label: "Conta" },
    { href: "/conta/eventos", label: "Meus eventos" },
    { href: "/conta/favoritos", label: "Favoritos" },
    ...(usuario.empresa ? [{ href: "/insights", label: "Insights" }] : []),
    ...(usuario.moderador ? [{ href: "/admin", label: "Admin" }] : []),
  ];
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-md font-display text-[1.25rem] font-bold tracking-display", foco)}
    >
      Culturama
      <span className="logo-dot inline-block size-2 rounded-full bg-accent-gradient" aria-hidden />
    </Link>
  );
}

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const atual = ativo(pathname, href);
  return (
    <Link
      href={href}
      aria-current={atual ? "page" : undefined}
      className={cn(
        "group relative whitespace-nowrap rounded-md px-1 py-2 text-sm font-medium transition-colors hover:text-on-dark",
        atual ? "text-on-dark" : "text-muted-on-dark",
        foco,
      )}
    >
      {label}
      <span
        className={cn(
          "pointer-events-none absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-accent-gradient transition-transform duration-300 ease-out",
          atual ? "w-4 scale-x-100" : "w-full origin-center scale-x-0 group-hover:scale-x-100",
        )}
        aria-hidden
      />
    </Link>
  );
}

function MenuConta({ usuario }: { usuario: UsuarioHeader }) {
  const [saindo, iniciar] = useTransition();
  const item =
    "flex w-full cursor-pointer items-center rounded-control px-3 py-2 text-sm text-muted-on-dark outline-none data-[highlighted]:bg-[color-mix(in_srgb,var(--color-on-dark)_8%,transparent)] data-[highlighted]:text-on-dark";

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Menu da conta${usuario.nome ? ` de ${usuario.nome}` : ""}`}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full bg-accent-gradient font-display text-sm font-bold text-on-dark shadow-cta transition-transform hover:scale-105 motion-reduce:transform-none",
          foco,
        )}
      >
        {iniciais(usuario)}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end" className="z-50">
          <Menu.Popup
            className="min-w-56 origin-[var(--transform-origin)] rounded-card border p-1.5 text-on-dark shadow-card backdrop-blur-xl transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
            style={{
              backgroundColor: mix("var(--color-surface-dark)", 94),
              borderColor: mix("var(--color-on-dark)", 10),
            }}
          >
            {usuario.nome || usuario.email ? (
              <div className="px-3 pb-2 pt-1.5">
                {usuario.nome ? <p className="truncate text-sm font-semibold">{usuario.nome}</p> : null}
                {usuario.email ? <p className="truncate text-xs text-muted-on-dark">{usuario.email}</p> : null}
              </div>
            ) : null}
            {itensConta(usuario).map((link) => (
              <Menu.LinkItem key={link.href} render={<Link href={link.href} />} closeOnClick className={item}>
                {link.label}
              </Menu.LinkItem>
            ))}
            <div className="my-1.5 h-px" style={{ backgroundColor: mix("var(--color-on-dark)", 10) }} role="separator" />
            <Menu.Item className={item} disabled={saindo} onClick={() => iniciar(() => sair())}>
              {saindo ? "Saindo…" : "Sair"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function MenuMobile({
  usuario,
  pathname,
  aberto,
  setAberto,
}: {
  usuario: UsuarioHeader | null;
  pathname: string;
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
}) {
  const [saindo, iniciar] = useTransition();
  const fechar = () => setAberto(false);
  const links = usuario ? [...LINKS, ...itensConta(usuario)] : [...LINKS, { href: "/login", label: "Entrar" }];
  const linkGrande = "block rounded-md py-2 font-display text-[1.5rem] font-semibold tracking-display";

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto}>
      <Dialog.Trigger
        aria-label="Abrir menu"
        className={cn("inline-flex size-11 items-center justify-center rounded-full md:hidden", foco)}
      >
        <MenuIcon className="size-6" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto text-on-dark backdrop-blur-xl transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 md:hidden"
          style={{ backgroundColor: mix("var(--color-surface-dark)", 92) }}
          onClick={(event) => {
            if (event.target === event.currentTarget) fechar();
          }}
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <Logo onClick={fechar} />
            <Dialog.Close aria-label="Fechar menu" className={cn("inline-flex size-11 items-center justify-center rounded-full", foco)}>
              <X className="size-6" aria-hidden />
            </Dialog.Close>
          </div>
          <nav aria-label="Menu principal" className="flex flex-1 flex-col px-6 pb-8 pt-6">
            <ul className="flex flex-col gap-2">
              {links.map((link, i) => {
                const atual = ativo(pathname, link.href);
                return (
                  <li key={link.href} className="header-item-in" style={{ animationDelay: `${80 + i * 55}ms` }}>
                    <Link
                      href={link.href}
                      onClick={fechar}
                      aria-current={atual ? "page" : undefined}
                      className={cn(linkGrande, atual ? "text-on-dark" : "text-muted-on-dark", foco)}
                    >
                      {link.label}
                      {atual ? <span className="ml-3 inline-block h-0.5 w-5 rounded-full bg-accent-gradient align-middle" aria-hidden /> : null}
                    </Link>
                  </li>
                );
              })}
              {usuario ? (
                <li className="header-item-in" style={{ animationDelay: `${80 + links.length * 55}ms` }}>
                  <button
                    type="button"
                    disabled={saindo}
                    onClick={() => iniciar(() => sair())}
                    className={cn(linkGrande, "w-full text-left text-muted-on-dark", foco)}
                  >
                    {saindo ? "Saindo…" : "Sair"}
                  </button>
                </li>
              ) : null}
            </ul>
            {usuario ? null : (
              <div className="header-item-in mt-auto pt-10" style={{ animationDelay: `${80 + links.length * 55}ms` }}>
                <Link href="/cadastro" onClick={fechar} className={cn(ctaPequeno, "h-12 w-full text-base")}>
                  Criar conta
                </Link>
              </div>
            )}
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SiteHeaderClient({ usuario }: { usuario: UsuarioHeader | null }) {
  const pathname = usePathname() ?? "/";
  const sobreEscuro = ROTAS_ESCURAS.has(pathname) || pathname === "/admin" || pathname.startsWith("/admin/");
  const [rolou, setRolou] = useState(false);
  const [escondido, setEscondido] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ultimo = window.scrollY;
    let raf = 0;

    const medir = () => {
      raf = 0;
      const y = window.scrollY;
      setRolou(y > LIMIAR_FUNDO);
      if (reduce.matches || y <= LIMIAR_ESCONDER) {
        setEscondido(false);
        ultimo = y;
        return;
      }
      if (Math.abs(y - ultimo) < DELTA_MIN) return;
      setEscondido(y > ultimo);
      ultimo = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const solido = !sobreEscuro || rolou;
  const oculto = escondido && !menuAberto;

  // Barras fixas abaixo do cabeçalho (busca de /eventos) sobem junto quando ele some; sem isso sobrava um vão de 64 px.
  useEffect(() => {
    document.documentElement.dataset.cabecalho = oculto ? "oculto" : "visivel";
  }, [oculto]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b text-on-dark transition-[background-color,border-color,backdrop-filter,transform] duration-300 ease-out",
        sobreEscuro && "-mb-16",
        solido && "backdrop-blur-md",
        oculto && "-translate-y-full",
      )}
      style={{
        backgroundColor: solido ? mix("var(--color-surface-dark)", 80) : "transparent",
        borderColor: solido ? mix("var(--color-on-dark)", 10) : "transparent",
      }}
      onFocusCapture={() => setEscondido(false)}
    >
      <div className="mx-auto grid h-16 max-w-page grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr]">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {usuario ? (
              <MenuConta usuario={usuario} />
            ) : (
              <>
                <NavLink href="/login" label="Entrar" pathname={pathname} />
                <Link href="/cadastro" className={ctaPequeno}>
                  Criar conta
                </Link>
              </>
            )}
          </div>
          <MenuMobile usuario={usuario} pathname={pathname} aberto={menuAberto} setAberto={setMenuAberto} />
        </div>
      </div>
    </header>
  );
}
