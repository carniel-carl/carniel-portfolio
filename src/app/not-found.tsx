import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, FolderOpen } from "lucide-react";
import PillLink from "@/components/motion/PillLink";
import StatusPage from "@/components/layout/StatusPage";
import routes from "@/lib/routes";

// Next.js adds the noindex tag to not-found responses itself
export const metadata: Metadata = { title: "Page not found" };

// Catches unknown URLs and every notFound() call. It renders outside the
// public layout, so it brings its own logo and grain.
export default function NotFound() {
  return (
    <StatusPage
      standalone
      code="404"
      eyebrow="Error 404"
      title="This page doesn't exist"
      description="The link may be old or mistyped, or the page has moved. Here are the places people usually look for."
      actions={
        <>
          <PillLink href={routes.public.home} icon={<ArrowUpRight />}>
            Back home
          </PillLink>
          <PillLink href={routes.public.portfolio} variant="ghost" icon={<FolderOpen />}>
            See my work
          </PillLink>
          <PillLink href={routes.public.blog} variant="ghost" icon={<BookOpen />}>
            Read the blog
          </PillLink>
        </>
      }
    />
  );
}
