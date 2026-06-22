-- AlterTable
ALTER TABLE "Captures" ADD COLUMN     "annotatedImageLocal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "annotatedImageUrl" TEXT;
