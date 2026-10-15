# Culturama

Plataforma web de descoberta de eventos culturais (TCC). Junta shows oficiais (Ticketmaster) com eventos de rua cadastrados por organizadores, com filtros, mapa, rotas e painel de moderação.

A fonte de verdade do produto está em [`culturama-especificacao-cursor.md`](culturama-especificacao-cursor.md).

Repositório privado: pode (e deve) ser compartilhado com sócios. **Não** suba senha, chave de API nem o arquivo `.env`.

## Em que fase estamos

| Fase | Status |
|---|---|
| 1. Fundação (auth, 18+, LGPD, organizador CPF/CNPJ) | Feita |
| 2. Eventos (CRUD interno, listagem, Ticketmaster) | Feita |
| 3. Mapa, filtros, rotas, Uber/99 | Feita no código. Mapa e tempos de rota só ligam com chave Google. Filtros e deep links já funcionam sem ela. |
| 4. Painel admin | Feita |
| 5. Favoritos, comentários, denúncia, interesses | Feita |
| 6. Anúncios no site, Mercado Pago sandbox, polimento Skiper | Próxima |

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn
- Prisma + PostgreSQL (Supabase)
- Auth.js: e-mail/senha e Google
- Ticketmaster Discovery API (job diário)
- Google Maps JavaScript + Directions (opcional na Fase 3)

## O que sobe no GitHub e o que não sobe

**Sobe:** código, Prisma (schema + migrations), `.env.example`, spec, skills do Cursor, `vercel.json`.

**Não sobe (já está no `.gitignore`):**

- `.env` (senha do banco, `AUTH_SECRET`, chaves Ticketmaster/Google)
- `node_modules/`, `.next/`
- `uploads/` (CPF/CNPJ e imagens enviadas)
- `data/` (contador local de cota do Maps)

Cada sócio clona o repo, copia `.env.example` para `.env` e preenche as chaves **no próprio computador**. Quem já tem o banco do grupo pode reutilizar as URIs do Supabase, mas a senha se passa **fora** do Git (WhatsApp/1Password), nunca no commit.

Se uma chave já vazou em chat ou print, troque no painel (Supabase, Ticketmaster, Google, Auth).

## Como rodar local

Requisitos: Node.js 20+, conta no [Supabase](https://supabase.com) (ou o projeto já usado pelo grupo).

```bash
git clone https://github.com/Wkarus/CULTURAMA.git
cd CULTURAMA
npm install
copy .env.example .env
```

No Linux/macOS use `cp .env.example .env`.

Preencha no `.env` pelo menos:

- `DATABASE_URL` e `DIRECT_URL` (Supabase → Connect → Prisma; pooler na 6543, direto na 5432)
- `AUTH_SECRET` (`npx auth secret`)
- `TICKETMASTER_API_KEY` (Consumer Key da Discovery API) para importar shows
- `ADMIN_EMAIL` com o e-mail da conta que vai moderar; depois saia e entre de novo, ou `npm run db:admin`

Opcional:

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (callback `http://localhost:3000/api/auth/callback/google`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` e `GOOGLE_MAPS_API_KEY` (Maps JavaScript + Directions). Sem isso, `/mapa` mostra aviso; lista, Uber e 99 seguem ok.

Banco e app:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Se a 3000 estiver ocupada, o Next usa 3001.

### Scripts

```bash
npm run dev          # desenvolvimento
npm test             # testes de lib (CPF, filtros, categorias, Mapas Culturais…)
npm run mapas:importar  # importa Mapas Culturais (ver abaixo)
npm run db:seed      # categorias
npm run db:admin     # promove ADMIN_EMAIL a admin
npx prisma studio    # ver tabelas
```

Sincronizar Ticketmaster (dev, sem `CRON_SECRET`):

`GET http://localhost:3000/api/cron/ticketmaster`

Na Vercel, o cron diário está em `vercel.json`. Lá defina `CRON_SECRET` e chame com `Authorization: Bearer ...`.

### Mapas Culturais (SP Cultura, Mapa da Cultura, Paraíba…)

Importa eventos da API pública `/api/` das instâncias em `MAPAS_CULTURAIS_INSTANCIAS` (formato `Nome|URL|Fuso`, separado por `;`). Roda todo dia às 8h30 UTC pelo cron de `vercel.json`.

```bash
npx tsx scripts/importar-mapas-culturais.ts --simular --instancia=https://mapacultural.pb.gov.br   # só busca e mostra, não grava
npm run mapas:importar                                                                            # grava no banco
```

No PowerShell use `npx tsx ...` (o `--` do `npm run` some). Em dev também dá para chamar `GET /api/cron/mapas-culturais?instancia=URL`; no painel admin há o botão "Sincronizar agora".

- Eventos entram como `importado` (no ar sem revisão). Ocultar no admin vira `cancelado`, e a importação respeita.
- Evento que some da fonte ou já terminou vira `inativo` (não é apagado) e volta a `importado` se reaparecer.
- Editar o texto no admin trava a sobrescrita daquele evento (`editado_pela_equipe`).
- Linguagem → categoria: `src/lib/mapas-culturais-categorias.ts`. O que não estiver mapeado vai para "Outros" e aparece no painel.
- Nunca importamos dados de agentes (nome pessoal, e-mail, telefone, documento): o `@select` é uma lista fechada.
- Região: por padrão só o estado de SP. `MAPAS_CULTURAIS_UFS="SP,RJ"` (ou `*`) e/ou `MAPAS_CULTURAIS_RAIO="lat,lng,km"`. Local sem estado conhecido fica de fora; evento que sai da região vira `inativo`.
- robots.txt: lido antes de cada instância. Se bloquear `/api/` (ou não responder), a instância é pulada sem nenhuma chamada à API e o aviso fica no histórico do admin. 404 = sem restrições (RFC 9309).

## Rotas úteis

| Rota | Quem usa |
|---|---|
| `/cadastro`, `/login`, `/privacidade` | Conta 18+ com aceite LGPD |
| `/cadastro/organizador` | CNPJ (BrasilAPI, auto-aprova se ativo) ou CPF (fila admin) |
| `/eventos`, `/eventos/[id]` | Lista e detalhe (interno + Ticketmaster) |
| `/conta/eventos` | CRUD do organizador aprovado |
| `/mapa` | Mapa + mesmos filtros da lista |
| `/admin` | Moderação, fila de organizadores, anúncios (cadastro; vitrine pública é Fase 6) |

Regras importantes:

- Organizador `pendente` só salva rascunho.
- Cancelar/adiar **não apaga** o evento; muda `status`.
- Evento `ticketmaster` não é editável pelo organizador. Admin só oculta e anota `nota_admin` (campo interno, nunca no site público).
- Ads no admin ainda **não** aparecem na home. Quando aparecerem, a etiqueta "Patrocinado" é obrigatória.

## Design

Tokens Shop/Refero em `src/app/globals.css` e `.cursor/skills/culturama-design-system`. Não instalar 21st Dev sem combinado do grupo. Skiper UI só na Fase 6.

## Próximos passos (Fase 5)

1. Favoritos (tabela `Favorite` já existe no schema).
2. Comentários/avaliações com **denúncia** (admin precisa poder remover).
3. Tags de interesse no perfil e listagem simples por correspondência categoria/interesse. Sem LLM.

Depois, Fase 6: banners no front com "Patrocinado", checkout Mercado Pago **sandbox** (só evento interno; Ticketmaster usa o link dela), polimento visual.

Hospedagem prevista: Vercel + o mesmo Supabase. Variáveis da Vercel = as do `.env`, nunca commitadas.

## Sócios: fluxo de trabalho

1. Clone, `.env` local, `npm install`, migrate + seed.
2. Trabalhe em branch (`feat/favoritos`), abra pull request no GitHub.
3. Não force push em `master`/`main` sem combinado.
4. Não commite `.env`, prints de chave, nem pasta `uploads/`.
