"use client";

import { EventCard } from "@/components/event-card";
import SpotlightCard from "@/components/SpotlightCard";
import type { Category, Event } from "@prisma/client";

type EventoCard = Event & { category: Category | null };

export function EventMosaic({ destaque, demais }: { destaque?: EventoCard; demais: EventoCard[] }) {
  return (
    <div className="mt-16 grid gap-5 lg:grid-cols-3">
      {destaque ? (
        <div className="lg:col-span-2">
          <SpotlightCard>
            <EventCard event={destaque} featured />
          </SpotlightCard>
        </div>
      ) : null}
      {demais.map((event) => (
        <SpotlightCard key={event.id}>
          <EventCard event={event} />
        </SpotlightCard>
      ))}
    </div>
  );
}
