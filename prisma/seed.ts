import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
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

  const existing = await prisma.scanConfig.findFirst({ where: { isDefault: true } });
  if (!existing) {
    const defaultConfig = await prisma.scanConfig.create({
      data: {
        name: "Default",
        description: "Default 2×8 grid — 750mm column spacing, 1000mm row spacing",
        isDefault: true,
        cols: 8,
        rows: 2,
        gapXMm: 750.0,
        gapYMm: 1000.0,
        paddingXMm: 0.0,
        paddingYMm: 0.0,
        captureOffsets: [
          {
            z_mm: 50.0,
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
