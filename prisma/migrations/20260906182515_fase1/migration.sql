-- CreateEnum
CREATE TYPE "UserTipo" AS ENUM ('comum', 'organizador', 'admin');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CPF', 'CNPJ');

-- CreateEnum
CREATE TYPE "StatusVerificacao" AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- CreateEnum
CREATE TYPE "EventFonte" AS ENUM ('interno', 'ticketmaster');

-- CreateEnum
CREATE TYPE "RestricaoIdade" AS ENUM ('livre', 'doze', 'quatorze', 'dezesseis', 'dezoito');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('rascunho', 'publicado', 'cancelado', 'adiado');

-- CreateEnum
CREATE TYPE "AdSlotTipo" AS ENUM ('banner_home', 'banner_categoria', 'destaque_evento');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT,
    "tipo" "UserTipo" NOT NULL DEFAULT 'comum',
    "interesses" TEXT[],
    "data_nascimento" TIMESTAMP(3),
    "aceite_privacidade_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "status_verificacao" "StatusVerificacao" NOT NULL DEFAULT 'pendente',
    "data_verificacao" TIMESTAMP(3),
    "documento_url" TEXT NOT NULL,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT,
    "fonte" "EventFonte" NOT NULL,
    "id_externo" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria_id" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "endereco" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "imagem_capa" TEXT,
    "link_ingresso" TEXT,
    "tags" TEXT[],
    "restricao_idade" "RestricaoIdade" NOT NULL,
    "link_saiba_mais" TEXT,
    "nota_admin" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'rascunho',

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","event_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_slots" (
    "id" TEXT NOT NULL,
    "tipo" "AdSlotTipo" NOT NULL,
    "patrocinador" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ad_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_user_id_key" ON "organizers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_id_externo_key" ON "events"("id_externo");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nome_key" ON "categories"("nome");

-- AddForeignKey
ALTER TABLE "organizers" ADD CONSTRAINT "organizers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
