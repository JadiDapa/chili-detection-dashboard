import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PI_URL =
  process.env.NEXT_PUBLIC_RASPBERRY_PI_URL ?? "http://localhost:8000";

// 2×8 grid, 750 mm column spacing, 1000 mm row spacing
const ROWS = 2;
const COLS = 8;
const GAP_X_MM = 650;
const GAP_Y_MM = 700;

async function main() {
  // ── User ───────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { username: "administrator" },
    update: {},
    create: {
      username: "administrator",
      name: "Administrator",
      role: "ADMIN",
    },
  });
  console.log({ admin });

  // ── ScanConfig ─────────────────────────────────────────────────────────────
  const existing = await prisma.scanConfig.findFirst({
    where: { isDefault: true },
  });
  if (!existing) {
    const defaultConfig = await prisma.scanConfig.create({
      data: {
        name: "Default",
        description: "Default scan — single capture, whole-frame counting",
        isDefault: true,
        captureOffsets: [
          {
            z_mm: 0.0,
            x_offset_mm: 0.0,
            y_offset_mm: 0.0,
            servo_pan: 90.0,
            servo_tilt: 90.0,
          },
        ],
      },
    });
    console.log({ defaultConfig });
  } else {
    console.log({ defaultConfig: existing });
  }

  // ── Bed ────────────────────────────────────────────────────────────────────
  // id=1 matches bed_id="1" in raspberry/config.py — must stay in sync.
  const bed = await prisma.bed.upsert({
    where: { id: 1 },
    update: { piUrl: PI_URL },
    create: {
      id: 1,
      name: "UNSRI Greenhouse Bed 1",
      description: "Main 2×8 chili planter bed (2×6m gantry)",
      piUrl: PI_URL,
      rows: ROWS,
      cols: COLS,
      gapXMm: GAP_X_MM,
      gapYMm: GAP_Y_MM,
      startXMm: 140,
      startYMm: 280,
    },
  });
  console.log({ bed });

  // ── Plants ─────────────────────────────────────────────────────────────────
  // plantPos is 1-based, row-major (row 0 col 0 = plant 1, row 0 col 7 = plant 8, …)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const plantPos = row * COLS + col + 1;
      await prisma.plant.upsert({
        where: { bedId_plantPos: { bedId: 1, plantPos } },
        update: {},
        create: {
          bedId: 1,
          plantPos,
          row,
          col,
          xMm: col * GAP_X_MM,
          yMm: row * GAP_Y_MM,
          label: `Plant ${plantPos}`,
        },
      });
    }
  }
  console.log(`seeded ${ROWS * COLS} plants`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
