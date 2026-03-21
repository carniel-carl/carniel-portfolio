import { getCachedAllPosts } from "@/lib/actions/blog";
import BlogClient from "@/components/admin/BlogClient";

export default async function BlogAdminPage() {
  const posts = await getCachedAllPosts();
  return <BlogClient posts={posts} />;
}
