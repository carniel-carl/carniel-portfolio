"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email ?? "" },
  });

  if (!currentUser?.isAdmin) {
    throw new Error("Only super admins can perform this action");
  }

  return currentUser;
}

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
  isAdmin?: boolean;
}) {
  await requireSuperAdmin();

  if (!data.email || !data.password) {
    throw new Error("Email and password are required");
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name || null,
      password: hashedPassword,
      isAdmin: data.isAdmin ?? false,
    },
  });

  revalidatePath("/admin/users");
  return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
}

export async function updateUser(
  id: string,
  data: { name?: string; isAdmin?: boolean }
) {
  await requireSuperAdmin();

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.isAdmin !== undefined && { isAdmin: data.isAdmin }),
    },
    select: { id: true, email: true, name: true, isAdmin: true },
  });

  revalidatePath("/admin/users");
  return updated;
}

export async function deleteUser(id: string) {
  const currentUser = await requireSuperAdmin();

  if (currentUser.id === id) {
    throw new Error("You cannot delete your own account");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
