"use server";

import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut, unstable_update } from "@/auth";
import { isMaiorDe18, parseDataNascimento } from "@/lib/idade";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string; ok?: boolean; aviso?: string };

export async function cadastrarUsuario(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const nascimentoRaw = String(formData.get("dataNascimento") ?? "");
  const aceite = formData.get("aceite") === "on";

  if (!nome || !email || !senha) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (senha.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (!aceite) {
    return { error: "É preciso aceitar a Política de Privacidade para criar a conta." };
  }

  const dataNascimento = parseDataNascimento(nascimentoRaw);
  if (!dataNascimento) {
    return { error: "Informe uma data de nascimento válida." };
  }
  if (!isMaiorDe18(dataNascimento)) {
    return { error: "O cadastro é restrito a maiores de 18 anos." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  await prisma.user.create({
    data: {
      nome,
      email,
      senhaHash: await hash(senha, 12),
      tipo: "comum",
      dataNascimento,
      aceitePrivacidadeEm: new Date(),
    },
  });

  try {
    await signIn("credentials", { email, password: senha, redirectTo: "/boas-vindas" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas o login automático falhou. Entre em /login." };
    }
    throw error;
  }

  return { ok: true };
}

export async function loginUsuario(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/conta");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      const conta = await prisma.user.findUnique({ where: { email }, select: { senhaHash: true, suspensoEm: true } });
      if (conta?.suspensoEm && conta.senhaHash && (await compare(password, conta.senhaHash))) {
        return { error: "Esta conta está suspensa. Fale com a equipe do Culturama." };
      }
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }

  return { ok: true };
}

export async function loginGoogle(formData?: FormData) {
  const callbackUrl = String(formData?.get("callbackUrl") ?? "/conta");
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    redirect("/login?erro=google");
  }
  await signIn("google", { redirectTo: callbackUrl });
}

export async function sair() {
  await signOut({ redirectTo: "/" });
}

export async function completarPerfil(_prev: FormState, formData: FormData): Promise<FormState> {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Entre na sua conta para continuar." };
  }

  const aceite = formData.get("aceite") === "on";
  if (!aceite) {
    return { error: "É preciso aceitar a Política de Privacidade." };
  }

  const dataNascimento = parseDataNascimento(String(formData.get("dataNascimento") ?? ""));
  if (!dataNascimento) {
    return { error: "Informe uma data de nascimento válida." };
  }
  if (!isMaiorDe18(dataNascimento)) {
    return { error: "O cadastro é restrito a maiores de 18 anos." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      dataNascimento,
      aceitePrivacidadeEm: new Date(),
    },
  });

  await unstable_update({
    user: { needsCompletion: false },
  });

  redirect("/boas-vindas");
}
