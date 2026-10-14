import prisma from "@/lib/prisma";

/** Series for the post form's picker, with how many episodes each has. */
export async function getSeriesOptions() {
  const rows = await prisma.series.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, _count: { select: { posts: true } } },
  });
  return rows.map(({ _count, ...s }) => ({ ...s, episodeCount: _count.posts }));
}
