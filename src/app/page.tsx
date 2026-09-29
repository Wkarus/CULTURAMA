import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-page flex-col gap-12 px-4 py-20">
      <p className="text-sm text-muted-foreground">Descoberta cultural</p>
      <h1 className="text-[20px] font-medium tracking-display sm:text-4xl">Culturama</h1>
      <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
        Encontre shows, teatro e eventos de rua no mapa, compare como chegar e abra Uber ou 99 com o destino pronto.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/mapa" className={cn(buttonVariants())}>
          Ver no mapa
        </Link>
        <Link href="/eventos" className={cn(buttonVariants({ variant: "outline" }))}>
          Ver lista
        </Link>
      </div>
    </main>
  );
}
