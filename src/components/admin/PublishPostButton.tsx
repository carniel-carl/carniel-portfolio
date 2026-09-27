"use client";

import { Button } from "@/components/ui/button";
import { publishBlogPost } from "@/lib/actions/blog";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export default function PublishPostButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handlePublish = () =>
    startTransition(async () => {
      try {
        await publishBlogPost(id);
        toast.success("Post published");
        router.refresh();
      } catch {
        toast.error("Could not publish post");
      }
    });

  return (
    <Button onClick={handlePublish} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Send />}
      {pending ? "Publishing" : "Publish"}
    </Button>
  );
}
