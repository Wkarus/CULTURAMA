-- AlterEnum
ALTER TYPE "UserTipo" ADD VALUE 'empresa';

-- CreateEnum
CREATE TYPE "TipoInteracao" AS ENUM ('visualizacao', 'favorito', 'como_chegar', 'ingresso');

-- CreateEnum
CREATE TYPE "FaixaEtaria" AS ENUM ('ate_17', 'de_18_a_24', 'de_25_a_34', 'de_35_a_44', 'de_45_a_54', 'de_55_ou_mais');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "status" "StatusVerificacao" NOT NULL DEFAULT 'pendente',
    "data_verificacao" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacoes_evento" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "tipo" "TipoInteracao" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT NOT NULL,
    "bairro" TEXT NOT NULL DEFAULT '',
    "cidade" TEXT NOT NULL DEFAULT '',
    "faixa_etaria" "FaixaEtaria",
    "coorte" TEXT,

    CONSTRAINT "interacoes_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_contato" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_contato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_user_id_key" ON "empresas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE INDEX "interacoes_evento_data_idx" ON "interacoes_evento"("data");

-- CreateIndex
CREATE INDEX "interacoes_evento_evento_id_data_idx" ON "interacoes_evento"("evento_id", "data");

-- CreateIndex
CREATE INDEX "interacoes_evento_categoria_data_idx" ON "interacoes_evento"("categoria", "data");

-- CreateIndex
CREATE INDEX "pedidos_contato_empresa_id_evento_id_idx" ON "pedidos_contato"("empresa_id", "evento_id");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes_evento" ADD CONSTRAINT "interacoes_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_contato" ADD CONSTRAINT "pedidos_contato_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_contato" ADD CONSTRAINT "pedidos_contato_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
