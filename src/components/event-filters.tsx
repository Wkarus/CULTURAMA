"use client";

import { useState, type MouseEvent } from "react";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventSearchParams } from "@/lib/event-filters";
import { DISTANCIAS_KM } from "@/lib/event-filters";
import { mensagemGeolocalizacao } from "@/lib/geo";

const selectClass = "h-9 w-full rounded-pill border border-input bg-card px-3 text-sm";

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
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
        const distancia = next.get("distancia");
        if (!distancia || distancia === "todas") next.set("distancia", "10");
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

  const hoje = hojeISO();

  return (
    <form action={action} method="get" className="grid gap-3 rounded-card bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-5">
      <div className="grid gap-1.5">
        <Label htmlFor="categoria" className="text-xs text-muted-foreground">
          Categoria
        </Label>
        <select id="categoria" name="categoria" defaultValue={values.categoria ?? ""} className={selectClass}>
          <option value="">Todas</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
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
        <Label htmlFor="distancia" className="text-xs text-muted-foreground">
          Distância
        </Label>
        <select id="distancia" name="distancia" defaultValue={values.distancia ?? "todas"} className={selectClass}>
          <option value="todas">Qualquer</option>
          {DISTANCIAS_KM.map((km) => (
            <option key={km} value={String(km)}>
              Até {km} km
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name="lat" defaultValue={values.lat ?? ""} />
      <input type="hidden" name="lng" defaultValue={values.lng ?? ""} />
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="outline" onClick={usarLocalizacao} disabled={buscando}>
          {buscando ? "Buscando sua localização…" : "Perto de mim"}
        </Button>
      </div>
      {erro ? <p className="text-sm text-destructive sm:col-span-2 lg:col-span-5">{erro}</p> : null}
      {values.lat && values.lng ? (
        <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-5">
          Mostrando o que está perto da sua posição atual. A localização não fica salva.
        </p>
      ) : values.distancia && values.distancia !== "todas" ? (
        <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-5">
          Distância só vale depois de Perto de mim.
        </p>
      ) : null}
    </form>
  );
}
