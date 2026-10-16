"use client";

import { useMemo, useState } from "react";
import { Bus, Car, PersonStanding } from "lucide-react";
import { CliqueExterno } from "@/components/clique-externo";
import { RotaMapa } from "@/components/rota-mapa";
import { registrarClique } from "@/actions/insights";
import { Button, buttonVariants } from "@/components/ui/button";
import { isRotaOk, type ModoRota, type RotaModo, type RotaOk } from "@/lib/directions";
import { mensagemGeolocalizacao } from "@/lib/geo";
import { googleMapsDirLink, noventaNoveLink, uberDeepLink } from "@/lib/transporte";
import { cn } from "@/lib/utils";

const MODO_META: { id: ModoRota; label: string; Icon: typeof Car }[] = [
  { id: "driving", label: "Carro", Icon: Car },
  { id: "transit", label: "Ônibus e metrô", Icon: Bus },
  { id: "walking", label: "A pé", Icon: PersonStanding },
];

export function RotaPainel({
  eventId,
  lat,
  lng,
  titulo,
  apiKey,
}: {
  eventId: string;
  lat: number;
  lng: number;
  titulo: string;
  apiKey?: string;
}) {
  const [modos, setModos] = useState<RotaModo[] | null>(null);
  const [modoAtivo, setModoAtivo] = useState<ModoRota>("driving");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const uber = uberDeepLink(lat, lng, titulo);
  const noventaNove = noventaNoveLink(lat, lng, titulo);
  const mapsKey = (apiKey || "").trim();

  const rota = useMemo(() => {
    const escolhida = modos?.find((item) => item.modo === modoAtivo);
    if (escolhida && isRotaOk(escolhida)) return escolhida;
    return modos?.find(isRotaOk) ?? null;
  }, [modos, modoAtivo]);

  function calcular() {
    if (!window.isSecureContext) {
      setErro("A localização só funciona em http://localhost ou em um site com HTTPS.");
      return;
    }
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
          const payload = (await response.json()) as { modos?: RotaModo[]; error?: string };
          if (!response.ok || !payload.modos) {
            setErro(payload.error ?? "Não calculei as rotas.");
            setModos(null);
            return;
          }
          setModos(payload.modos);
          const primeira = payload.modos.find(isRotaOk);
          if (primeira) setModoAtivo(primeira.modo);
        } catch {
          setErro("Falha de rede ao pedir as rotas.");
        } finally {
          setCarregando(false);
        }
      },
      (geoError) => {
        setCarregando(false);
        setErro(mensagemGeolocalizacao(geoError.code));
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
  }

  return (
    <section className="overflow-hidden rounded-card bg-card shadow-card">
      <div className="grid gap-3 p-6">
        <h2 className="text-display">Como chegar</h2>
        <p className="text-sm text-muted-foreground">
          Mapa e passos a partir de onde você está agora. A localização não fica salva.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              void registrarClique(eventId, "como_chegar");
              calcular();
            }}
            disabled={carregando}
          >
            {carregando ? "Traçando rota…" : modos ? "Atualizar rota" : "Traçar rota"}
          </Button>
          <CliqueExterno href={uber} eventoId={eventId} tipo="como_chegar" className={cn(buttonVariants({ variant: "outline" }))}>
            Ir de Uber
          </CliqueExterno>
          <CliqueExterno href={noventaNove} eventoId={eventId} tipo="como_chegar" className={cn(buttonVariants({ variant: "outline" }))}>
            Ir de 99
          </CliqueExterno>
        </div>
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
      </div>

      {rota && modos ? <PainelRota modos={modos} rota={rota} modoAtivo={modoAtivo} onModo={setModoAtivo} apiKey={mapsKey} /> : null}
    </section>
  );
}

function PainelRota({
  modos,
  rota,
  modoAtivo,
  onModo,
  apiKey,
}: {
  modos: RotaModo[];
  rota: RotaOk;
  modoAtivo: ModoRota;
  onModo: (modo: ModoRota) => void;
  apiKey: string;
}) {
  const mapsHref = googleMapsDirLink(rota.origem.lat, rota.origem.lng, rota.destino.lat, rota.destino.lng, rota.modo);

  return (
    <div className="grid border-t border-border lg:grid-cols-[minmax(280px,22rem)_minmax(0,1fr)]">
      <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto p-6 lg:max-h-[640px]">
        <div className="grid gap-3">
          <div className="flex gap-1 rounded-pill bg-muted p-1">
            {MODO_META.map(({ id, label, Icon }) => {
              const item = modos.find((modo) => modo.modo === id);
              const ok = item ? isRotaOk(item) : false;
              const ativo = modoAtivo === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!ok}
                  title={ok ? label : item && !isRotaOk(item) ? item.erro : label}
                  onClick={() => ok && onModo(id)}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center rounded-pill transition-colors",
                    ativo ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                    !ok && "cursor-not-allowed opacity-40",
                  )}
                  aria-pressed={ativo}
                  aria-label={label}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
          <p className="text-display">
            {rota.duracao}
            <span className="ml-2 text-base text-muted-foreground">{rota.distancia}</span>
          </p>
        </div>

        <ol className="grid gap-0">
          <li className="grid grid-cols-[20px_1fr] gap-3">
            <span className="mt-1.5 size-2.5 rounded-full bg-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Você</p>
              <p className="text-sm">{rota.origem.endereco}</p>
            </div>
          </li>
          {rota.passos.map((passo, index) => (
            <li key={`${index}-${passo.instrucao}`} className="grid grid-cols-[20px_1fr] gap-3">
              <span className="relative flex justify-center">
                <span className="absolute inset-y-0 w-px bg-border" />
                <span className="relative z-[1] mt-2 size-1.5 rounded-full bg-[#cccccc]" />
              </span>
              <div className="border-t border-border py-3">
                <p className="text-sm">{passo.instrucao}</p>
                {passo.distancia ? <p className="mt-1 text-xs text-muted-foreground">{passo.distancia}</p> : null}
              </div>
            </li>
          ))}
          <li className="grid grid-cols-[20px_1fr] gap-3">
            <span className="mt-1.5 size-2.5 rounded-full bg-primary" />
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Evento</p>
              <p className="text-sm">{rota.destino.endereco}</p>
            </div>
          </li>
        </ol>

        <a href={mapsHref} target="_blank" rel="noreferrer" className="link-quiet text-caption">
          Abrir no Google Maps
        </a>
      </div>
      <div className="min-h-[280px] bg-muted lg:min-h-[640px]">
        <RotaMapa rota={rota} apiKey={apiKey} />
      </div>
    </div>
  );
}
