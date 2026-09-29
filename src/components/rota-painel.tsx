"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { noventaNoveLink, uberDeepLink } from "@/lib/transporte";
import { cn } from "@/lib/utils";

type ModoOk = { modo: string; label: string; duracao: string; distancia: string };
type ModoErro = { modo: string; label: string; erro: string };
type Modo = ModoOk | ModoErro;

function isOk(modo: Modo): modo is ModoOk {
  return "duracao" in modo;
}

export function RotaPainel({
  eventId,
  lat,
  lng,
  titulo,
}: {
  eventId: string;
  lat: number;
  lng: number;
  titulo: string;
}) {
  const [modos, setModos] = useState<Modo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const uber = uberDeepLink(lat, lng, titulo);
  const noventaNove = noventaNoveLink(lat, lng, titulo);

  function calcular() {
    if (!navigator.geolocation) {
      setErro("Seu navegador não informa localização.");
      return;
    }
    setCarregando(true);
    setErro(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const response = await fetch("/api/rotas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId,
              originLat: pos.coords.latitude,
              originLng: pos.coords.longitude,
            }),
          });
          const payload = (await response.json()) as { modos?: Modo[]; error?: string };
          if (!response.ok || !payload.modos) {
            setErro(payload.error ?? "Não calculei as rotas.");
            setModos(null);
            return;
          }
          setModos(payload.modos);
        } catch {
          setErro("Falha de rede ao pedir as rotas.");
        } finally {
          setCarregando(false);
        }
      },
      () => {
        setCarregando(false);
        setErro("Permita a localização só nesta vez para comparar os tempos.");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  return (
    <section className="grid gap-4 rounded-card bg-card p-6 shadow-card">
      <h2 className="text-lg font-medium tracking-display">Como chegar</h2>
      <p className="text-sm text-muted-foreground">
        Comparamos carro, transporte público e caminhada a partir de onde você está agora. A localização não fica salva.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={calcular} disabled={carregando}>
          {carregando ? "Calculando…" : "Comparar rotas"}
        </Button>
        <a href={uber} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
          Ir de Uber
        </a>
        <a href={noventaNove} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }))}>
          Ir de 99
        </a>
      </div>
      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {modos ? (
        <ul className="grid gap-3 sm:grid-cols-3">
          {modos.map((modo) => (
            <li key={modo.modo} className="rounded-card bg-muted p-4">
              <p className="text-sm font-medium">{modo.label}</p>
              {isOk(modo) ? (
                <>
                  <p className="mt-2 text-2xl tracking-display">{modo.duracao}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{modo.distancia}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{modo.erro}</p>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
