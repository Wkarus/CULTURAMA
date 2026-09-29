# Culturama — Especificação Técnica do Projeto

> Este documento existe pra dar contexto completo a uma IA de desenvolvimento (Cursor). Ele explica **o quê** vamos construir, **por quê** cada decisão foi tomada, e **como** deve ser implementado. Trate isso como a fonte de verdade do projeto — releia antes de gerar código novo.

---

## 1. O que é o Culturama (contexto de produto)

Culturama é uma plataforma web (e futuramente app) de **descoberta de eventos culturais**: um mapa inteligente que conecta pessoas a eventos culturais próximos (shows, teatro, exposições, feiras), com filtros, rotas, recomendação por interesse e comunidade (avaliações/comentários).

**Por quê este produto existe**: pesquisa Hábitos Culturais (Fundação Itaú/Datafolha, 2025) mostra que 84% dos brasileiros participaram de alguma atividade cultural presencial nos últimos 12 meses, mas o setor ainda é fragmentado entre dezenas de sites, redes sociais e boca a boca. O Culturama centraliza a descoberta.

**É um projeto de TCC** (Trabalho de Conclusão de Curso), não uma startup em operação. Isso importa para as decisões técnicas abaixo: tudo foi escolhido pensando em um prazo de **2-3 meses**, desenvolvedor(es) trabalhando sozinho(s) ou em grupo pequeno, e custo de infraestrutura próximo de zero.

**Modelo de negócio** (contexto, não é o foco do código agora): freemium para usuários finais, comissão/assinatura para organizadores (B2B), cotas de patrocínio e anúncios locais direcionados. Isso justifica por que existem dois tipos de conta (usuário comum vs. organizador) e por que há espaço reservado para anúncios no design.

---

## 2. Como vamos construir (stack técnica e por quê)

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript | Full-stack em um único projeto — evita manter dois repositórios separados dentro do prazo de 2-3 meses |
| Estilo/UI | Tailwind CSS + shadcn/ui + componentes do **Skiper UI** para seções de destaque (hero, cards animados) | Visual moderno sem precisar desenhar componentes do zero |
| Backend | Next.js API Routes / Server Actions | Mesmo motivo do frontend: um projeto só |
| ORM | Prisma | Tipagem forte do schema, migrations fáceis |
| Banco de dados | PostgreSQL via Supabase | Free tier cobre o volume de um TCC; já vem com storage de imagens |
| Autenticação | NextAuth.js (Auth.js) — email/senha + Google | Cobre "autenticação real" sem reinventar a roda |
| Mapa | Google Maps Platform — Maps JavaScript API (com 3D Tiles fotorrealísticos) + Directions/Routes API | Efeito visual "quase Google Earth" pedido, com trajetos multimodais (carro, transporte público, a pé) |
| Fonte de eventos formais | Ticketmaster Discovery API | Auto-serviço, cobertura real de eventos grandes no Brasil (Ticketmaster relançou operação no país em 2023); usado para popular o mapa com eventos que já têm ingresso oficial, via job de sincronização (ver seção 3.1) |
| Pagamento | Mercado Pago (Checkout Pro / API de Preferências) em **modo sandbox** | Gera link de pagamento real via API sem processar dinheiro de verdade; evita que o Culturama seja enquadrado como instituição de pagamento (Bacen). Só se aplica a eventos internos — eventos da Ticketmaster usam o link de compra dela mesma |
| Verificação de organizador | BrasilAPI ou ReceitaWS (CNPJ) + validação de dígito verificador (CPF) | APIs gratuitas, sem necessidade de serviço pago de KYC |
| Hospedagem | Vercel (app) + Supabase (banco/storage) | Custo ≈ R$0/mês no volume de um TCC |

**Regra geral para o Cursor**: sempre que for adicionar uma dependência nova, prefira algo que já tenha camada gratuita e que não exija infraestrutura própria (sem servidores dedicados, sem containers a gerenciar). Se uma feature parecer exigir isso, pare e sinalize antes de implementar — provavelmente ela deveria estar no backlog de expansão, não no MVP.

---

## 3. Modelo de dados (schema Prisma, nível conceitual)

```
User
  id, nome, email, senha_hash, tipo (comum | organizador | admin)
  interesses: string[] (tags de categoria)
  criado_em

Organizer
  id, user_id (FK -> User)
  nome_empresa
  documento (CPF ou CNPJ)
  tipo_documento (CPF | CNPJ)
  status_verificacao (pendente | aprovado | rejeitado)
  data_verificacao

Event
  id, organizer_id (FK -> Organizer, NULL se vier da Ticketmaster)
  fonte (interno | ticketmaster)
  id_externo (ID do evento na Ticketmaster, só quando fonte = ticketmaster — usado pra sincronizar e evitar duplicar)
  titulo, descricao, categoria, data_hora
  endereco, latitude, longitude
  imagem_capa
  link_ingresso (ou preço + capacidade, se usar checkout Mercado Pago — só se aplica a eventos internos)
  tags: string[]
  restricao_idade (livre | 12 | 14 | 16 | 18)
  link_saiba_mais
  nota_admin (texto interno, NUNCA exibido publicamente)
  status (rascunho | publicado | cancelado | adiado)

Category
  id, nome

Favorite
  user_id (FK), event_id (FK)

Comment
  id, user_id (FK), event_id (FK), texto, nota, criado_em

AdSlot
  id, tipo (banner_home | banner_categoria | destaque_evento)
  patrocinador, imagem, link
  data_inicio, data_fim, ativo
```

**Regras de negócio importantes ligadas a este schema:**
- Um `Organizer` com `status_verificacao = pendente` consegue logar e salvar eventos como `rascunho`, mas **não pode** publicar (`status = publicado`). Essa checagem deve estar no backend, não só escondida na UI.
- `nota_admin` nunca deve aparecer em nenhuma rota/página pública — é campo de moderação interna.
- Ao "cancelar" ou "adiar" um evento, **não apague o registro** — mude o `status`. Isso preserva histórico e permite notificar quem favoritou.
- Eventos com `fonte = ticketmaster` **não passam** pela fila de verificação de organizador (já vêm de uma fonte confiável e com ingresso oficial) e **não podem ser editados** pelo organizador — só o admin pode ocultá-los, nunca alterar o conteúdo (o dado é da Ticketmaster).
- Na UI (mapa, listagem, card de evento), diferencie visualmente eventos `ticketmaster` dos `interno` — um selo pequeno "via Ticketmaster" é suficiente. Isso é importante pra não passar a impressão de que todo evento no mapa foi verificado do mesmo jeito.

---

## 3.1 As duas fontes de evento — e por que isso importa

O Culturama tem **duas fontes de conteúdo, com propósitos diferentes**:

1. **Ticketmaster (Discovery API)** — eventos grandes/formais que já têm ingresso oficial e infraestrutura própria (shows grandes, festivais, teatro comercial). Aqui o Culturama só **importa e exibe**, levando o usuário direto pro link de compra. Não tem CRUD, não tem verificação de organizador — a Ticketmaster já é a fonte de confiança.
2. **Cadastro de organizador (CRUD interno)** — a cena que a Ticketmaster nunca vai cobrir: uma batalha de rima de bairro, uma roda de samba, um encontro de carros, um sarau. Isso é o motivo de existir todo o fluxo de verificação por CNPJ/CPF que já projetamos — é justamente onde o risco de conteúdo falso/malicioso é maior, porque não tem uma plataforma grande por trás validando.

**Implicação técnica**: precisa de um job de sincronização (roda periodicamente, ex: 1x por dia) que consulta a Discovery API por cidade/região e faz upsert na tabela `Event` usando `id_externo` como chave de deduplicação. Isso é um worker separado da aplicação principal — pode ser uma Vercel Cron Function simples, não precisa de infraestrutura de fila/mensageria pra esse volume.

---

## 4. Funcionalidades — ordem de implementação

Implemente **nessa ordem**. Cada fase depende da anterior estar funcional.

### Fase 1 — Fundação
- Setup do projeto (Next.js + Prisma + Supabase conectados)
- Autenticação: cadastro/login de usuário comum
- Cadastro de organizador com upload de CPF/CNPJ + chamada à API de validação (CNPJ automática via BrasilAPI; CPF por dígito verificador + fila de aprovação manual)
- Página de Política de Privacidade + checkbox de consentimento (LGPD) — implementar **junto** com o cadastro, não depois
- Cadastro restrito a maiores de 18 anos (evita todo o fluxo de consentimento parental da LGPD para menores)

### Fase 2 — Núcleo de eventos
- **Job de sincronização com a Ticketmaster Discovery API**: busca eventos por cidade/região, faz upsert na tabela `Event` com `fonte = ticketmaster` e `id_externo` para deduplicar. Rodar como cron job (ex: Vercel Cron), 1x por dia é suficiente pro volume de um TCC
- CRUD de evento pelo organizador (título, descrição, categoria, data, endereço, imagem, restrição de idade, link "saiba mais") — para eventos com `fonte = interno`
- Página de listagem e página de detalhe do evento — precisa lidar com os dois tipos de `fonte` de forma diferente (ver seção 3.1)
- Categorias/tags

### Fase 3 — Mapa e rotas
- Mapa interativo (Google Maps Platform) com eventos próximos
- Filtros: categoria, data, distância, gratuito/pago
- Cálculo de rota até o evento **em todos os modais relevantes**: carro, transporte público (ônibus/metrô), a pé — via Directions/Routes API
- **Deep link para apps de transporte por aplicativo (Uber, 99)**: um botão "Ir de Uber" que abre o app already instalado com o destino pré-preenchido (endereço do evento). Isso NÃO é a API completa de solicitação de corrida (que exigiria parceria comercial) — é só uma URL scheme (`uber://?action=setPickup&dropoff[latitude]=...&dropoff[longitude]=...`), leve de implementar e já entra na Fase 3, não no backlog
- Comparativo simples de tempo/distância entre os modais na página do evento (a Directions API já retorna esses dados — é só exibir lado a lado)

**Por que isso importa mais do que parece**: essa combinação (mapa + rotas multimodais + deep link de transporte) é o que torna o Culturama útil não só pra quem já mora na cidade, mas pra **turistas e visitantes** que não conhecem a cidade e não sabem como chegar ao evento. Isso conecta diretamente com a visão de expansão em turismo da seção 6 — a mobilidade completa até o local é, na prática, o requisito técnico que viabiliza aquele caso de uso.

### Fase 4 — Painel de admin
- Moderação de eventos: cancelar, adiar, remover, adicionar `nota_admin`
- Fila de aprovação/rejeição de organizadores pendentes (principalmente os verificados por CPF)
- Gestão de `AdSlot` (ativar/desativar banners, período de veiculação)

### Fase 5 — Social e recomendação
- Favoritos
- Comentários/avaliações (com canal de denúncia — ver seção 5)
- Recomendação por tags de interesse (regra simples de correspondência categoria↔interesse; **não é necessário** usar um modelo de IA/LLM para isso)

### Fase 6 — Monetização e polimento
- Espaço de anúncios (`AdSlot`) com etiqueta visível "Patrocinado"
- Checkout via link do Mercado Pago (modo sandbox)
- Polimento visual com componentes do Skiper UI

---

## 5. Restrições legais que viram requisito técnico (não é só texto de TCC)

Estas não são sugestões — são coisas que o código precisa respeitar desde o início:

1. **Moderação de conteúdo**: como o STF alterou o entendimento sobre responsabilidade de plataformas por conteúdo de terceiros (Art. 19 do Marco Civil), todo comentário/avaliação precisa ter um botão de denúncia, e o admin precisa conseguir remover conteúdo denunciado.
2. **Cadastro 18+**: não implementar fluxo de consentimento parental — simplesmente bloquear cadastro de menores de 18 na validação do formulário.
3. **Pagamento nunca custodiado pelo Culturama**: sempre redirecionar para o link/checkout do Mercado Pago — o app não deve, em nenhum momento, guardar ou processar dados de cartão diretamente.
4. **Ads sempre rotulados**: todo componente de `AdSlot` renderizado precisa ter um texto "Patrocinado" ou "Anúncio" visível, não só no admin — no front também.
5. **Exclusão de conta real**: implementar endpoint que de fato apaga (ou anonimiza) os dados do usuário, não só um campo `ativo = false`.

---

## 6. O que **não** entra no escopo agora (backlog de expansão)

Não implemente isso a menos que eu peça explicitamente — são ideias validadas como visão de produto, mas fora do prazo de 2-3 meses:

- Integração completa com Uber via API comercial de solicitação de corrida (o **deep link** simples já saiu daqui — está na Fase 3, seção 4, por ser leve o suficiente pra entrar no escopo principal)
- Recarga de Bilhete Único (não existe API pública para isso)
- Parcerias com agências de turismo / governo (B2G) — é modelo de negócio, não feature técnica. Importante: a base técnica pra atender esse público (mapa + rotas multimodais + deep link Uber) já fica pronta na Fase 3, sem esforço extra — a expansão pra turismo é uma decisão de mercado, não vai exigir retrabalho técnico
- Rastreamento contínuo de localização/destino do usuário — decisão deliberada por conflito com a LGPD (ver seção 5); a personalização deve usar só as tags de interesse declaradas + localização pontual no momento do uso do mapa
- Qualquer funcionalidade que exija modelo de IA/LLM rodando em produção com custo por chamada em escala — se aparecer necessidade de "IA" em algum ponto, prefira lógica de regras determinística primeiro

---

## 7. Como trabalhar comigo (convenções para o Cursor)

- Antes de gerar uma tabela/model nova, confira se ela já não está descrita na seção 3 — o schema já foi pensado, não redesenhe do zero.
- Se uma feature pedida no chat não estiver nas fases da seção 4, pergunte se ela é do backlog de expansão (seção 6) antes de implementar.
- Priorize sempre a opção sem custo de infraestrutura adicional (ver seção 2).
- Não implemente processamento de pagamento próprio — sempre via link/checkout de terceiro regulado.
