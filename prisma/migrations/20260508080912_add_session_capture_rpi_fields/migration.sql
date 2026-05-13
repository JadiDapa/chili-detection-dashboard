/*
  Warnings:

  - You are about to drop the column `damaged` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `detected` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `plantPos` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `ripe` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `turning` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `unripe` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `valveDuration` on the `Captures` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `piSessionId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Captures" DROP COLUMN "damaged",
DROP COLUMN "detected",
DROP COLUMN "plantPos",
DROP COLUMN "ripe",
DROP COLUMN "timestamp",
DROP COLUMN "turning",
DROP COLUMN "unripe",
DROP COLUMN "valveDuration",
ADD COLUMN     "brokenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lateSynced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plantIndex" INTEGER,
ADD COLUMN     "ripeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalFruits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "turningCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unripeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "valveDurationSec" DOUBLE PRECISION,
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "description",
DROP COLUMN "endTime",
DROP COLUMN "piSessionId",
DROP COLUMN "startTime",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "title" DROP NOT NULL;
