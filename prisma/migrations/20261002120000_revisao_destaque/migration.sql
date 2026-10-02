-- CreateEnum
CREATE TYPE "RevisaoResultado" AS ENUM ('recusado', 'ajuste');

-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'em_revisao';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mensagem_organizador" TEXT,
ADD COLUMN     "revisado_em" TIMESTAMP(3),
ADD COLUMN     "revisao_resultado" "RevisaoResultado";
