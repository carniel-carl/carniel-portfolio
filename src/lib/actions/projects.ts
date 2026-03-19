"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProject(data: {
  name: string;
  tag?: string;
  description: string;
  img: string;
  mediaType?: string;
  live?: string;
  code?: string;
  stack?: string[];
  featured?: boolean;
  order?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!data.name || !data.description || !data.img) {
    throw new Error("Name, description, and image are required");
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      tag: data.tag || null,
      description: data.description,
      img: data.img,
      mediaType: data.mediaType || "image",
      live: data.live || null,
      code: data.code || null,
      stack: data.stack || [],
      featured: data.featured || false,
      order: data.order || 0,
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/");
  return project;
}

export async function updateProject(
  id: string,
  data: {
    name: string;
    tag?: string;
    description: string;
    img: string;
    mediaType?: string;
    live?: string;
    code?: string;
    stack?: string[];
    featured?: boolean;
    order?: number;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      tag: data.tag,
      description: data.description,
      img: data.img,
      mediaType: data.mediaType,
      live: data.live,
      code: data.code,
      stack: data.stack,
      featured: data.featured,
      order: data.order,
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/");
  return project;
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  revalidatePath("/");
}
