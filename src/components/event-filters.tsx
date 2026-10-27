"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acharCategoria, montarArvore } from "@/lib/categorias-arvore";
import { RAIO_KM, raioDoFiltro, type EventSearchParams } from "@/lib/event-filters";
import { mensagemGeolocalizacao } from "@/lib/geo";
import { iconeLucide } from "@/lib/perfil";
import { cn } from "@/lib/utils";

const selectClass = "h-9 w-full rounded-pill border border-input bg-card px-3 text-sm";

function ChipSub({
  ativo,
  onClick,
  icone: Icone,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-medium transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-2",
        ativo ? "border-transparent bg-accent-gradient text-on-dark shadow-cta" : "border-input bg-card hover:bg-muted",
      )}
    >
      <Icone className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {children}
    </button>
  );
}

function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function paramsFromForm(form: HTMLFormElement, values: EventSearchParams): URLSearchParams {
  const data = new FormData(form);
  const next = new URLSearchParams();
  for (const key of ["categoria", "de", "ate", "preco", "distancia"] as const) {
    const raw = String(data.get(key) ?? values[key] ?? "").trim();
    if (raw) next.set(key, raw);
  }
  return next;
}

export function EventFilters({
  categorias,
  values,
  action,
}: {
  categorias: Category[];
  values: EventSearchParams;
  action: "/eventos" | "/mapa";
}) {
  const router = useRouter();
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const perto = Boolean(values.lat && values.lng);
  const [km, setKm] = useState(() => raioDoFiltro(values.distancia) ?? RAIO_KM.padrao);
  useEffect(() => {
    setKm(raioDoFiltro(values.distancia) ?? RAIO_KM.padrao);
  }, [values.distancia]);
  const arvore = useMemo(() => montarArvore(categorias), [categorias]);
  const [maeId, setMaeId] = useState(() => {
    const atual = acharCategoria(categorias, values.categoria);
    return atual ? (atual.parentId ?? atual.id) : "";
  });
  const [subId, setSubId] = useState(() => {
    const atual = acharCategoria(categorias, values.categoria);
    return atual?.parentId ? atual.id : "";
  });
  const mae = arvore.find((m) => m.id === maeId);
  const valorCategoria = (subId && mae?.filhas.find((f) => f.id === subId)?.slug) || mae?.slug || "";

  function usarLocalizacao(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget.form;
    if (!form) return;

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
        const next = paramsFromForm(form, values);
        next.set("distancia", String(km));
        next.set("lat", pos.coords.latitude.toFixed(6));
        next.set("lng", pos.coords.longitude.toFixed(6));
        window.location.assign(`${action}?${next.toString()}`);
      },
      (geoError) => {
        setBuscando(false);
        setErro(mensagemGeolocalizacao(geoError.code));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
  }

  /** Soltar o controle já refaz a busca com o novo raio, sem precisar clicar em Filtrar. */
  function aplicarRaio(input: HTMLInputElement) {
    if (!perto || !input.form) return;
    const next = paramsFromForm(input.form, values);
    next.set("lat", values.lat ?? "");
    next.set("lng", values.lng ?? "");
    if (next.get("distancia") === values.distancia) return;
    router.push(`${action}?${next.toString()}`, { scroll: false });
  }

  function verTudo(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const next = paramsFromForm(form, values);
    next.delete("distancia");
    router.push(`${action}?${next.toString()}`, { scroll: false });
  }

  const hoje = hojeISO();

  return (
    <form action={action} method="get" className="grid gap-3 rounded-card bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-5">
      <div className="grid gap-1.5">
        <Label htmlFor="categoria" className="text-xs text-muted-foreground">
          Categoria
        </Label>
        <select
          id="categoria"
          value={maeId}
          onChange={(e) => {
            setMaeId(e.target.value);
            setSubId("");
          }}
          className={selectClass}
        >
          <option value="">Todas</option>
          {arvore.map((mae) => (
            <option key={mae.id} value={mae.id}>
              {mae.nome}
            </option>
          ))}
        </select>
        <input type="hidden" name="categoria" value={valorCategoria} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="de" className="text-xs text-muted-foreground">
          A partir de
        </Label>
        <Input id="de" name="de" type="date" min={hoje} defaultValue={values.de ?? ""} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ate" className="text-xs text-muted-foreground">
          Até
        </Label>
        <Input id="ate" name="ate" type="date" min={hoje} defaultValue={values.ate ?? ""} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="preco" className="text-xs text-muted-foreground">
          Entrada
        </Label>
        <select id="preco" name="preco" defaultValue={values.preco ?? "todos"} className={selectClass}>
          <option value="todos">Todas</option>
          <option value="gratuito">Gratuita</option>
          <option value="pago">Paga</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="distancia" className="flex justify-between text-xs text-muted-foreground">
          Raio <span className="text-foreground">{perto ? `até ${km} km` : "Brasil todo"}</span>
        </Label>
        <input
          id="distancia"
          name={perto ? "distancia" : undefined}
          type="range"
          min={RAIO_KM.min}
          max={RAIO_KM.max}
          value={km}
          disabled={!perto}
          aria-valuetext={`até ${km} quilômetros`}
          onChange={(event) => setKm(Number(event.target.value))}
          onPointerUp={(event) => aplicarRaio(event.currentTarget)}
          onKeyUp={(event) => aplicarRaio(event.currentTarget)}
          className="h-9 w-full accent-[var(--color-accent-solid)] disabled:opacity-40"
        />
      </div>
      {mae && mae.filhas.length > 0 ? (
        <div role="group" aria-label={`Subcategorias de ${mae.nome}`} className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
          <ChipSub ativo={!subId} onClick={() => setSubId("")} icone={iconeLucide(mae.icone)}>
            Tudo em {mae.nome}
          </ChipSub>
          {mae.filhas.map((filha) => (
            <ChipSub key={filha.id} ativo={subId === filha.id} onClick={() => setSubId(filha.id)} icone={iconeLucide(filha.icone)}>
              {filha.nome}
            </ChipSub>
          ))}
        </div>
      ) : null}
      <input type="hidden" name="lat" value={values.lat ?? ""} />
      <input type="hidden" name="lng" value={values.lng ?? ""} />
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="outline" onClick={usarLocalizacao} disabled={buscando}>
          {buscando ? "Buscando sua localização…" : "Perto de mim"}
        </Button>
        {perto ? (
          <Button type="button" variant="ghost" onClick={verTudo}>
            Ver o Brasil todo
          </Button>
        ) : null}
      </div>
      {erro ? <p className="text-sm text-destructive sm:col-span-2 lg:col-span-5">{erro}</p> : null}
      <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-5">
        {perto
          ? "Arraste o raio para ver mais longe ou mais perto da sua posição. A localização não fica salva."
          : "Mostrando eventos de todo o Brasil. Use Perto de mim para limitar por distância."}
      </p>
    </form>
  );
}
