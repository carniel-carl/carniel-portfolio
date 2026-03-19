export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import UsersClient from "@/components/admin/UsersClient";

export default async function UsersPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const currentUserEmail = session?.user?.email ?? "";

  return (
    <UsersClient
      users={JSON.parse(JSON.stringify(users))}
      currentUserEmail={currentUserEmail}
    />
  );
}
