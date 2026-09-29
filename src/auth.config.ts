import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const googleReady = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: googleReady
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tipo = token.tipo ?? "comum";
        session.user.needsCompletion = Boolean(token.needsCompletion);
        session.user.statusVerificacao = token.statusVerificacao ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
