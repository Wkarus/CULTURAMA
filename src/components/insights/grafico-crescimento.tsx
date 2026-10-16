"use client";

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { visual } from "@/lib/visual-tokens";

export type PontoCrescimento = { categoria: string; atual: number; anterior: number };

const mix = (cor: string, pct: number) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;

export function GraficoCrescimento({ dados }: { dados: PontoCrescimento[] }) {
  return (
    <figure className="grid gap-3">
      <div className="h-72" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="categoria" tickLine={false} axisLine={false} tick={{ fill: visual.mutedOnLight, fontSize: 12 }} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: visual.mutedOnLight, fontSize: 12 }} width={32} />
            <Tooltip
              cursor={{ fill: mix(visual.onLight, 6) }}
              contentStyle={{
                background: visual.surfaceLight,
                border: `1px solid ${visual.borderLight}`,
                borderRadius: 16,
                color: visual.onLight,
              }}
            />
            <Legend />
            <Bar dataKey="anterior" name="Período anterior" fill={mix(visual.accentTo, 35)} radius={[8, 8, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="atual" name="Período atual" fill={visual.accentSolid} radius={[8, 8, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Interações por categoria, período atual e anterior:{" "}
        {dados.map((ponto) => `${ponto.categoria}, atual ${ponto.atual}, anterior ${ponto.anterior}`).join("; ")}.
      </figcaption>
    </figure>
  );
}
