import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import CategoryClient from "@/components/admin/CategoryClient";

async function getCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  cacheLife("max");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return JSON.parse(JSON.stringify(categories));
}

export default async function CategoriesAdminPage() {
  const categories = await getCategories();
  return <CategoryClient categories={categories} />;
}
