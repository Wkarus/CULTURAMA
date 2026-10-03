import Link from "next/link";
import { AppDownloadModal } from "@/components/app-download-modal";
import { TextLink } from "@/components/text-link";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div className="border-t border-on-dark/10 bg-surface-dark px-4 py-12 text-center text-on-dark">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-display sm:text-3xl">Venha construir esse mapa com a gente.</h2>
          <p className="mt-2 text-sm text-muted-on-dark">Descubra o que está no ar ou publique o seu evento.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <AppDownloadModal triggerText="Baixar o App Culturama" />
            <Link
              href="/cadastro/organizador"
              className="inline-flex min-h-11 items-center justify-center rounded-pill border border-on-dark/20 bg-on-dark/5 px-5 text-sm font-medium text-on-dark outline-none hover:bg-on-dark/10 focus-visible:ring-2 focus-visible:ring-accent-hover"
            >
              Publicar evento
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-surface-light">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-4 py-10 text-caption text-muted-foreground">
          <p>Culturama. Componentes via Skiper UI.</p>
          <nav className="flex flex-wrap gap-5">
            <TextLink href="/eventos">Eventos</TextLink>
            <TextLink href="/mapa">Mapa</TextLink>
            <TextLink href="/#demo">Demonstração</TextLink>
            <TextLink href="/cadastro/organizador">Publicar evento</TextLink>
            <TextLink href="/privacidade">Privacidade</TextLink>
          </nav>
        </div>
      </div>
    </footer>
  );
}
