-- Categorias em dois níveis (mãe e subcategoria), preservando as linhas e os ids atuais.
-- As subcategorias que ainda não existem entram pelo seed (`npx prisma db seed`), que é idempotente.

-- 1. Colunas novas. `slug` entra opcional para preencher as linhas atuais antes de virar obrigatório.
ALTER TABLE "categories"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "icone" TEXT NOT NULL DEFAULT 'Sparkles',
  ADD COLUMN "parent_id" TEXT,
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

-- 2. "música" e "dança" não têm subcategoria equivalente: viram as próprias mães (mesmo id, eventos continuam ligados).
UPDATE "categories" SET "nome" = 'Música', "slug" = 'musica', "icone" = 'Music', "ordem" = 1 WHERE "nome" = 'música';
UPDATE "categories" SET "nome" = 'Dança', "slug" = 'danca', "icone" = 'Footprints', "ordem" = 5 WHERE "nome" = 'dança';

-- 3. Mães. Se já existir (passo 2), o conflito em "nome" pula a linha.
INSERT INTO "categories" ("id", "nome", "slug", "icone", "ordem") VALUES
  ('cat_musica', 'Música', 'musica', 'Music', 1),
  ('cat_samba', 'Samba', 'samba', 'Drum', 2),
  ('cat_esportes', 'Esportes', 'esportes', 'Trophy', 3),
  ('cat_geek-e-games', 'Geek e games', 'geek-e-games', 'Gamepad2', 4),
  ('cat_danca', 'Dança', 'danca', 'Footprints', 5),
  ('cat_artes-cenicas', 'Artes cênicas', 'artes-cenicas', 'Drama', 6),
  ('cat_arte-e-exposicao', 'Arte e exposição', 'arte-e-exposicao', 'Palette', 7),
  ('cat_feiras-e-gastronomia', 'Feiras e gastronomia', 'feiras-e-gastronomia', 'ShoppingBasket', 8)
ON CONFLICT DO NOTHING;

-- 4. Categorias atuais que viram subcategorias da mãe correspondente.
UPDATE "categories" SET "nome" = 'Teatro', "slug" = 'teatro', "icone" = 'Theater', "ordem" = 1,
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'artes-cenicas')
  WHERE "nome" = 'teatro';
UPDATE "categories" SET "nome" = 'Stand-up', "slug" = 'stand-up', "icone" = 'Mic', "ordem" = 2,
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'artes-cenicas')
  WHERE "nome" = 'standup';
UPDATE "categories" SET "nome" = 'Exposições', "slug" = 'exposicoes', "icone" = 'Frame', "ordem" = 1,
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'arte-e-exposicao')
  WHERE "nome" = 'exposição';
UPDATE "categories" SET "nome" = 'Feiras', "slug" = 'feiras', "icone" = 'Store', "ordem" = 1,
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'feiras-e-gastronomia')
  WHERE "nome" = 'feira';
UPDATE "categories" SET "nome" = 'Festivais de música', "slug" = 'festivais-de-musica', "icone" = 'PartyPopper', "ordem" = 6,
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'musica')
  WHERE "nome" = 'festival';

-- 5. Qualquer outra linha antiga fica como mãe, com o id como slug.
UPDATE "categories" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
