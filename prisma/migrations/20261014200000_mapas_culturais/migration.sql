-- AlterEnum
ALTER TYPE "EventFonte" ADD VALUE 'mapas_culturais';

-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'importado';
ALTER TYPE "EventStatus" ADD VALUE 'inativo';

-- DropIndex
DROP INDEX "events_id_externo_key";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "data_fim" TIMESTAMP(3),
ADD COLUMN     "editado_pela_equipe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fonte_instancia" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sincronizado_em" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "events_fonte_fonte_instancia_id_externo_key" ON "events"("fonte", "fonte_instancia", "id_externo");
