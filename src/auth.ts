import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { promoteIfAdminEmail } from "@/lib/admin-email";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organizer: true },
        });
        if (!user?.senhaHash || user.suspensoEm) return null;

        const ok = await compare(password, user.senhaHash);
        if (!ok) return null;

        const isAdmin = await promoteIfAdminEmail(user.id, user.email);

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          tipo: isAdmin ? "admin" : user.tipo,
          needsCompletion: user.tipo === "empresa" ? false : !user.dataNascimento || !user.aceitePrivacidadeEm,
          statusVerificacao: user.organizer?.statusVerificacao ?? null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, user, profile }) {
      if (account?.provider !== "google") return true;
      const email = String(user?.email ?? profile?.email ?? "").toLowerCase();
      if (!email) return true;
      const existente = await prisma.user.findUnique({ where: { email }, select: { suspensoEm: true } });
      return existente?.suspensoEm ? "/login?erro=suspensa" : true;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (trigger === "update") {
        if (session?.user?.needsCompletion === false) {
          token.needsCompletion = false;
        }
        if (session?.user?.tipo) {
          token.tipo = session.user.tipo;
        }
        if (session?.user?.statusVerificacao !== undefined) {
          token.statusVerificacao = session.user.statusVerificacao;
        }
        return token;
      }

      if (account?.provider === "google" && (user?.email || profile?.email)) {
        const email = String(user?.email ?? profile?.email).toLowerCase();
        const nome = user?.name ?? profile?.name ?? "Usuário Google";
        const dbUser = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            nome,
            tipo: "comum",
          },
          update: { nome },
          include: { organizer: true },
        });
        const isAdmin = await promoteIfAdminEmail(dbUser.id, dbUser.email);
        token.sub = dbUser.id;
        token.tipo = isAdmin ? "admin" : dbUser.tipo;
        token.needsCompletion = !dbUser.dataNascimento || !dbUser.aceitePrivacidadeEm;
        token.statusVerificacao = dbUser.organizer?.statusVerificacao ?? null;
        return token;
      }

      if (user) {
        token.sub = user.id;
        token.tipo = user.tipo;
        token.needsCompletion = Boolean(user.needsCompletion);
        token.statusVerificacao = user.statusVerificacao ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tipo = token.tipo ?? "comum";
        session.user.needsCompletion = Boolean(token.needsCompletion);
        session.user.statusVerificacao = token.statusVerificacao ?? null;
      }
      return session;
    },
  },
});
