"use server";

import { revalidatePath } from "next/cache";
import {
  CreateUserSchema,
  UpdateUserSchema,
} from "@/server/validators/user.validator";
import { UserService } from "@/server/services/user.service";
import z from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser?.username) {
    redirect("/sign-in");
  }

  const user = await UserService.getByUsername(clerkUser.username);

  if (!user) {
    throw new Error("User not found in database");
  }

  return user;
}

export async function createUser(input: z.input<typeof CreateUserSchema>) {
  const data = CreateUserSchema.parse({
    username: input.username,
    password: input.password,
    role: input.role,
    name: input.name,
    confirmPassword: input.confirmPassword,
  });

  await UserService.create(data);

  revalidatePath("/users");
}

export async function updateUser(
  userId: number,
  input: z.input<typeof UpdateUserSchema>,
) {
  const data = UpdateUserSchema.parse(input);

  await UserService.update(userId, {
    ...data,
  });

  // revalidate halaman profile & user list
  revalidatePath("/users/" + input.username);
  revalidatePath("/users");
}
