"use client";

import { useEffect, useState, useTransition } from "react";
import { AdvancedMarker, APIProvider, Map, Pin, useMap, type MapMouseEvent } from "@vis.gl/react-google-maps";
import { LocateFixed } from "lucide-react";
import { localizarEndereco } from "@/actions/eventos";
import { SAO_PAULO } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { visual } from "@/lib/visual-tokens";

type Ponto = { lat: number; lng: number };

function Centralizar({ ponto, versao }: { ponto: Ponto; versao: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && versao > 0) {
      map.panTo(ponto);
      map.setZoom(16);
    }
    // Só recentraliza quando o endereço é localizado, não a cada arraste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, versao]);
  return null;
}

/**
 * Hidden inputs `latitude`, `longitude` e `pinManual`. Com `pinManual=1` o servidor usa o pino;
 * com `0` geocodifica o endereço. Mudar o texto do endereço volta para `0` até o pino ser mexido de novo.
 */
export function PinoMapa({
  inicial,
  enderecoId,
  escuro = false,
}: {
  inicial: Ponto | null;
  enderecoId: string;
  escuro?: boolean;
}) {
  const chave = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
  const [ponto, setPonto] = useState<Ponto>(inicial ?? SAO_PAULO);
  const [manual, setManual] = useState(Boolean(inicial));
  const [versao, setVersao] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, iniciar] = useTransition();

  useEffect(() => {
    const campo = document.getElementById(enderecoId);
    if (!campo) return;
    const soltar = () => setManual(false);
    campo.addEventListener("input", soltar);
    return () => campo.removeEventListener("input", soltar);
  }, [enderecoId]);

  const mover = (novo: Ponto) => {
    setPonto(novo);
    setManual(true);
    setAviso(null);
  };

  const localizar = () => {
    const campo = document.getElementById(enderecoId) as HTMLInputElement | null;
    iniciar(async () => {
      const r = await localizarEndereco(campo?.value ?? "");
      if (r.lat !== undefined && r.lng !== undefined) {
        mover({ lat: r.lat, lng: r.lng });
        setVersao((v) => v + 1);
      } else {
        setAviso(r.error ?? "Não achei esse endereço.");
      }
    });
  };

  const textoFraco = escuro ? "text-muted-on-dark" : "text-muted-foreground";

  return (
    <div className="grid gap-2">
      <input type="hidden" name="latitude" value={ponto.lat} />
      <input type="hidden" name="longitude" value={ponto.lng} />
      <input type="hidden" name="pinManual" value={manual ? "1" : "0"} />

      {chave ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn("text-sm", textoFraco)}>
              {manual ? "O evento fica onde está o pino." : "Sem pino: a posição vem do endereço ao salvar."}
            </p>
            <button
              type="button"
              onClick={localizar}
              disabled={buscando}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-[0.8rem] font-medium disabled:opacity-50",
                escuro ? "chip-dark text-on-dark" : "border border-border bg-card",
              )}
            >
              <LocateFixed className="size-3.5" aria-hidden />
              {buscando ? "Procurando…" : "Localizar endereço"}
            </button>
          </div>
          <div className="h-64 overflow-hidden rounded-sm" aria-label="Mapa: arraste o pino ou clique para posicionar o evento" role="group">
            <APIProvider apiKey={chave} language="pt-BR" region="BR">
              <Map
                defaultCenter={ponto}
                defaultZoom={inicial ? 16 : 11}
                gestureHandling="cooperative"
                disableDefaultUI
                zoomControl
                clickableIcons={false}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
                style={{ width: "100%", height: "100%" }}
                onClick={(e: MapMouseEvent) => {
                  const ll = e.detail.latLng;
                  if (ll) mover(ll);
                }}
              >
                <Centralizar ponto={ponto} versao={versao} />
                <AdvancedMarker
                  position={ponto}
                  draggable
                  title="Arraste para ajustar o local"
                  onDragEnd={(e: google.maps.MapMouseEvent) => {
                    if (e.latLng) mover({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  }}
                >
                  <Pin background={visual.accentTo} borderColor={visual.surfaceDark} glyphColor={visual.onDark} />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
        </>
      ) : (
        <p className={cn("text-sm", textoFraco)}>Mapa indisponível sem a chave do Google Maps: a posição vem do endereço ao salvar.</p>
      )}
      <p aria-live="polite" className={cn("text-sm empty:hidden", escuro ? "text-danger" : "text-destructive")}>
        {aviso}
      </p>
    </div>
  );
}
