import type { Category, Event } from "@prisma/client";
import { EventCard } from "@/components/event-card";

type EventoCard = Event & { category: Category | null };

/** Lista uniforme: 2 colunas já no celular (cabem 4 eventos por tela), 4 no desktop. */
export function EventMosaic({
  events,
  favoritos,
  logado,
}: {
  events: EventoCard[];
  favoritos: Set<string>;
  logado: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-5 lg:grid-cols-4">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} favorito={favoritos.has(event.id)} logado={logado} />
        </li>
      ))}
    </ul>
  );
}
