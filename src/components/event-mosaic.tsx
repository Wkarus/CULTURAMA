import type { Category, Event } from "@prisma/client";
import { EventCard } from "@/components/event-card";

type EventoCard = Event & { category: Category | null };

/** Lista uniforme: 2 colunas no tablet, 4 no desktop. No mobile os cards empilham para a página inteira continuar rolável. */
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
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} favorito={favoritos.has(event.id)} logado={logado} />
        </li>
      ))}
    </ul>
  );
}
