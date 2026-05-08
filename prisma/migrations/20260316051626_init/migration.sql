-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'STOPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GUEST');

-- CreateTable
CREATE TABLE "Bed" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "piUrl" TEXT NOT NULL,
    "rows" INTEGER NOT NULL DEFAULT 2,
    "cols" INTEGER NOT NULL DEFAULT 8,
    "borderMm" DOUBLE PRECISION NOT NULL DEFAULT 650,
    "spacingMm" DOUBLE PRECISION NOT NULL DEFAULT 700,
    "lastUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Captures" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "plantId" INTEGER,
    "plantPos" INTEGER,
    "row" INTEGER,
    "col" INTEGER,
    "imageUrl" TEXT NOT NULL,
    "detected" INTEGER NOT NULL DEFAULT 0,
    "ripe" INTEGER NOT NULL DEFAULT 0,
    "turning" INTEGER NOT NULL DEFAULT 0,
    "unripe" INTEGER NOT NULL DEFAULT 0,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "heightCm" DOUBLE PRECISION,
    "moisturePct" DOUBLE PRECISION,
    "valveDuration" DOUBLE PRECISION,
    "wateringReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" SERIAL NOT NULL,
    "bedId" INTEGER NOT NULL,
    "plantPos" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "xMm" DOUBLE PRECISION NOT NULL,
    "yMm" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "lastRipe" INTEGER,
    "lastTurning" INTEGER,
    "lastUnripe" INTEGER,
    "lastDamaged" INTEGER,
    "lastHeightCm" DOUBLE PRECISION,
    "lastMoisturePct" DOUBLE PRECISION,
    "lastScannedAt" TIMESTAMP(3),
    "lastImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bedId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "piSessionId" TEXT,
    "totalPlants" INTEGER,
    "avgHeightCm" DOUBLE PRECISION,
    "avgMoisturePct" DOUBLE PRECISION,
    "totalWaterSec" DOUBLE PRECISION,
    "harvestReadyIds" TEXT,
    "totalRipe" INTEGER,
    "totalTurning" INTEGER,
    "totalUnripe" INTEGER,
    "totalDamaged" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "role" "UserRole",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plant_bedId_plantPos_key" ON "Plant"("bedId", "plantPos");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_bedId_row_col_key" ON "Plant"("bedId", "row", "col");

-- CreateIndex
CREATE INDEX "Session_bedId_idx" ON "Session"("bedId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Captures" ADD CONSTRAINT "Captures_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Captures" ADD CONSTRAINT "Captures_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
