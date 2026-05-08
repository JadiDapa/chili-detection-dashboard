import { User, UserRole } from "@/generated/prisma";
import { z } from "zod";

export type UserType = User;

export const UserSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(50).optional(),
});

const UserBaseSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(8).max(30),
  role: z.enum(UserRole),
});

export const CreateUserSchema = UserBaseSchema.extend({
  password: z.string().min(4, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak sama",
});

export const UpdateUserSchema = UserBaseSchema.partial();

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
