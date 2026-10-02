"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/actions/auth";
import { requireAdmin } from "@/lib/admin";
import { registrarLog } from "@/lib/admin-log";
import { NOMES_ICONES } from "@/lib/perfil";
import { prisma } from "@/lib/prisma";

function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function slugLivre(base: string): Promise<string> {
  const raiz = base || "categoria";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? raiz : `${raiz}-${i + 1}`;
    if (!(await prisma.category.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${raiz}-${Date.now().toString(36)}`;
}

function atualizarTelas() {
  revalidatePath("/admin/categorias");
  revalidatePath("/eventos");
  revalidatePath("/mapa");
  revalidatePath("/conta");
  revalidatePath("/boas-vindas");
}

function lerNomeIcone(formData: FormData): { nome: string; icone: string } | { error: string } {
  const nome = String(formData.get("nome") ?? "").trim().replace(/\s+/g, " ");
  const icone = String(formData.get("icone") ?? "Sparkles");
  if (nome.length < 2 || nome.length > 40) return { error: "O nome precisa ter de 2 a 40 caracteres." };
  if (!NOMES_ICONES.includes(icone)) return { error: "Ícone inválido." };
  return { nome, icone };
}

async function nomeEmUso(nome: string, ignorarId?: string): Promise<boolean> {
  const existente = await prisma.category.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" }, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
    select: { id: true },
  });
  return Boolean(existente);
}

export async function criarCategoria(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const lido = lerNomeIcone(formData);
  if ("error" in lido) return lido;
  const parentId = String(formData.get("parentId") ?? "") || null;

  if (parentId) {
    const mae = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
    if (!mae || mae.parentId) return { error: "Subcategoria só entra dentro de uma categoria principal." };
  }
  if (await nomeEmUso(lido.nome)) return { error: "Já existe uma categoria com esse nome." };

  const ultima = await prisma.category.findFirst({ where: { parentId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  const criada = await prisma.category.create({
    data: { ...lido, parentId, slug: await slugLivre(slugificar(lido.nome)), ordem: (ultima?.ordem ?? 0) + 1 },
  });
  await registrarLog(autor, "categoria.criar", "categoria", criada.id, { nome: criada.nome, slug: criada.slug, parentId });
  atualizarTelas();
  return { ok: true };
}

/** O slug não muda ao renomear: filtros salvos e interesses dos usuários continuam valendo. */
export async function editarCategoria(_prev: FormState, formData: FormData): Promise<FormState> {
  const autor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const lido = lerNomeIcone(formData);
  if ("error" in lido) return lido;

  const atual = await prisma.category.findUnique({ where: { id } });
  if (!atual) return { error: "Categoria não encontrada." };
  if (await nomeEmUso(lido.nome, id)) return { error: "Já existe uma categoria com esse nome." };

  await prisma.category.update({ where: { id }, data: lido });
  await registrarLog(autor, "categoria.editar", "categoria", id, {
    nomeAntes: atual.nome,
    nome: lido.nome,
    iconeAntes: atual.icone,
    icone: lido.icone,
  });
  atualizarTelas();
  return { ok: true };
}

export async function moverCategoria(id: string, direcao: "subir" | "descer"): Promise<FormState> {
  const autor = await requireAdmin();
  const atual = await prisma.category.findUnique({ where: { id } });
  if (!atual) return { error: "Categoria não encontrada." };

  const irmas = await prisma.category.findMany({
    where: { parentId: atual.parentId },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    select: { id: true },
  });
  const i = irmas.findIndex((c) => c.id === id);
  const j = direcao === "subir" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= irmas.length) return { ok: true };

  [irmas[i], irmas[j]] = [irmas[j], irmas[i]];
  await prisma.$transaction(irmas.map((c, ordem) => prisma.category.update({ where: { id: c.id }, data: { ordem: ordem + 1 } })));
  await registrarLog(autor, "categoria.reordenar", "categoria", id, { nome: atual.nome, posicao: j + 1 });
  atualizarTelas();
  return { ok: true };
}

export async function excluirCategoria(id: string): Promise<FormState> {
  const autor = await requireAdmin();
  const categoria = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { events: true, subcategorias: true } } },
  });
  if (!categoria) return { error: "Categoria não encontrada." };
  if (categoria._count.events > 0) return { error: "Há eventos nessa categoria. Mova os eventos antes de excluir." };
  if (categoria._count.subcategorias > 0) return { error: "Exclua ou mova as subcategorias antes." };

  await prisma.category.delete({ where: { id } });
  await registrarLog(autor, "categoria.excluir", "categoria", id, { nome: categoria.nome, slug: categoria.slug });
  atualizarTelas();
  return { ok: true };
}
