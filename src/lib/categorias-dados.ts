import type { PrismaClient } from "@prisma/client";

/** Fonte única da taxonomia. Usada pelo seed (via tsx, sem alias `@/`) e pelo app. `icone` é o nome do ícone lucide. */
export const CATEGORIAS_ARVORE = [
  {
    slug: "musica",
    nome: "Música",
    icone: "Music",
    filhas: [
      { slug: "eletronica", nome: "Eletrônica", icone: "AudioWaveform" },
      { slug: "classica-e-concertos", nome: "Clássica e concertos", icone: "Piano" },
      { slug: "rock", nome: "Rock", icone: "Guitar" },
      { slug: "sertanejo", nome: "Sertanejo", icone: "Music4" },
      { slug: "rap-e-rima", nome: "Rap e rima", icone: "MicVocal" },
      { slug: "festivais-de-musica", nome: "Festivais de música", icone: "PartyPopper" },
    ],
  },
  {
    slug: "samba",
    nome: "Samba",
    icone: "Drum",
    filhas: [
      { slug: "roda-de-samba", nome: "Roda de samba", icone: "Users" },
      { slug: "samba-de-raiz", nome: "Samba de raiz", icone: "Sprout" },
      { slug: "pagode", nome: "Pagode", icone: "Music2" },
      { slug: "samba-rock", nome: "Samba-rock", icone: "Disc3" },
      { slug: "partido-alto", nome: "Partido-alto", icone: "MessageCircle" },
      { slug: "samba-de-roda", nome: "Samba de roda", icone: "Orbit" },
      { slug: "ensaios-de-escola-de-samba", nome: "Ensaios de escola de samba", icone: "Crown" },
    ],
  },
  {
    slug: "esportes",
    nome: "Esportes",
    icone: "Trophy",
    filhas: [
      { slug: "corrida", nome: "Corrida", icone: "Timer" },
      { slug: "natacao", nome: "Natação", icone: "Waves" },
      { slug: "xadrez", nome: "Xadrez", icone: "ChessKnight" },
      { slug: "judo-e-lutas", nome: "Judô e lutas", icone: "HandFist" },
      { slug: "ciclismo", nome: "Ciclismo", icone: "Bike" },
      { slug: "futebol-amador", nome: "Futebol amador", icone: "Goal" },
    ],
  },
  {
    slug: "geek-e-games",
    nome: "Geek e games",
    icone: "Gamepad2",
    filhas: [
      { slug: "anime", nome: "Anime", icone: "Tv" },
      { slug: "games", nome: "Games", icone: "Joystick" },
      { slug: "comic-con", nome: "Comic con", icone: "BookOpen" },
      { slug: "rpg-e-board-games", nome: "RPG e board games", icone: "Dices" },
      { slug: "cosplay", nome: "Cosplay", icone: "VenetianMask" },
    ],
  },
  {
    slug: "danca",
    nome: "Dança",
    icone: "Footprints",
    filhas: [
      { slug: "batalhas-e-campeonatos", nome: "Batalhas e campeonatos", icone: "Medal" },
      { slug: "danca-de-salao", nome: "Dança de salão", icone: "HeartHandshake" },
      { slug: "forro", nome: "Forró", icone: "Sun" },
      { slug: "ballet-e-contemporanea", nome: "Ballet e contemporânea", icone: "Feather" },
      { slug: "dancas-urbanas", nome: "Danças urbanas", icone: "Headphones" },
    ],
  },
  {
    slug: "artes-cenicas",
    nome: "Artes cênicas",
    icone: "Drama",
    filhas: [
      { slug: "teatro", nome: "Teatro", icone: "Theater" },
      { slug: "stand-up", nome: "Stand-up", icone: "Mic" },
      { slug: "circo", nome: "Circo", icone: "Tent" },
    ],
  },
  {
    slug: "arte-e-exposicao",
    nome: "Arte e exposição",
    icone: "Palette",
    filhas: [
      { slug: "exposicoes", nome: "Exposições", icone: "Frame" },
      { slug: "museus", nome: "Museus", icone: "Landmark" },
      { slug: "arte-de-rua", nome: "Arte de rua", icone: "SprayCan" },
    ],
  },
  {
    slug: "feiras-e-gastronomia",
    nome: "Feiras e gastronomia",
    icone: "ShoppingBasket",
    filhas: [
      { slug: "feiras", nome: "Feiras", icone: "Store" },
      { slug: "festivais-gastronomicos", nome: "Festivais gastronômicos", icone: "UtensilsCrossed" },
      { slug: "encontros-de-carros", nome: "Encontros de carros", icone: "Car" },
    ],
  },
] as const;

type Mae = (typeof CATEGORIAS_ARVORE)[number];
export type SlugCategoria = Mae["slug"] | Mae["filhas"][number]["slug"];
export type IconeCategoria = Mae["icone"] | Mae["filhas"][number]["icone"];

/** Idempotente: faz upsert por `slug`, então rodar de novo só atualiza nome, ícone, ordem e mãe. */
export async function semearCategorias(prisma: PrismaClient): Promise<{ maes: number; filhas: number }> {
  let filhas = 0;
  for (const [i, mae] of CATEGORIAS_ARVORE.entries()) {
    const dadosMae = { nome: mae.nome, icone: mae.icone, ordem: i + 1, parentId: null };
    const registro = await prisma.category.upsert({
      where: { slug: mae.slug },
      create: { slug: mae.slug, ...dadosMae },
      update: dadosMae,
    });
    for (const [j, filha] of mae.filhas.entries()) {
      const dadosFilha = { nome: filha.nome, icone: filha.icone, ordem: j + 1, parentId: registro.id };
      await prisma.category.upsert({
        where: { slug: filha.slug },
        create: { slug: filha.slug, ...dadosFilha },
        update: dadosFilha,
      });
      filhas += 1;
    }
  }
  return { maes: CATEGORIAS_ARVORE.length, filhas };
}
