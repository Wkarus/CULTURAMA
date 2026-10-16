-- Só acrescenta. Não apaga linha, coluna nem valor de enum.
ALTER TYPE "StatusVerificacao" ADD VALUE IF NOT EXISTS 'recusado_automaticamente';

ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "pedido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "motivo_codigo" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "motivo_texto" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "observacao" TEXT;

ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "pedido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "motivo_codigo" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "motivo_texto" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "observacao" TEXT;
