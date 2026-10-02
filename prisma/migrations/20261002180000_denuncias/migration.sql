-- CreateEnum
CREATE TYPE "DenunciaMotivo" AS ENUM ('falso', 'improprio', 'ja_aconteceu', 'outro');

-- CreateEnum
CREATE TYPE "DenunciaStatus" AS ENUM ('aberta', 'descartada', 'resolvida');

-- CreateTable
CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "comment_id" TEXT,
    "motivo" "DenunciaMotivo" NOT NULL,
    "texto" TEXT,
    "status" "DenunciaStatus" NOT NULL DEFAULT 'aberta',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvido_em" TIMESTAMP(3),
    "resolvido_por_id" TEXT,
    "resolucao" TEXT,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "denuncias_um_alvo" CHECK (("event_id" IS NULL) <> ("comment_id" IS NULL))
);

-- CreateIndex
CREATE INDEX "denuncias_status_criado_em_idx" ON "denuncias"("status", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "denuncias_user_id_event_id_key" ON "denuncias"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "denuncias_user_id_comment_id_key" ON "denuncias"("user_id", "comment_id");

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_resolvido_por_id_fkey" FOREIGN KEY ("resolvido_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Copia as denúncias antigas de comentário (comment_reports fica intacta)
INSERT INTO "denuncias" ("id", "user_id", "comment_id", "motivo", "texto", "status", "criado_em", "resolvido_em", "resolucao")
SELECT r."id", r."user_id", r."comment_id", 'outro', NULLIF(r."motivo", ''),
       CASE WHEN c."oculto" THEN 'resolvida'::"DenunciaStatus" ELSE 'aberta'::"DenunciaStatus" END,
       r."criado_em",
       CASE WHEN c."oculto" THEN r."criado_em" END,
       CASE WHEN c."oculto" THEN 'remover_comentario' END
FROM "comment_reports" r
JOIN "comments" c ON c."id" = r."comment_id"
ON CONFLICT DO NOTHING;
