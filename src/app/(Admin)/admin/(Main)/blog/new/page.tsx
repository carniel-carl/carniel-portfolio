import BlogPostForm from "@/components/admin/BlogPostForm";
import BackButton from "@/components/general/BackButton";

export default function NewBlogPostPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <BackButton showText />
        <h2 className="text-2xl font-bold">New Blog Post</h2>
      </div>
      <BlogPostForm />
    </div>
  );
}
