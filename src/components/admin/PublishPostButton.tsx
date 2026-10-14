"use client";

import { useActionToast } from "@/components/admin/useActionToast";
import { Button } from "@/components/ui/button";
import { publishBlogPost } from "@/lib/actions/blog";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

export default function PublishPostButton({ id }: { id: string }) {
  const runAction = useActionToast();
  const [pending, setPending] = useState(false);

  const handlePublish = async () => {
    setPending(true);
    await runAction(() => publishBlogPost(id), {
      loading: "Publishing post…",
      success: "Post published",
      error: "Could not publish post",
    });
    setPending(false);
  };

  return (
    <Button onClick={handlePublish} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Send />}
      {pending ? "Publishing" : "Publish"}
    </Button>
  );
}
