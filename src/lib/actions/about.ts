"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isAvailability, isValidTimezone } from "@/lib/availability";

// Blank fields are stored as null so the site hides them
function availabilityData(data: {
  availability?: string | null;
  availabilityNote?: string | null;
  timezone?: string | null;
}) {
  const text = (v?: string | null) => (v && v.trim() ? v.trim() : null);
  const timezone = text(data.timezone);
  if (timezone && !isValidTimezone(timezone)) {
    throw new Error("Unknown time zone");
  }
  return {
    availability: isAvailability(data.availability) ? data.availability : null,
    availabilityNote: text(data.availabilityNote),
    timezone,
  };
}

export async function updateAbout(data: {
  bio: string;
  profilePicUrl: string;
  resumeUrl: string;
  availability?: string | null;
  availabilityNote?: string | null;
  timezone?: string | null;
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
        ...availabilityData(data),
      },
    });
    // updateTag: the next page load already shows the change (hero, footer,
    // contact); revalidateTag also refreshes the CDN copies
    updateTag(CACHE_TAGS.about);
    revalidateTag(CACHE_TAGS.about, "max");
    return about;
  }

  const about = await prisma.about.update({
    where: { id: existing.id },
    data: {
      bio: data.bio,
      profilePicUrl: data.profilePicUrl,
      resumeUrl: data.resumeUrl,
      ...availabilityData(data),
    },
  });

  // updateTag: the next page load already shows the change (hero, footer,
    // contact); revalidateTag also refreshes the CDN copies
    updateTag(CACHE_TAGS.about);
    revalidateTag(CACHE_TAGS.about, "max");
  return about;
}
