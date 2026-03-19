"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSocialLinks(
  data: { name: string; link: string }[]
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  for (const item of data) {
    await prisma.socialLink.upsert({
      where: { name: item.name },
      update: { link: item.link },
      create: { name: item.name, link: item.link },
    });
  }

  revalidatePath("/");
  return prisma.socialLink.findMany();
}
