"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { visual } from "@/lib/visual-tokens";

export type FatiaCategoria = { nome: string; total: number };

const mix = (cor: string, pct: number) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;

export function GraficoCategorias({ dados }: { dados: FatiaCategoria[] }) {
  const altura = Math.max(160, dados.length * 40);

  return (
    <figure className="grid gap-3">
      <div style={{ height: altura }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap={10}>
            <defs>
              <linearGradient id="barra-categoria" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={visual.accentFrom} />
                <stop offset="100%" stopColor={visual.accentTo} />
              </linearGradient>
            </defs>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="nome"
              width={128}
              tickLine={false}
              axisLine={false}
              tick={{ fill: visual.mutedOnDark, fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: mix(visual.onDark, 5) }}
              contentStyle={{
                background: visual.surfaceDark,
                border: `1px solid ${mix(visual.onDark, 14)}`,
                borderRadius: 12,
                color: visual.onDark,
              }}
              itemStyle={{ color: visual.onDark }}
              labelStyle={{ color: visual.mutedOnDark }}
              formatter={(valor) => [`${valor} eventos`, ""]}
              separator=""
            />
            <Bar dataKey="total" fill="url(#barra-categoria)" radius={[0, 8, 8, 0]} isAnimationActive={false}>
              <LabelList dataKey="total" position="right" fill={visual.onDark} fontSize={13} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Eventos publicados por categoria: {dados.map((fatia) => `${fatia.nome}, ${fatia.total}`).join("; ")}.
      </figcaption>
    </figure>
  );
}
