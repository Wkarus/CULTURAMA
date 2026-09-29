# Shop — referência de estilo (Refero)

Fonte: [styles.refero.design/style/4fa67bd1-f01d-454a-b522-4a0359ff9815](https://styles.refero.design/style/4fa67bd1-f01d-454a-b522-4a0359ff9815)

Produto original: [shop.app](https://shop.app). No Culturama os cards são **eventos**, não produtos. Ver `.cursor/skills/culturama-design-system/SKILL.md`.

## Vibe

Canvas branco, cards grandes bem arredondados flutuando (não grade dura). Interface pillow-soft: raios 20–28px, controles em pílula, corpo 16px com tracking negativo. Um único accent saturado — violeta `#5433eb` — no wordmark e no CTA. Resto neutro quente. Gaps de 12px; seções com 64–80px de ar.

## Cores

| Nome | Hex | Token | Papel |
|---|---|---|---|
| Shop Violet | `#5433eb` | `--color-shop-violet` | CTA, wordmark — único saturado |
| Violet Wash | `#c0b5f3` | `--color-violet-wash` | Halo do CTA |
| Canvas Mist | `#f2f4f5` | `--color-canvas-mist` | Fundo da página |
| Pure White | `#ffffff` | `--color-pure-white` | Cards, inputs |
| Ink Black | `#000000` | `--color-ink-black` | Texto primário |
| Slate Ink | `#332f2d` | `--color-slate-ink` | Superfície escura / overlay |
| Ash Veil | `#665a54` | `--color-ash-veil` | Backdrop de imagem, não UI ativa |
| Muted Gray | `#787574` | `--color-muted-gray` | Texto secundário |
| Warm Fog | `#acb0aa` | `--color-warm-fog` | Tint de card secundário |
| Cool Stone | `#cccccc` | `--color-cool-stone` | Disabled / placeholder |
| Faint Border | `#ebebeb` | `--color-faint-border` | Hairline de input/pill |

## Tipo

Original: GT Standard (corpo e título). **Substituição no Culturama: Inter** (licença). Shopify Sans no original era só banner/cookie — não usamos.

- Body: 16px, tracking ≈ `-0.031em`, line-height ≈ 1.38
- Display: 20px, tracking ≈ `-0.05em`
- Labels: 11–12px
- Hierarquia por tracking e tamanho, não por bold pesado
- Piso de texto primário: 16px; secundário: 12px

## Forma e ritmo

| Token | Valor |
|---|---|
| Max width | 1200px |
| Section gap | 64–80px |
| Element gap | 12px |
| Card radius | 28px |
| Pill / input / chip | 9999px (ou 20px) |
| Card shadow | `0 4px 6px -1px` + `0 2px 4px -2px` a 10% preto |
| CTA shadow | violeta `rgba(69, 36, 219, 0.34)` |

## Do / Don't (Refero)

**Do:** um violeta só; cards 28px; pills 9999px; sombra dupla suave; camadas por sombra, não por borda no card; 64–80px entre seções.

**Don't:** segundo accent saturado; canto 0px em card/botão/input (0px só na borda da imagem).
