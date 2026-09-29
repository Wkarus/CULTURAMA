"use client";

import CountUp from "@/components/CountUp";

export function HomeStats({
  eventos,
  cidades,
  organizadores,
}: {
  eventos: number;
  cidades: number;
  organizadores: number;
}) {
  const items = [
    { to: eventos, label: "eventos no ar" },
    { to: cidades, label: "cidades no mapa" },
    { to: organizadores, label: "organizadores verificados" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 glow-spot" aria-hidden />
      <div className="relative mx-auto grid max-w-page gap-10 px-4 py-20 md:grid-cols-3 md:py-24">
        {items.map((item) => (
          <p key={item.label} className="grid gap-2" aria-label={`${item.to} ${item.label}`}>
            <CountUp
              to={item.to}
              duration={1.4}
              separator="."
              className="font-display text-4xl font-semibold tracking-display md:text-5xl"
            />
            <span className="text-body-lg text-muted-foreground">{item.label}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
