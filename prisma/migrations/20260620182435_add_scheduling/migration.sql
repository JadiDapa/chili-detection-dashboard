-- CreateEnum
CREATE TYPE "ScheduleRunStatus" AS ENUM ('DISPATCHED', 'SKIPPED');

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "bedId" INTEGER NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "scanConfigId" INTEGER,
    "wateringConfigId" INTEGER,
    "timeOfDay" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRun" (
    "id" SERIAL NOT NULL,
    "scheduledTaskId" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleRunStatus" NOT NULL DEFAULT 'DISPATCHED',
    "skipReason" TEXT,
    "sessionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledTask_bedId_idx" ON "ScheduledTask"("bedId");

-- CreateIndex
CREATE INDEX "ScheduledTask_enabled_idx" ON "ScheduledTask"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRun_sessionId_key" ON "ScheduleRun"("sessionId");

-- CreateIndex
CREATE INDEX "ScheduleRun_scheduledTaskId_idx" ON "ScheduleRun"("scheduledTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRun_scheduledTaskId_scheduledFor_key" ON "ScheduleRun"("scheduledTaskId", "scheduledFor");

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_scanConfigId_fkey" FOREIGN KEY ("scanConfigId") REFERENCES "ScanConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_wateringConfigId_fkey" FOREIGN KEY ("wateringConfigId") REFERENCES "WateringConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRun" ADD CONSTRAINT "ScheduleRun_scheduledTaskId_fkey" FOREIGN KEY ("scheduledTaskId") REFERENCES "ScheduledTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRun" ADD CONSTRAINT "ScheduleRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
