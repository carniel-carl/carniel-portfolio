import AdminFrame from "@/components/admin/shell/AdminFrame";
import AdminShellSkeleton from "@/components/admin/shell/AdminShellSkeleton";
import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { Suspense } from "react";

async function getDraftCount() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");
  return prisma.blogPost.count({ where: { published: false } });
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, cookieStore, draftCount] = await Promise.all([
    auth(),
    cookies(),
    getDraftCount(),
  ]);

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    isSuperAdmin: !!session?.user?.isAdmin,
  };

  return (
    <AdminFrame
      user={user}
      badges={{ [routes.admin.blog]: draftCount }}
      defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
    >
      {children}
    </AdminFrame>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
