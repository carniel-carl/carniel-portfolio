export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import BlogClient from "@/components/admin/BlogClient";

export default async function BlogAdminPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <BlogClient posts={JSON.parse(JSON.stringify(posts))} />;
}
