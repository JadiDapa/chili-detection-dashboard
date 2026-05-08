"use server";

import { revalidatePath } from "next/cache";
import { LeaveService } from "@/server/services/leave.service";
import z from "zod";
import {
  CreateLeaveSchema,
  LeaveType,
  UpdateLeaveSchema,
} from "@/server/validators/leave.validator";
import {
  Media,
  RequestType,
  MediaType,
  RequestStatus,
} from "@/generated/prisma";
import { uploadMedia } from "./media.action";
import { prisma } from "@/lib/prisma";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressions from "docxtemplater/expressions";
import path from "path";
import fs from "fs";

export async function createLeave({
  leave,
  file,
}: {
  leave: z.input<typeof CreateLeaveSchema>;
  file?: File;
}) {
  const data = CreateLeaveSchema.parse(leave);

  const created = await LeaveService.create(data);

  if (file) {
    await uploadMedia({
      entityId: created.id,
      file,
      RequestType: RequestType.LEAVE,
      mediaType: MediaType.SUBMISSION,
      description: "Pengajuan Cuti",
    });
  }

  revalidatePath("/leave");

  return created;
}

export async function updateLeave(
  id: string,
  input: z.input<typeof UpdateLeaveSchema>,
) {
  const data = UpdateLeaveSchema.parse(input);

  // only sync quota when approving
  if (data.status !== RequestStatus.APPROVED) {
    await prisma.leave.update({
      where: { id },
      data: { status: data.status },
    });

    revalidatePath("/leaves");
    revalidatePath("/leaves/my-leaves");
    return;
  }

  await prisma.$transaction(async (tx) => {
    const leave = await tx.leave.findUnique({
      where: { id },
      select: {
        id: true,
        staffId: true,
        startDate: true,
        daysRequested: true,
        status: true,
      },
    });

    if (!leave) throw new Error("Leave not found");

    if (leave.status === RequestStatus.APPROVED) return;
    if (leave.status !== RequestStatus.SUBMITTED) {
      throw new Error("Leave status is not SUBMITTED");
    }

    const year = new Date(leave.startDate).getFullYear();

    // ensure quota exists
    const quota = await tx.leaveQuota.upsert({
      where: { employeeId_year: { employeeId: leave.staffId, year } },
      update: {},
      create: {
        employeeId: leave.staffId,
        year,
        totalDays: 14,
        usedDays: 0,
      },
      select: { id: true, totalDays: true, usedDays: true },
    });

    const remaining = quota.totalDays - quota.usedDays;
    if (leave.daysRequested > remaining) {
      throw new Error("Sisa kuota cuti tidak cukup");
    }

    // update leave status + attach quotaId
    await tx.leave.update({
      where: { id: leave.id },
      data: {
        status: RequestStatus.APPROVED,
        quotaId: quota.id,
      },
    });

    // increment quota usage
    await tx.leaveQuota.update({
      where: { id: quota.id },
      data: { usedDays: { increment: leave.daysRequested } },
    });
  });

  revalidatePath("/leaves");
  revalidatePath("/leaves/my-leaves");
}

export async function generateLeaveReport(
  leave: LeaveType,
  templateMedia?: Media,
) {
  const templatePath = path.join(
    process.cwd(),
    "/media/templates/template-cuti.docx",
  );
  console.log(templatePath);
  const content = fs.readFileSync(templatePath, "binary");

  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: expressions,
  });

  console.log(leave);

  const leaveData = {
    leave: {
      number: leave.leaveNumber,
      startDate: leave.startDate,
      endDate: leave.endDate,
      quotaTaken: leave.quota?.usedDays,
      quotaLeft: leave.quota?.totalDays - leave.quota?.usedDays,
      dayTaken: leave.daysRequested,
      reason: leave.reason,
      address: leave.address,
      phoneNumber: leave.phoneNumber,
    },
    staff: {
      fullname: leave.staff.fullName,
      nip: leave.staff.nip,
      type: leave.staff.type,
      upt: "UPT Aceh",
    },
    coordinator: {
      upt: "UPT Aceh",
      fullname: "Koor UPT Aceh",
    },
  };

  doc.render(leaveData);

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return {
    filename: `${leave.leaveNumber}.docx`,
    bytes: blob,
  };
}
