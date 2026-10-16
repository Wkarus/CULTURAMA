import type { ReactNode } from "react";
import { exigirEmpresa } from "@/lib/insights-acesso";
import { modoDemo } from "@/lib/insights-coleta";

export const dynamic = "force-dynamic";

export default async function InsightsLayout({ children }: { children: ReactNode }) {
  const acesso = await exigirEmpresa();
  const demo = modoDemo();
  return (
    <div className="bg-surface-light text-on-light">
      {demo ? (
        <p className="bg-warning-bg px-4 py-2 text-center text-sm font-medium text-warning">Dados de demonstração</p>
      ) : null}
      <div className="mx-auto max-w-page px-4 py-8">
        <p className="text-sm text-muted-foreground">{acesso.razao}</p>
        {children}
      </div>
    </div>
  );
}
