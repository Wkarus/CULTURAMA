-- AlterTable
ALTER TABLE "events" ADD COLUMN     "galeria" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sessoes" JSONB NOT NULL DEFAULT '[]';

