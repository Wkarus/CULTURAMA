"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  corDaCategoria,
  diaISO,
  ehFimDeSemana,
  ehHoje,
  fimDeSemana,
  hrefBusca,
  temFiltro,
} from "@/lib/busca-eventos";
import { acharCategoria, montarArvore, type CategoriaBase } from "@/lib/categorias-arvore";
import type { EventSearchParams } from "@/lib/event-filters";
import { mensagemGeolocalizacao } from "@/lib/geo";
import { iconeLucide } from "@/lib/perfil";
import { cn } from "@/lib/utils";

const FOCO = "outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light";

function rotuloData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}

export function EventosBusca({
  filters,
  categorias,
  total,
  children,
}: {
  filters: EventSearchParams;
  categorias: CategoriaBase[];
  total: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const painelId = useId();
  const arvore = useMemo(() => montarArvore(categorias), [categorias]);
  const atual = acharCategoria(categorias, filters.categoria);
  const mae = atual ? arvore.find((item) => item.id === (atual.parentId ?? atual.id)) : undefined;
  const [texto, setTexto] = useState(filters.q ?? "");
  const [aberto, setAberto] = useState(false);
  const [km, setKm] = useState(() => kmInicial(filters.distancia));
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTexto(filters.q ?? "");
    setKm(kmInicial(filters.distancia));
  }, [filters.q, filters.distancia]);

  useEffect(() => {
    const atualBusca = (filters.q ?? "").trim();
    if (texto.trim() === atualBusca) return;
    const timer = window.setTimeout(() => {
      router.replace(hrefBusca("/eventos", filters, { q: texto.trim() || null }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [texto, filters, router]);

  useEffect(() => {
    if (!aberto) return;
    function fechar(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [aberto]);

  function ir(patch: Parameters<typeof hrefBusca>[2]) {
    router.push(hrefBusca("/eventos", filters, patch));
  }

  function pertoDeMim() {
    if (!window.isSecureContext) {
      setErro("A localização só funciona em http://localhost ou em um site com HTTPS.");
      return;
    }
    if (!navigator.geolocation) {
      setErro("Seu navegador não informa localização.");
      return;
    }
    setErro(null);
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuscando(false);
        ir({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          distancia: String(kmInicial(filters.distancia)),
        });
      },
      (geoError) => {
        setBuscando(false);
        setErro(mensagemGeolocalizacao(geoError.code));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
  }

  const hoje = ehHoje(filters);
  const fds = ehFimDeSemana(filters);
  const gratis = filters.preco === "gratuito";
  const perto = Boolean(filters.lat && filters.lng);
  const tudo = !filters.de && !filters.ate && !filters.preco && !filters.distancia && !perto;
  const maisAtivo = filters.preco === "pago" || Boolean((filters.de || filters.ate) && !hoje && !fds) || Boolean(filters.distancia);
  const chips = chipsAtivos(filters);
  const fim = fimDeSemana();

  return (
    <div className="relative">
      <div className="sticky top-16 z-30 -mx-4 border-b border-border-light bg-[color-mix(in_srgb,var(--color-surface-light)_92%,transparent)] px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-display text-on-light">Eventos</h1>
          <div className="flex rounded-full bg-muted p-1" role="group" aria-label="Ver eventos">
            <Link href={hrefBusca("/eventos", filters)} aria-current="page" className={cn("rounded-full bg-surface-dark px-3 py-1.5 text-sm font-medium text-on-dark", FOCO)}>
              Lista
            </Link>
            <Link href={hrefBusca("/mapa", filters)} className={cn("rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground", FOCO)}>
              Mapa
            </Link>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-full bg-surface-dark px-4 py-3 text-on-dark">
          <Search className="size-5 shrink-0 text-muted-on-dark" aria-hidden />
          <input
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="O que você quer fazer hoje?"
            className="w-full bg-transparent text-base text-on-dark outline-none placeholder:text-muted-on-dark"
            type="search"
          />
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pilula ativo={tudo} onClick={() => ir({ de: null, ate: null, preco: null, distancia: null, lat: null, lng: null })}>
            Tudo
          </Pilula>
          <Pilula ativo={hoje} onClick={() => ir({ de: diaISO(new Date()), ate: diaISO(new Date()) })}>
            Hoje
          </Pilula>
          <Pilula ativo={fds} onClick={() => ir({ de: fim.de, ate: fim.ate })}>
            Fim de semana
          </Pilula>
          <Pilula ativo={gratis} onClick={() => ir({ preco: gratis ? null : "gratuito" })}>
            Grátis
          </Pilula>
          <Pilula ativo={perto} onClick={pertoDeMim} disabled={buscando}>
            {buscando ? "Buscando localização…" : "Perto de mim"}
          </Pilula>
          <Pilula ativo={maisAtivo || aberto} onClick={() => setAberto((valor) => !valor)} aria-expanded={aberto} aria-controls={painelId}>
            <SlidersHorizontal className="size-4" aria-hidden />
            Mais filtros
          </Pilula>
        </div>
      </div>

      {aberto ? (
        <>
          <button type="button" aria-label="Fechar filtros" className="fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--color-surface-dark)_40%,transparent)] md:bg-transparent" onClick={() => setAberto(false)} />
          <div
            id={painelId}
            ref={painelRef}
            role="dialog"
            aria-label="Mais filtros"
            className="fixed inset-x-0 bottom-0 z-50 grid max-h-[80vh] gap-5 overflow-y-auto rounded-t-card bg-card p-5 shadow-card md:absolute md:inset-x-auto md:bottom-auto md:right-4 md:top-36 md:w-80 md:rounded-card"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-on-light">Mais filtros</p>
              <button type="button" className={cn("grid size-8 place-items-center rounded-full text-muted-foreground", FOCO)} onClick={() => setAberto(false)} aria-label="Fechar">
                <X className="size-4" />
              </button>
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-caption text-muted-foreground">Período</legend>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" aria-label="A partir de" value={filters.de ?? ""} min={diaISO(new Date())} onChange={(event) => ir({ de: event.target.value || null })} className="rounded-control border bg-card px-2 py-2 text-sm" />
                <input type="date" aria-label="Até" value={filters.ate ?? ""} min={filters.de || diaISO(new Date())} onChange={(event) => ir({ ate: event.target.value || null })} className="rounded-control border bg-card px-2 py-2 text-sm" />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-caption text-muted-foreground">Entrada</legend>
              <div className="mt-2 grid grid-cols-3 rounded-full bg-muted p-1" role="radiogroup" aria-label="Entrada">
                {(
                  [
                    ["todos", "Todas"],
                    ["gratuito", "Grátis"],
                    ["pago", "Pago"],
                  ] as const
                ).map(([valor, rotulo]) => {
                  const ativo = (filters.preco ?? "todos") === valor || (!filters.preco && valor === "todos");
                  return (
                    <button key={valor} type="button" role="radio" aria-checked={ativo} onClick={() => ir({ preco: valor === "todos" ? null : valor })} className={cn("rounded-full px-2 py-1.5 text-sm", FOCO, ativo ? "bg-surface-dark text-on-dark" : "text-muted-foreground")}>
                      {rotulo}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="grid gap-2">
              <span className="flex justify-between text-caption text-muted-foreground">
                Distância <span className="text-on-light">até {km} km</span>
              </span>
              <input
                type="range"
                min={1}
                max={50}
                value={km}
                aria-valuetext={`até ${km} quilômetros`}
                onChange={(event) => setKm(Number(event.target.value))}
                onPointerUp={(event) => ir({ distancia: (event.target as HTMLInputElement).value })}
                onKeyUp={(event) => ir({ distancia: (event.target as HTMLInputElement).value })}
                className="accent-[var(--color-accent-solid)]"
              />
              {perto ? null : <span className="text-caption text-muted-foreground">A distância vale depois de Perto de mim.</span>}
            </label>
          </div>
        </>
      ) : null}

      {erro ? <p className="mt-3 text-sm text-danger">{erro}</p> : null}

      {chips.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Filtros ativos">
          {chips.map((chip) => (
            <li key={chip.id}>
              <Link href={chip.href} className={cn("inline-flex items-center gap-1.5 rounded-full bg-surface-dark px-3 py-1.5 text-sm text-on-dark", FOCO)}>
                {chip.rotulo}
                <X className="size-3.5" aria-hidden />
                <span className="sr-only">Remover</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {mae && atual ? (
        <section className="mt-6" aria-labelledby="categoria-titulo">
          <div className="overflow-hidden rounded-card px-5 py-8 sm:px-8" style={{ backgroundColor: corDaCategoria(mae.slug) }}>
            <Link href={hrefBusca("/eventos", filters, { categoria: null })} className={cn("text-sm font-medium text-on-dark underline-offset-4 hover:underline", FOCO)}>
              Voltar
            </Link>
            <h2 id="categoria-titulo" className="mt-3 font-display text-4xl font-semibold tracking-display text-on-dark">
              {atual.nome}
            </h2>
          </div>
          {mae.filhas.length > 0 ? (
            <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Subcategorias de ${mae.nome}`}>
              <li>
                <SubPilula href={hrefBusca("/eventos", filters, { categoria: mae.slug })} ativo={atual.id === mae.id} cor={corDaCategoria(mae.slug)}>
                  Tudo
                </SubPilula>
              </li>
              {mae.filhas.map((filha) => (
                <li key={filha.id}>
                  <SubPilula href={hrefBusca("/eventos", filters, { categoria: filha.slug })} ativo={atual.id === filha.id} cor={corDaCategoria(mae.slug)}>
                    {filha.nome}
                  </SubPilula>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {arvore.map((item) => {
            const Icone = iconeLucide(item.icone);
            return (
              <li key={item.id}>
                <Link
                  href={hrefBusca("/eventos", filters, { categoria: item.slug })}
                  className={cn("group relative block h-28 overflow-hidden rounded-card p-4", FOCO)}
                  style={{ backgroundColor: corDaCategoria(item.slug) }}
                >
                  <span className="font-display text-lg font-semibold leading-tight text-on-dark">{item.nome}</span>
                  <Icone
                    className="pointer-events-none absolute -bottom-4 -right-3 size-24 rotate-[18deg] text-[color-mix(in_srgb,var(--color-on-dark)_82%,transparent)] transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "evento" : "eventos"}
      </p>

      <div className="mt-4">
        {total === 0 ? (
          <div className="max-w-md">
            <p className="text-body-lg text-on-light">Nenhum evento neste recorte.</p>
            {temFiltro(filters) ? (
              <Link href="/eventos" className={cn("mt-4 inline-flex rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-on-dark", FOCO)}>
                Limpar filtros
              </Link>
            ) : null}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function kmInicial(distancia: string | undefined): number {
  const km = Number(distancia);
  return Number.isInteger(km) && km >= 1 && km <= 50 ? km : 10;
}

function chipsAtivos(filters: EventSearchParams): { id: string; rotulo: string; href: string }[] {
  const chips: { id: string; rotulo: string; href: string }[] = [];
  if (filters.q?.trim()) chips.push({ id: "q", rotulo: filters.q.trim(), href: hrefBusca("/eventos", filters, { q: null }) });
  if (ehHoje(filters)) chips.push({ id: "hoje", rotulo: "Hoje", href: hrefBusca("/eventos", filters, { de: null, ate: null }) });
  else if (ehFimDeSemana(filters)) chips.push({ id: "fds", rotulo: "Fim de semana", href: hrefBusca("/eventos", filters, { de: null, ate: null }) });
  else if (filters.de || filters.ate) {
    const rotulo = [filters.de, filters.ate].filter(Boolean).map((iso) => rotuloData(iso!)).join(" – ");
    chips.push({ id: "periodo", rotulo, href: hrefBusca("/eventos", filters, { de: null, ate: null }) });
  }
  if (filters.preco === "gratuito") chips.push({ id: "gratis", rotulo: "Grátis", href: hrefBusca("/eventos", filters, { preco: null }) });
  if (filters.preco === "pago") chips.push({ id: "pago", rotulo: "Pago", href: hrefBusca("/eventos", filters, { preco: null }) });
  if (filters.lat && filters.lng) {
    chips.push({
      id: "perto",
      rotulo: filters.distancia ? `Até ${filters.distancia} km` : "Perto de mim",
      href: hrefBusca("/eventos", filters, { lat: null, lng: null, distancia: null }),
    });
  } else if (filters.distancia) {
    chips.push({ id: "km", rotulo: `Até ${filters.distancia} km`, href: hrefBusca("/eventos", filters, { distancia: null }) });
  }
  return chips;
}

function Pilula({
  ativo,
  children,
  onClick,
  disabled,
  ...resto
}: {
  ativo: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...resto}
      type="button"
      aria-pressed={ativo}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium",
        FOCO,
        ativo ? "bg-surface-dark text-on-dark" : "bg-card text-on-light shadow-card",
      )}
    >
      {children}
    </button>
  );
}

function SubPilula({ href, ativo, cor, children }: { href: string; ativo: boolean; cor: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={cn("inline-flex shrink-0 rounded-full px-3.5 py-2 text-sm font-medium", FOCO, ativo ? "text-on-dark" : "bg-card text-on-light shadow-card")}
      style={ativo ? { backgroundColor: cor } : undefined}
    >
      {children}
    </Link>
  );
}
