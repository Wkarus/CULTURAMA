"use client";

import { useEffect } from "react";
import { AdvancedMarker, APIProvider, Map, Pin, Polyline, useMap } from "@vis.gl/react-google-maps";
import type { RotaOk } from "@/lib/directions";
import { visual } from "@/lib/visual-tokens";

function EnquadrarRota({ bounds }: { bounds: RotaOk["bounds"] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.fitBounds(bounds, 56);
  }, [map, bounds]);
  return null;
}

function RotaCanvas({ rota }: { rota: RotaOk }) {
  return (
    <Map
      defaultCenter={{ lat: rota.origem.lat, lng: rota.origem.lng }}
      defaultZoom={13}
      defaultTilt={0}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
      style={{ width: "100%", height: "100%" }}
      clickableIcons={false}
    >
      <EnquadrarRota bounds={rota.bounds} />
      <Polyline encodedPath={rota.polyline} strokeColor={visual.surfaceDark} strokeOpacity={0.2} strokeWeight={10} geodesic />
      <Polyline encodedPath={rota.polyline} strokeColor={visual.accentTo} strokeOpacity={1} strokeWeight={5} geodesic />
      <AdvancedMarker position={{ lat: rota.origem.lat, lng: rota.origem.lng }} title="Você">
        <Pin background={visual.onLight} borderColor={visual.onDark} glyphColor={visual.onDark} />
      </AdvancedMarker>
      <AdvancedMarker position={{ lat: rota.destino.lat, lng: rota.destino.lng }} title="Evento">
        <Pin background={visual.accentTo} borderColor={visual.surfaceDark} glyphColor={visual.onDark} />
      </AdvancedMarker>
    </Map>
  );
}

export function RotaMapa({ rota, apiKey }: { rota: RotaOk; apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[240px] items-center bg-muted px-6">
        <p className="text-sm text-muted-foreground">O mapa da rota usa a mesma chave da Maps JavaScript API.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} language="pt-BR" region="BR">
      <RotaCanvas key={rota.modo} rota={rota} />
    </APIProvider>
  );
}
