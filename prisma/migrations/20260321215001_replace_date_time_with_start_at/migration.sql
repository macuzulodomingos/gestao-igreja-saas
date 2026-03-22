-- Adiciona startAt como opcional primeiro
ALTER TABLE "Event" ADD COLUMN "startAt" TIMESTAMP(3);

-- Preenche com date + time existentes convertidos para UTC (WAT = UTC+1)
UPDATE "Event" 
SET "startAt" = (date + (time || ':00')::time) AT TIME ZONE 'Africa/Luanda' AT TIME ZONE 'UTC';

-- Torna obrigatório
ALTER TABLE "Event" ALTER COLUMN "startAt" SET NOT NULL;

-- Remove campos antigos (índice é removido automaticamente com a coluna)
ALTER TABLE "Event" DROP COLUMN "date";
ALTER TABLE "Event" DROP COLUMN "time";

-- Cria novo índice
CREATE INDEX "Event_churchId_startAt_idx" ON "Event"("churchId", "startAt");