import { Prisma, CaptureStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SessionListOptions = {
  page?: number;
  pageSize?: number;

  // filters
  status?: CaptureStatus;
  year?: number; // filter by startTime year (if provided)
  search?: string; // title / description
  row?: number;
  column?: number;

  // ordering
  orderBy?: Prisma.SessionOrderByWithRelationInput;

  // include relation?
  includeCaptures?: boolean;
};

function buildWhere(opts: SessionListOptions): Prisma.SessionWhereInput {
  const where: Prisma.SessionWhereInput = {};

  if (opts.year) {
    const start = new Date(opts.year, 0, 1);
    const next = new Date(opts.year + 1, 0, 1);
    // startTime can be nullable, so this naturally filters only rows with startTime in range
    where.startTime = { gte: start, lt: next };
  }

  if (opts.status) where.status = opts.status;
  if (typeof opts.row === "number") where.row = opts.row;
  if (typeof opts.column === "number") where.column = opts.column;

  if (opts.search?.trim()) {
    const q = opts.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export const SessionService = {
  async list(opts: SessionListOptions = {}) {
    const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
    const page = Math.max(opts.page ?? 1, 1);

    const where = buildWhere(opts);
    const orderBy = opts.orderBy ?? { createdAt: "desc" };

    const include = opts.includeCaptures ? { captures: true } : undefined;

    const [items, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy,
        include,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.session.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getAll(includeCaptures = false) {
    return prisma.session.findMany({
      include: includeCaptures ? { captures: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: number) {
    return prisma.session.findUnique({
      where: { id },
      include: {
        captures: true,
      },
    });
  },

  async create(data: Prisma.SessionCreateInput) {
    return prisma.session.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        startTime: data.startTime ?? undefined,
        endTime: data.endTime ?? null,
        status: data.status ?? CaptureStatus.PENDING,
        row: data.row ?? 0,
        column: data.column ?? 0,
      },
    });
  },

  async update(id: number, data: Prisma.SessionUpdateInput) {
    return prisma.session.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
        ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
        ...(data.endTime !== undefined
          ? { endTime: data.endTime ?? null }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.row !== undefined ? { row: data.row ?? 0 } : {}),
        ...(data.column !== undefined ? { column: data.column ?? 0 } : {}),
      },
    });
  },

  async delete(id: number) {
    return prisma.session.delete({ where: { id } });
  },
};
