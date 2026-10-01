import type { Category } from "@prisma/client";
import { semearCategorias } from "@/lib/categorias-dados";
import { prisma } from "@/lib/prisma";

const ORDEM = [{ ordem: "asc" as const }, { nome: "asc" as const }];

/** Lista plana de mães e subcategorias. Semeia a árvore se ela ainda não existe no banco. */
export async function ensureCategorias(): Promise<Category[]> {
  const lista = await prisma.category.findMany({ orderBy: ORDEM });
  if (lista.some((c) => c.parentId)) return lista;
  await semearCategorias(prisma);
  return prisma.category.findMany({ orderBy: ORDEM });
}
