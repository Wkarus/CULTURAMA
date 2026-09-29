import type { StatusVerificacao, UserTipo } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tipo: UserTipo;
      needsCompletion: boolean;
      statusVerificacao: StatusVerificacao | null;
    };
  }

  interface User {
    tipo: UserTipo;
    needsCompletion?: boolean;
    statusVerificacao?: StatusVerificacao | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipo?: UserTipo;
    needsCompletion?: boolean;
    statusVerificacao?: StatusVerificacao | null;
  }
}
