-- CreateEnum
CREATE TYPE "DatasetSessionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CaptureType" AS ENUM ('IMAGE_CAPTURE', 'VIDEO');

-- CreateTable
CREATE TABLE "DatasetCaptures" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "datasetSession" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatasetCaptures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "location" TEXT,
    "status" "DatasetSessionStatus" NOT NULL DEFAULT 'PENDING',
    "captureType" "CaptureType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DatasetCaptures" ADD CONSTRAINT "DatasetCaptures_datasetSession_fkey" FOREIGN KEY ("datasetSession") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
