import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const protectedPaths = ["/conta", "/boas-vindas", "/cadastro/organizador", "/cadastro/completar", "/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtected && !session?.user) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (session?.user?.needsCompletion && pathname !== "/cadastro/completar" && pathname !== "/privacidade") {
    if (pathname.startsWith("/api/auth")) return;
    return Response.redirect(new URL("/cadastro/completar", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/conta", "/conta/:path*", "/boas-vindas", "/cadastro/organizador", "/cadastro/organizador/:path*", "/cadastro/completar", "/admin", "/admin/:path*"],
};
