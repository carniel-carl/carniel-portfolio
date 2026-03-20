"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function updateAbout(data: {
  bio: string;
  profilePicUrl: string;
  resumeUrl: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.about.findFirst();

  if (!existing) {
    const about = await prisma.about.create({
      data: {
        bio: data.bio || "",
        profilePicUrl: data.profilePicUrl || "",
        resumeUrl: data.resumeUrl || "",
      },
    });
    revalidateTag(CACHE_TAGS.about, "max");
    return about;
  }

  const about = await prisma.about.update({
    where: { id: existing.id },
    data: {
      bio: data.bio,
      profilePicUrl: data.profilePicUrl,
      resumeUrl: data.resumeUrl,
    },
  });

  revalidateTag(CACHE_TAGS.about, "max");
  return about;
}
