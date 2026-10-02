import {
  AudioWaveform,
  Bike,
  BookOpen,
  Car,
  ChessKnight,
  Crown,
  Dices,
  Disc3,
  Drama,
  Drum,
  Feather,
  Footprints,
  Frame,
  Gamepad2,
  Goal,
  Guitar,
  HandFist,
  Headphones,
  HeartHandshake,
  Joystick,
  Landmark,
  Medal,
  MessageCircle,
  Mic,
  MicVocal,
  Music,
  Music2,
  Music4,
  Orbit,
  Palette,
  PartyPopper,
  Piano,
  ShoppingBasket,
  Sparkles,
  SprayCan,
  Sprout,
  Store,
  Sun,
  Tent,
  Theater,
  Timer,
  Trophy,
  Tv,
  Users,
  UtensilsCrossed,
  VenetianMask,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIAS_ARVORE, type IconeCategoria } from "@/lib/categorias-dados";

export function iniciais({ nome, email }: { nome: string | null; email: string | null }): string {
  const base = nome?.trim() || email?.split("@")[0] || "";
  const partes = base.split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : base.slice(0, 2);
  return letras.toUpperCase() || "?";
}

const ICONES: Record<IconeCategoria, LucideIcon> = {
  AudioWaveform,
  Bike,
  BookOpen,
  Car,
  ChessKnight,
  Crown,
  Dices,
  Disc3,
  Drama,
  Drum,
  Feather,
  Footprints,
  Frame,
  Gamepad2,
  Goal,
  Guitar,
  HandFist,
  Headphones,
  HeartHandshake,
  Joystick,
  Landmark,
  Medal,
  MessageCircle,
  Mic,
  MicVocal,
  Music,
  Music2,
  Music4,
  Orbit,
  Palette,
  PartyPopper,
  Piano,
  ShoppingBasket,
  SprayCan,
  Sprout,
  Store,
  Sun,
  Tent,
  Theater,
  Timer,
  Trophy,
  Tv,
  Users,
  UtensilsCrossed,
  VenetianMask,
  Waves,
};

/** Ícone a partir do nome salvo em `Category.icone`. */
export const NOMES_ICONES: string[] = ["Sparkles", ...Object.keys(ICONES)];

export function iconeLucide(nome: string | null | undefined): LucideIcon {
  return (nome && ICONES[nome as IconeCategoria]) || Sparkles;
}

function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

const ICONE_POR_NOME = new Map<string, IconeCategoria>(
  CATEGORIAS_ARVORE.flatMap((mae) => [mae, ...mae.filhas]).flatMap((c) => [
    [chave(c.nome), c.icone],
    [chave(c.slug), c.icone],
  ]),
);

/** Ícone pelo nome ou slug da categoria; `null` se não for da árvore. */
export function iconePorNome(nome: string): LucideIcon | null {
  const icone = ICONE_POR_NOME.get(chave(nome));
  return icone ? ICONES[icone] : null;
}

/** Para quando só se tem o nome da categoria (cards, capas). */
export function visualCategoria(nome: string): { rotulo: string; icone: LucideIcon } {
  return {
    rotulo: nome.charAt(0).toLocaleUpperCase("pt-BR") + nome.slice(1),
    icone: iconePorNome(nome) ?? Sparkles,
  };
}
