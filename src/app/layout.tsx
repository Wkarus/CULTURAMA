import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Culturama",
  description: "Descoberta de eventos culturais — mapa, rotas e comunidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <div id="conteudo">{children}</div>
      </body>
    </html>
  );
}
