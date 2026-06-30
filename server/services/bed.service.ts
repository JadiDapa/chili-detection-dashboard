import { prisma } from "@/lib/prisma";
import type { BedGrid } from "@/server/services/scan-config.service";

export type BedGridInput = {
  rows: number;
  cols: number;
  gapXMm: number;
  gapYMm: number;
  startXMm: number;
  startYMm: number;
};

export const BedService = {
  async getById(id: number) {
    return prisma.bed.findUnique({ where: { id } });
  },

  // The grid as the snapshot/coordinate code expects it (matches BedGrid).
  async getGrid(id: number): Promise<BedGrid> {
    const bed = await prisma.bed.findUnique({ where: { id } });
    return {
      cols: bed?.cols ?? 8,
      rows: bed?.rows ?? 2,
      gapXMm: bed?.gapXMm ?? 750.0,
      gapYMm: bed?.gapYMm ?? 1000.0,
      startXMm: bed?.startXMm ?? 0.0,
      startYMm: bed?.startYMm ?? 0.0,
    };
  },

  // Update the bed grid and regenerate its Plant rows so positions
  // (plantPos/row/col/xMm/yMm) always reflect the current layout. Runs in one
  // transaction. Existing plant rows are reused by index where possible so that
  // their Captures linkage survives; plants that fall outside the new grid are
  // deleted (Captures.plantId is optional → set null, history rows are kept).
  async updateGrid(bedId: number, grid: BedGridInput) {
    return prisma.$transaction(async (tx) => {
      const bed = await tx.bed.update({
        where: { id: bedId },
        data: {
          rows: grid.rows,
          cols: grid.cols,
          gapXMm: grid.gapXMm,
          gapYMm: grid.gapYMm,
          startXMm: grid.startXMm,
          startYMm: grid.startYMm,
          lastUpdatedAt: new Date(),
        },
      });

      const existing = await tx.plant.findMany({
        where: { bedId },
        orderBy: { plantPos: "asc" },
      });

      // Park every existing plant at a unique negative position so re-keying
      // below can't trip the (bedId, plantPos) / (bedId, row, col) unique keys.
      for (let i = 0; i < existing.length; i++) {
        await tx.plant.update({
          where: { id: existing[i].id },
          data: { plantPos: -(i + 1), row: -(i + 1), col: -(i + 1) },
        });
      }

      // Build the target grid, row-major (plantPos is 1-based).
      const targets: {
        plantPos: number;
        row: number;
        col: number;
        xMm: number;
        yMm: number;
      }[] = [];
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          targets.push({
            plantPos: row * grid.cols + col + 1,
            row,
            col,
            xMm: grid.startXMm + col * grid.gapXMm,
            yMm: grid.startYMm + row * grid.gapYMm,
          });
        }
      }

      // Reuse existing rows by index (keeps capture linkage), create the rest.
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (i < existing.length) {
          await tx.plant.update({
            where: { id: existing[i].id },
            data: {
              plantPos: t.plantPos,
              row: t.row,
              col: t.col,
              xMm: t.xMm,
              yMm: t.yMm,
              label: existing[i].label ?? `Plant ${t.plantPos}`,
            },
          });
        } else {
          await tx.plant.create({
            data: {
              bedId,
              plantPos: t.plantPos,
              row: t.row,
              col: t.col,
              xMm: t.xMm,
              yMm: t.yMm,
              label: `Plant ${t.plantPos}`,
            },
          });
        }
      }

      // Drop plants that no longer fit the (smaller) grid.
      if (existing.length > targets.length) {
        const leftoverIds = existing.slice(targets.length).map((p) => p.id);
        await tx.plant.deleteMany({ where: { id: { in: leftoverIds } } });
      }

      return bed;
    });
  },
};
