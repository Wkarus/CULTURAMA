---
name: culturama-design-system
description: Linguagem visual do Culturama — tokens Shop (Refero) adaptados a descoberta de eventos. Use ao criar ou revisar UI, tema, cards, CTAs e motion.
---

# Culturama — design system

Fonte de verdade visual do projeto. Ancorado no [Shop / Refero](https://styles.refero.design/style/4fa67bd1-f01d-454a-b522-4a0359ff9815). Detalhe versionado em `docs/design-shop-refero.md`.

Promly foi citado em conversa e **não** tem dump no repo. Não invente tokens Promly. Se entrar um arquivo depois, mescle aqui.

Antes de gerar UI, releia este arquivo. A Taste Skill (`.cursor/skills/design-taste-frontend`) cuida de “não parecer template”; **esta** skill define paleta, forma e o que pode entrar de biblioteca.

## Vibe

Canvas branco-névoa, cards grandes flutuando (não grade dura), cantos pillow-soft, um único violeta saturado. Densidade compacta (12px) entre elementos; 64–80px entre seções. Commerce no Shop vira **descoberta de evento** no Culturama: card = evento, CTA = descobrir / rota / ingresso — nunca “comprar” como identidade.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--color-shop-violet` | `#5433eb` | Único accent: wordmark, CTA primário, sombra do CTA |
| `--color-violet-wash` | `#c0b5f3` | Halo atrás do CTA, nunca segundo accent |
| `--color-canvas-mist` | `#f2f4f5` | Fundo da página |
| `--color-pure-white` | `#ffffff` | Cards, inputs, header |
| `--color-ink-black` | `#000000` | Texto e ícones primários |
| `--color-muted-gray` | `#787574` | Texto secundário, nav idle |
| `--color-faint-border` | `#ebebeb` | Outline de input/pill; evite borda em card elevado |
| `--color-cool-stone` | `#cccccc` | Disabled / placeholder |
| `--radius-card` | `28px` | Cards de evento e painéis |
| `--radius-pill` | `9999px` | Botões, chips, inputs |
| `--shadow-card` | `0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)` | Todo card elevado |
| `--shadow-cta` | `0 8px 20px -4px rgb(69 36 219 / 0.34)` | Só no botão primário |
| Max width | `1200px` | Conteúdo |
| Element gap | `12px` | |
| Section gap | `64px`–`80px` | |

Tipo: **Inter** (substituto gratuito do GT Standard). Body 16px, tracking ~`-0.031em`. Hierarquia por tracking e tamanho, não por bold gritante. Piso de label secundário: 12px.

## Faça

- Um só accent saturado (`#5433eb`).
- Cards 28px; pills/inputs/botões 9999px (ou 20px se pill curto). Sem raio 0 em controle (0px só em recorte de imagem).
- Card branco sobre canvas; elevação por sombra, não por borda pesada.
- `prefers-reduced-motion: reduce` em toda animação.

## Não faça

- Segundo accent (laranja, teal, gradiente arco-íris).
- Canto vivo em card, botão ou input.
- Instalar **21st Dev MCP** / puxar componente de marketplace sem pedido explícito.
- Misturar Skiper + React Bits + outra lib na mesma tela.

## Bibliotecas permitidas

| Fonte | Quando |
|---|---|
| **shadcn/ui** | Base de formulário, header, card, botão. Restilizar com estes tokens. |
| **React Bits** | No máximo 1–2 momentos (hero ou card de evento). Copiar o bloco e pintar com estes tokens. Não instalar o kit inteiro. |
| **Skiper UI** | Só na Fase 6, mesma regra: restilizar, não trazer a paleta original. |
| **21st.dev** | Proibido até a dona do projeto pedir. |

## Taste Skill + guidelines

Taste Skill = composição e anti-template. Guidelines Vercel (`.cursor/rules/web-design-guidelines.mdc`) = a11y no **fim da fase**, não a cada commit.
