-- AlterEnum
ALTER TYPE "UserTipo" ADD VALUE 'moderador';

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "autor_id" TEXT,
    "autor_nome" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "alvo_tipo" TEXT NOT NULL,
    "alvo_id" TEXT,
    "detalhes" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_logs_criado_em_idx" ON "admin_logs"("criado_em");

-- CreateIndex
CREATE INDEX "admin_logs_autor_id_idx" ON "admin_logs"("autor_id");

-- CreateIndex
CREATE INDEX "admin_logs_acao_idx" ON "admin_logs"("acao");

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
