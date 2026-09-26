import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import UsersClient from "@/components/admin/UsersClient";

export const metadata: Metadata = { title: "Users" };

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
