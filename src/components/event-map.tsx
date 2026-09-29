"use client";

import { useCallback, useMemo, useState } from "react";
import { AdvancedMarker, APIProvider, InfoWindow, Map, Pin, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import Link from "next/link";
import type { MapEventPin } from "@/lib/event-filters";
import { hasValidCoords, SAO_PAULO } from "@/lib/geo";

function MarkerWithInfo({ event, selectedId, onSelect }: { event: MapEventPin; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const open = selectedId === event.id;
  const data = new Date(event.dataIso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <AdvancedMarker ref={markerRef} position={{ lat: event.latitude, lng: event.longitude }} onClick={() => onSelect(event.id)} title={event.titulo}>
        <Pin background="#5433eb" borderColor="#332f2d" glyphColor="#ffffff" />
      </AdvancedMarker>
      {open && marker ? (
        <InfoWindow anchor={marker} onCloseClick={() => onSelect(null)}>
          <div className="max-w-56 p-1">
            <p className="text-sm font-medium text-black">{event.titulo}</p>
            <p className="mt-1 text-xs text-neutral-600">{data}</p>
            <p className="mt-1 text-xs text-neutral-600">{event.gratuito ? "Entrada franca" : "Pago"}</p>
            <Link href={`/eventos/${event.id}`} className="mt-2 inline-block text-sm text-[#5433eb] underline underline-offset-4">
              Ver evento
            </Link>
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}

function MapCanvas({ events, center }: { events: MapEventPin[]; center: { lat: number; lng: number } }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const onSelect = useCallback((id: string | null) => setSelectedId(id), []);

  return (
    <Map
      defaultCenter={center}
      defaultZoom={12}
      defaultTilt={47}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
      style={{ width: "100%", height: "100%" }}
      clickableIcons={false}
    >
      {events.map((event) => (
        <MarkerWithInfo key={event.id} event={event} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </Map>
  );
}

export function EventMap({ events, userCenter }: { events: MapEventPin[]; userCenter?: { lat: number; lng: number } | null }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const pins = useMemo(() => events.filter((event) => hasValidCoords(event.latitude, event.longitude)), [events]);
  const center = userCenter ?? (pins[0] ? { lat: pins[0].latitude, lng: pins[0].longitude } : SAO_PAULO);

  if (!key) {
    return (
      <div className="flex min-h-[420px] items-center rounded-card bg-card p-6 shadow-card">
        <p className="max-w-md text-sm text-muted-foreground">
          Para ver o mapa, coloque a chave da Maps JavaScript API em <code className="text-foreground">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> no .env e
          reinicie o servidor.
        </p>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center rounded-card bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">Nenhum evento com coordenada neste filtro. Ajuste a data, a categoria ou a distância.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card shadow-card" style={{ height: "min(70dvh, 640px)" }}>
      <APIProvider apiKey={key} language="pt-BR" region="BR">
        <MapCanvas events={pins} center={center} />
      </APIProvider>
    </div>
  );
}
