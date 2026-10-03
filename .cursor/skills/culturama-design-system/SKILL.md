---
name: culturama-design-system
description: Linguagem visual do Culturama — paleta escuro/claro, accent rosa-roxo, Space Grotesk + IBM Plex Sans. Use ao criar ou revisar UI, tema, cards, CTAs e motion.
---

# Culturama — design system

Fonte de verdade visual. Taste Skill (`.cursor/skills/design-taste-frontend`) cuida de composição e anti-template. **Esta** skill define paleta, tipo, forma e bibliotecas.

Não invente tokens Promly. Não misture a paleta antiga Shop (`#5433eb`, Inter, canvas `#f2f4f5`).

## Vibe

Hero e destaques em superfície carvão; conteúdo padrão em papel quente. Um accent em gradiente terracota. Cards com foto, cantos 16–24px, sombra difusa. Motion discreto (hover scale/translate, um fundo animado por página).

## Tokens (`:root` em `src/app/globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `--color-surface-dark` | `#1C1F26` | Hero, seções de destaque |
| `--color-surface-light` | `#F6F4EE` | Fundo padrão |
| `--color-surface-raised` | `#232731` | Card sobre superfície escura |
| `--color-on-dark` | `#FFFFFF` | Texto sobre escuro |
| `--color-on-light` | `#333333` | Texto sobre claro |
| `--color-accent-from` | `#D98054` | Início do gradiente (CTA, Aurora) |
| `--color-accent-to` | `#C3724B` | Fim do gradiente |
| `--color-accent-solid` | `#C3724B` | Texto pequeno / links sobre claro |
| `--color-accent-hover-text` | `#E5956E` | Nome ativo no Hover Members |
| `--color-muted-on-dark` | `#E0E0E0` | Texto idle sobre escuro |
| `--color-border-light` | `#E5E0D5` | Borda das seções claras |
| `--color-muted-on-light` | `#666666` | Texto secundário sobre claro |
| `--color-success-fg` / `--color-success-bg` | `#2E8540` / `#EAF6EE` | Positivo |
| `--color-warning-fg` / `--color-warning-bg` | `#C3724B` / `#FDF3ED` | Alerta |
| `--color-danger-fg` | `#F87171` | Erro de campo sobre escuro (`text-danger`) |
| `--radius-card` | `20px` | Cards e painéis (faixa 16–24) |
| `--radius-control` | `16px` | Botões e inputs |
| `--shadow-card` | blur alto, opacidade ~0.06–0.10 | Elevação |
| Max width | `1200px` | Conteúdo |

Espelho JS (Maps / WebGL / Skiper): `src/lib/visual-tokens.ts`.

Tipo: **Space Grotesk** 600–700 nos títulos (`font-display`); **IBM Plex Sans** 400–600 no corpo (`font-sans`). Fallback de sistema só depois das webfonts.

## Faça

- Hex só nos tokens. Componentes usam `var(--…)` ou `visual.*`.
- Um fundo animado pesado por página (Aurora no hero). Mobile: estático se `pointer: coarse` ou `prefers-reduced-motion`.
- `prefers-reduced-motion: reduce` em toda animação.

## Não faça

- Segunda paleta (Shop violeta, teal, rosa-roxo antigo). O accent é o terracota dos tokens.
- Empilhar Aurora + outro WebGL na mesma página.
- Fontes do sistema nos títulos, exceto fallback.

## Bibliotecas

| Fonte | Quando |
|---|---|
| **shadcn/ui** | Form, header, botão. Restilizar com estes tokens. |
| **React Bits** | Aurora (hero), BlurText (H1), SpotlightCard (grid), CountUp (stats), ScrollReveal (como funciona). Pintar com estes tokens. |
| **Skiper UI** | Hover Members (`skiper6`) na faixa escura de destaques. Restilizar. Atribuição no rodapé se for a versão free. |
| **21st.dev** | Proibido até pedido explícito. |
