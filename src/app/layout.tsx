import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Culturama", template: "%s · Culturama" },
  description: "Batalha de rima, roda de samba, encontro de carros, geek e mais: as cenas da sua cidade no mapa, com rota, Uber e 99.",
};

/** Barra do navegador no celular com a cor do cabeçalho. */
export const viewport: Viewport = {
  themeColor: "#1c1f26",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${ibmPlex.variable} ${spaceGrotesk.variable} ${ibmPlex.className} flex min-h-dvh flex-col bg-background font-sans antialiased`}
      >
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-gradient focus:px-3 focus:py-2 focus:text-on-dark"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <div id="conteudo" className="flex-1">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
