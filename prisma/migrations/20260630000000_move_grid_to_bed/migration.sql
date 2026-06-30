-- Move grid layout (cols/rows/gaps/first-plant) out of the per-session configs
-- and onto the Bed, which is now the single source of truth for plant positions.

-- AlterTable: Bed gains the grid fields, loses the legacy border/spacing.
ALTER TABLE "Bed"
    ADD COLUMN "gapXMm" DOUBLE PRECISION NOT NULL DEFAULT 750.0,
    ADD COLUMN "gapYMm" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    ADD COLUMN "startXMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN "startYMm" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- Back-fill Bed grid from the default ScanConfig (if present) so any
-- previously-customized grid carries over before the config columns are dropped.
UPDATE "Bed" b
SET "rows" = s."rows",
    "cols" = s."cols",
    "gapXMm" = s."gapXMm",
    "gapYMm" = s."gapYMm",
    "startXMm" = s."startXMm",
    "startYMm" = s."startYMm"
FROM "ScanConfig" s
WHERE s."isDefault" = true;

ALTER TABLE "Bed"
    DROP COLUMN "borderMm",
    DROP COLUMN "spacingMm";

-- AlterTable: drop grid from all three session-config models.
ALTER TABLE "ScanConfig"
    DROP COLUMN "cols",
    DROP COLUMN "rows",
    DROP COLUMN "gapXMm",
    DROP COLUMN "gapYMm",
    DROP COLUMN "startXMm",
    DROP COLUMN "startYMm";

ALTER TABLE "WateringConfig"
    DROP COLUMN "cols",
    DROP COLUMN "rows",
    DROP COLUMN "gapXMm",
    DROP COLUMN "gapYMm",
    DROP COLUMN "startXMm",
    DROP COLUMN "startYMm";

ALTER TABLE "DatasetConfig"
    DROP COLUMN "cols",
    DROP COLUMN "rows",
    DROP COLUMN "gapXMm",
    DROP COLUMN "gapYMm",
    DROP COLUMN "startXMm",
    DROP COLUMN "startYMm";
