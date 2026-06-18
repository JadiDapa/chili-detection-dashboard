-- Rename padding* -> start* on ScanConfig and WateringConfig.
-- These columns were always the first-plant origin (col 0 / row 0), never a
-- symmetric margin, so the name was misleading. RENAME COLUMN preserves data.

ALTER TABLE "ScanConfig" RENAME COLUMN "paddingXMm" TO "startXMm";
ALTER TABLE "ScanConfig" RENAME COLUMN "paddingYMm" TO "startYMm";

ALTER TABLE "WateringConfig" RENAME COLUMN "paddingXMm" TO "startXMm";
ALTER TABLE "WateringConfig" RENAME COLUMN "paddingYMm" TO "startYMm";
