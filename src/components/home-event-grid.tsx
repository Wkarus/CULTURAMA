"use client";

import { EventCard } from "@/components/event-card";
import SpotlightCard from "@/components/SpotlightCard";
import type { Category, Event } from "@prisma/client";

type EventoCard = Event & { category: Category | null };

export function HomeEventGrid({ events }: { events: EventoCard[] }) {
  if (events.length === 0) return null;

  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <li key={event.id}>
          <SpotlightCard className="shadow-card">
            <EventCard event={event} />
          </SpotlightCard>
        </li>
      ))}
    </ul>
  );
}
