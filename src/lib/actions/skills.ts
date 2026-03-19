"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSkill(data: {
  title: string;
  iconName: string;
  iconLib: string;
  order?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!data.title || !data.iconName || !data.iconLib) {
    throw new Error("Title, iconName, and iconLib are required");
  }

  const skill = await prisma.skill.create({
    data: {
      title: data.title,
      iconName: data.iconName,
      iconLib: data.iconLib,
      order: data.order || 0,
    },
  });

  revalidatePath("/admin/skills");
  revalidatePath("/");
  return skill;
}

export async function updateSkill(
  id: string,
  data: {
    title: string;
    iconName: string;
    iconLib: string;
    order?: number;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const skill = await prisma.skill.update({
    where: { id },
    data: {
      title: data.title,
      iconName: data.iconName,
      iconLib: data.iconLib,
      order: data.order,
    },
  });

  revalidatePath("/admin/skills");
  revalidatePath("/");
  return skill;
}

export async function deleteSkill(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.skill.delete({ where: { id } });
  revalidatePath("/admin/skills");
  revalidatePath("/");
}
