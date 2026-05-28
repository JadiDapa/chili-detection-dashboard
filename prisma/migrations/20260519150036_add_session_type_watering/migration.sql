-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('SCAN', 'WATERING');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "fuzzyDurationSec" DOUBLE PRECISION,
ADD COLUMN     "maxHeightCm" DOUBLE PRECISION,
ADD COLUMN     "moistureAfterAvg" DOUBLE PRECISION,
ADD COLUMN     "moistureBeforeAvg" DOUBLE PRECISION,
ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'SCAN',
ADD COLUMN     "stopsWatered" INTEGER,
ADD COLUMN     "wateringConfigId" INTEGER,
ADD COLUMN     "wateringConfigSnapshot" JSONB;

-- CreateTable
CREATE TABLE "WateringConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "cols" INTEGER NOT NULL DEFAULT 8,
    "rows" INTEGER NOT NULL DEFAULT 2,
    "gapXMm" DOUBLE PRECISION NOT NULL DEFAULT 750.0,
    "gapYMm" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "paddingXMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "paddingYMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "zMaxMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "zWaterMm" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "tofSamples" INTEGER NOT NULL DEFAULT 5,
    "sweepSpeedMmSec" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "waterSpeedMmSec" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WateringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WateringStop" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "stopIndex" INTEGER NOT NULL,
    "xMm" DOUBLE PRECISION NOT NULL,
    "yMm" DOUBLE PRECISION NOT NULL,
    "maxHeightCm" DOUBLE PRECISION,
    "valveDurationSec" DOUBLE PRECISION NOT NULL,
    "wateredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WateringStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WateringConfig_isDefault_idx" ON "WateringConfig"("isDefault");

-- CreateIndex
CREATE INDEX "WateringStop_sessionId_idx" ON "WateringStop"("sessionId");

-- CreateIndex
CREATE INDEX "Session_sessionType_idx" ON "Session"("sessionType");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_wateringConfigId_fkey" FOREIGN KEY ("wateringConfigId") REFERENCES "WateringConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WateringStop" ADD CONSTRAINT "WateringStop_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
