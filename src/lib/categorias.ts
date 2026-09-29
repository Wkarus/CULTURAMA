import { prisma } from "@/lib/prisma";

export const CATEGORIAS_PADRAO = ["música", "teatro", "exposição", "feira", "dança", "festival", "standup"] as const;

export async function ensureCategorias() {
  await prisma.category.createMany({
    data: CATEGORIAS_PADRAO.map((nome) => ({ nome })),
    skipDuplicates: true,
  });
  return prisma.category.findMany({ orderBy: { nome: "asc" } });
}
