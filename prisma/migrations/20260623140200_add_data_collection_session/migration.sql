-- AlterEnum
ALTER TYPE "SessionType" ADD VALUE 'DATA_COLLECTION';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "datasetConfigId" INTEGER,
ADD COLUMN     "datasetConfigSnapshot" JSONB,
ADD COLUMN     "videoDurationSec" DOUBLE PRECISION,
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "DatasetConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "cols" INTEGER NOT NULL DEFAULT 8,
    "rows" INTEGER NOT NULL DEFAULT 2,
    "gapXMm" DOUBLE PRECISION NOT NULL DEFAULT 750.0,
    "gapYMm" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "startXMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startYMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "zMm" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "speedMmSec" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatasetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatasetConfig_isDefault_idx" ON "DatasetConfig"("isDefault");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_datasetConfigId_fkey" FOREIGN KEY ("datasetConfigId") REFERENCES "DatasetConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
