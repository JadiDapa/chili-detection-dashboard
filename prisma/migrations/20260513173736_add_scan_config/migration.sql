-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "scanConfigId" INTEGER,
ADD COLUMN     "scanConfigSnapshot" JSONB;

-- CreateTable
CREATE TABLE "ScanConfig" (
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
    "captureOffsets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanConfig_isDefault_idx" ON "ScanConfig"("isDefault");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_scanConfigId_fkey" FOREIGN KEY ("scanConfigId") REFERENCES "ScanConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
