import { TextLink } from "@/components/text-link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-light">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-4 py-16 text-caption text-muted-foreground">
        <p>Culturama. Componentes via Skiper UI.</p>
        <nav className="flex flex-wrap gap-5">
          <TextLink href="/eventos">Eventos</TextLink>
          <TextLink href="/mapa">Mapa</TextLink>
          <TextLink href="/cadastro/organizador">Publicar evento</TextLink>
          <TextLink href="/privacidade">Privacidade</TextLink>
        </nav>
      </div>
    </footer>
  );
}
