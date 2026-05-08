import { DatasetSessionStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type DatasetListOptions = {
  page?: number;
  pageSize?: number;
  title?: string;
  status?: DatasetSessionStatus;
  date?: number;
  search?: string;
  row?: number;
  column?: number;
  orderBy?: Prisma.DatasetOrderByWithRelationInput;
  includeCaptures?: boolean;
};

function buildWhere(opts: DatasetListOptions): Prisma.DatasetWhereInput {
  const where: Prisma.DatasetWhereInput = {};

  if (opts.date) {
    const start = new Date(opts.date, 0, 1);
    const next = new Date(opts.date + 1, 0, 1);
    where.startedAt = { gte: start, lt: next };
  }

  if (opts.title) where.title = opts.title;
  if (opts.status) where.status = opts.status;
  if (opts.search?.trim()) {
    const q = opts.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export const DatasetService = {
  async list(opts: DatasetListOptions = {}) {
    const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 100);
    const page = Math.max(opts.page ?? 1, 1);

    const where = buildWhere(opts);
    const orderBy = opts.orderBy ?? { createdAt: "desc" };

    const include = opts.includeCaptures ? { captures: true } : undefined;

    const [items, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        orderBy,
        include,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dataset.count({ where }),
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
    return prisma.dataset.findMany({
      include: includeCaptures ? { captures: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: number) {
    return prisma.dataset.findUnique({
      where: { id },
      include: {
        captures: true,
      },
    });
  },

  async create(data: Prisma.DatasetCreateInput) {
    return prisma.dataset.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        startedAt: data.startedAt ?? undefined,
        endedAt: data.endedAt ?? null,
        status: data.status ?? DatasetSessionStatus.PENDING,
        captureType: data.captureType,
        location: data.location,
      },
    });
  },

  async update(id: number, data: Prisma.DatasetUpdateInput) {
    return prisma.dataset.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description ?? null,
        startedAt: data.startedAt ?? undefined,
        endedAt: data.endedAt ?? null,
        status: data.status ?? DatasetSessionStatus.PENDING,
        captureType: data.captureType,
        location: data.location,
      },
    });
  },

  async delete(id: number) {
    return prisma.dataset.delete({ where: { id } });
  },
};
