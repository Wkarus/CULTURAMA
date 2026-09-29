"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventSearchParams } from "@/lib/event-filters";
import { DISTANCIAS_KM } from "@/lib/event-filters";

const selectClass = "h-9 w-full rounded-pill border border-input bg-card px-3 text-sm";

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

  function usarLocalizacao() {
    if (!navigator.geolocation) {
      window.alert("Seu navegador não informa localização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = new URLSearchParams();
        if (values.categoria) next.set("categoria", values.categoria);
        if (values.de) next.set("de", values.de);
        if (values.ate) next.set("ate", values.ate);
        if (values.preco) next.set("preco", values.preco);
        next.set("distancia", values.distancia && values.distancia !== "todas" ? values.distancia : "10");
        next.set("lat", String(pos.coords.latitude));
        next.set("lng", String(pos.coords.longitude));
        router.push(`${action}?${next.toString()}`);
      },
      () => {
        window.alert("Não consegui ler a localização. Permita o acesso só nesta vez, para filtrar por distância.");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  return (
    <form action={action} method="get" className="grid gap-3 rounded-card bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-6">
      <div className="grid gap-1.5">
        <Label htmlFor="categoria">Categoria</Label>
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
        <Label htmlFor="de">A partir de</Label>
        <Input id="de" name="de" type="date" defaultValue={values.de ?? ""} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ate">Até</Label>
        <Input id="ate" name="ate" type="date" defaultValue={values.ate ?? ""} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="preco">Entrada</Label>
        <select id="preco" name="preco" defaultValue={values.preco ?? "todos"} className={selectClass}>
          <option value="todos">Todas</option>
          <option value="gratuito">Gratuita</option>
          <option value="pago">Paga</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="distancia">Distância</Label>
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
      <div className="flex flex-wrap items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="outline" onClick={usarLocalizacao}>
          Perto de mim
        </Button>
      </div>
      {values.distancia && values.distancia !== "todas" && !values.lat ? (
        <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-6">
          Distância só vale depois de Perto de mim.
        </p>
      ) : null}
    </form>
  );
}
