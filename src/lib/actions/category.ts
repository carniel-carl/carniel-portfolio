"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

const invalidateCategoryCaches = () => {
  updateTag(CACHE_TAGS.categories);
  revalidateTag(CACHE_TAGS.categories, "max");
  updateTag(CACHE_TAGS.blog);
  revalidateTag(CACHE_TAGS.blog, "max");
  revalidatePath("/blog");
};

export async function createCategory(data: {
  name: string;
  slug: string;
  color: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!data.name || !data.slug) {
    throw new Error("Name and slug are required");
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      color: data.color,
    },
  });

  invalidateCategoryCaches();
  return category;
}

export async function updateCategory(
  id: string,
  data: { name: string; slug: string; color: string },
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      color: data.color,
    },
  });

  invalidateCategoryCaches();
  return category;
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new Error("Not found");

  // Prevent deleting the default "Others" category
  if (category.slug === "others") {
    throw new Error("Cannot delete the default category");
  }

  // Reassign posts to the "Others" category
  const othersCategory = await prisma.category.findUnique({
    where: { slug: "others" },
  });

  if (!othersCategory) {
    throw new Error("Default category not found");
  }

  await prisma.blogPost.updateMany({
    where: { categoryId: id },
    data: { categoryId: othersCategory.id },
  });

  await prisma.category.delete({ where: { id } });

  invalidateCategoryCaches();
}
