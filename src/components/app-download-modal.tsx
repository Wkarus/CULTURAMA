"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { Apple, ArrowRight, Smartphone, Sparkles, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppDownloadModal({
  triggerText = "Baixar o App",
  variant = "default",
  className,
}: {
  triggerText?: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(next) => {
        setAberto(next);
        if (!next) setAviso(null);
      }}
    >
      <Dialog.Trigger className={cn(buttonVariants({ variant }), "gap-2 font-medium shadow-cta", className)}>
        <Smartphone className="size-4" aria-hidden />
        {triggerText}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-surface-dark/75 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="panel-dark fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden overscroll-contain rounded-card p-6 text-on-dark shadow-card transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none sm:p-8">
          <Dialog.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full text-muted-on-dark outline-none hover:bg-on-dark/10 hover:text-on-dark focus-visible:ring-2 focus-visible:ring-accent-hover"
          >
            <X className="size-5" aria-hidden />
          </Dialog.Close>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-pill border border-accent-from/30 bg-accent-from/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-hover">
            <Sparkles className="size-3.5" aria-hidden />
            Aplicativo Culturama
          </div>

          <Dialog.Title className="font-display text-2xl font-bold tracking-display text-on-dark sm:text-3xl">
            Cultura no seu bolso, num só app.
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-on-dark sm:text-base">
            As lojas ainda não têm o aplicativo. A versão web do mapa e da lista já funciona.
          </Dialog.Description>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAviso("Em breve na App Store.")}
              className="flex min-h-11 items-center gap-3.5 rounded-control border border-on-dark/15 bg-on-dark/5 p-3.5 text-left outline-none hover:border-accent-from hover:bg-on-dark/10 focus-visible:ring-2 focus-visible:ring-accent-hover"
            >
              <span className="grid size-10 place-items-center rounded-control bg-on-dark/10 text-on-dark">
                <Apple className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[11px] font-medium uppercase text-muted-on-dark">Em breve na</span>
                <span className="font-display text-sm font-bold text-on-dark">App Store</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAviso("Em breve no Google Play.")}
              className="flex min-h-11 items-center gap-3.5 rounded-control border border-on-dark/15 bg-on-dark/5 p-3.5 text-left outline-none hover:border-accent-from hover:bg-on-dark/10 focus-visible:ring-2 focus-visible:ring-accent-hover"
            >
              <span className="grid size-10 place-items-center rounded-control bg-on-dark/10 text-on-dark">
                <Smartphone className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[11px] font-medium uppercase text-muted-on-dark">Em breve no</span>
                <span className="font-display text-sm font-bold text-on-dark">Google Play</span>
              </span>
            </button>
          </div>

          {aviso ? (
            <p role="status" aria-live="polite" className="mt-4 text-sm text-accent-hover">
              {aviso}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Link
              href="/mapa"
              onClick={() => setAberto(false)}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-pill bg-accent-gradient px-4 text-xs font-semibold text-on-dark shadow-cta outline-none focus-visible:ring-2 focus-visible:ring-accent-hover"
            >
              Abrir o mapa
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
