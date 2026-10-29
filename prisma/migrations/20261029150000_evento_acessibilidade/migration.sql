-- AlterTable
ALTER TABLE "events" ADD COLUMN     "acessibilidade" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "audiodescricao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inscricoes" TEXT,
ADD COLUMN     "instagram_evento" TEXT,
ADD COLUMN     "libras" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "site_evento" TEXT;

