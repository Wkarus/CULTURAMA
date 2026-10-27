/**
 * Cabeçalhos de segurança em todas as rotas. A CSP fica só nas diretivas que não quebram Google Maps,
 * imagens externas e scripts do Next (sem `script-src` por enquanto). Sem `form-action`: o login com
 * Google redireciona o formulário para outro domínio.
 */
const SEGURANCA = [
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
    staleTimes: {
      dynamic: 0,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SEGURANCA,
      },
    ];
  },
};

export default nextConfig;
