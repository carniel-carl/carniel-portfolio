import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { revalidateTag } from "next/cache";
import { UTApi, UTFile } from "uploadthing/server";
import { z } from "zod";
import { sanitizeRichText } from "@/components/content/RichText";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { toSlug } from "@/lib/projects/slug";
import { SITE_URL } from "@/lib/site";

// Blog tools for AI agents (Claude Cowork, Claude Code, ...) over MCP.
// Agents can write and revise drafts, but nothing here can publish: every
// post is created with published: false and live posts are read-only, so a
// draft only goes public when you approve it in /admin/blog.

export const MCP_INSTRUCTIONS = `Tools for drafting posts on Chimezie Carniel's portfolio blog.
Workflow: call list_categories (and list_posts to avoid repeating a topic), upload any images with upload_image, then create_draft. Revise with update_draft.
Posts are always saved as drafts. You cannot publish; the owner reviews and publishes each draft in the admin, so share the preview link you get back.`;

const CONTENT_FORMAT = `Post body as HTML. The title renders separately, so don't repeat it or use <h1>.
Use <h2>/<h3> for sections (they build the table of contents), <p>, <ul>/<ol>/<li>, <blockquote>, <a href>, <strong>, <em>, <code>, <hr>, <table>.
Code blocks: <pre><code class="language-ts">...</code></pre> with the code HTML-escaped.
Images: <img src alt> using URLs from upload_image. Other tags and attributes are stripped.`;

const utapi = new UTApi();

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const isUploadHost = (host: string) => host === "utfs.io" || host.endsWith(".ufs.sh");

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

// Tool errors go back to the agent as text so it can correct itself and retry
function guard<A>(run: (args: A) => Promise<unknown>) {
  return async (args: A) => {
    try {
      return ok(await run(args));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text" as const, text: message }], isError: true };
    }
  };
}

const adminLinks = (id: string) => ({
  preview: `${SITE_URL}/admin/blog/${id}/preview`,
  edit: `${SITE_URL}/admin/blog/${id}/edit`,
});

// Drafts aren't public, but the admin list and dashboard are cached on this tag
const invalidateBlog = () => revalidateTag(CACHE_TAGS.blog, { expire: 0 });

async function getAuthorId() {
  const email = process.env.ADMIN_EMAIL;
  const user =
    (email && (await prisma.user.findUnique({ where: { email }, select: { id: true } }))) ||
    (await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } }));
  if (!user) throw new Error("No admin user to attribute the post to");
  return user.id;
}

// Accepts a category id, slug or name so the agent doesn't need a lookup first
async function resolveCategoryId(ref: string) {
  const needle = ref.trim().toLowerCase();
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  const match = categories.find(
    (c) => c.id === ref.trim() || c.slug === needle || c.name.toLowerCase() === needle,
  );
  if (!match) {
    const names = categories.map((c) => c.name).join(", ") || "none yet";
    throw new Error(`Unknown category "${ref}". Available: ${names}. Use create_category to add one.`);
  }
  return match.id;
}

async function uniqueSlug(base: string, ignoreId?: string) {
  const conflict = await prisma.blogPost.findUnique({ where: { slug: base }, select: { id: true } });
  return conflict && conflict.id !== ignoreId ? `${base}-${Date.now()}` : base;
}

const cleanTags = (tags: string[]) => [...new Set(tags.map((t) => t.trim()).filter(Boolean))];

// Re-hosts an image on UploadThing so posts never hotlink, and the monthly
// cleanup cron can see (and keep) everything a post references
async function storeImage(source: string, name: string) {
  let bytes: Uint8Array<ArrayBuffer>;
  let type: string;

  const dataUri = source.match(/^data:([\w/+.-]+);base64,([\s\S]+)$/);
  if (dataUri) {
    type = dataUri[1];
    bytes = Buffer.from(dataUri[2], "base64");
  } else {
    const url = new URL(source);
    if (url.protocol !== "https:") throw new Error("Image URLs must use https");
    if (isUploadHost(url.hostname)) return source;

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Couldn't fetch image (${res.status}): ${source}`);
    type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    bytes = new Uint8Array(await res.arrayBuffer());
  }

  if (!IMAGE_TYPES.has(type)) throw new Error(`Unsupported image type "${type}" (use png, jpeg, webp, gif or avif)`);
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("Image is over 4MB");

  const ext = type.split("/")[1].replace("jpeg", "jpg");
  const file = new UTFile([bytes], `${toSlug(name)}.${ext}`, { type });
  const { data, error } = await utapi.uploadFiles(file);
  if (error || !data) throw new Error(`Upload failed: ${error?.message ?? "unknown error"}`);
  return data.ufsUrl;
}

const postSummary = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  tags: true,
  published: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { name: true } },
} as const;

export function registerBlogTools(server: McpServer) {
  server.registerTool(
    "list_categories",
    {
      title: "List blog categories",
      description: "Every blog category with its post count. Pass a category's name, slug or id to create_draft.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    guard(async () =>
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, color: true, _count: { select: { posts: true } } },
      }),
    ),
  );

  server.registerTool(
    "create_category",
    {
      title: "Create blog category",
      description: "Adds a category. Only do this when none of the existing ones fit.",
      inputSchema: {
        name: z.string().trim().min(1).max(40),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional()
          .describe("Hex colour for the category pill, e.g. #14aaa0"),
      },
    },
    guard(async ({ name, color }: { name: string; color?: string }) => {
      const category = await prisma.category.create({
        data: { name, slug: toSlug(name), ...(color && { color }) },
        select: { id: true, name: true, slug: true, color: true },
      });
      revalidateTag(CACHE_TAGS.categories, { expire: 0 });
      return category;
    }),
  );

  server.registerTool(
    "list_posts",
    {
      title: "List blog posts",
      description: "Recent posts, newest first. Use it to avoid duplicate topics and to find posts worth linking to.",
      inputSchema: {
        status: z.enum(["all", "drafts", "published"]).default("all"),
        limit: z.number().int().min(1).max(100).default(30),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ status, limit }: { status: "all" | "drafts" | "published"; limit: number }) => {
      const posts = await prisma.blogPost.findMany({
        where: status === "all" ? {} : { published: status === "published" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: postSummary,
      });
      return posts.map((p) => ({
        ...p,
        url: p.published ? `${SITE_URL}/blog/${p.slug}` : adminLinks(p.id).preview,
      }));
    }),
  );

  server.registerTool(
    "get_post",
    {
      title: "Get blog post",
      description: "One post with its full HTML content, by id or slug.",
      inputSchema: { idOrSlug: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ idOrSlug }: { idOrSlug: string }) => {
      const where = /^[0-9a-f]{24}$/i.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
      const post = await prisma.blogPost.findUnique({
        where,
        select: { ...postSummary, content: true, coverImage: true },
      });
      if (!post) throw new Error(`No post found for "${idOrSlug}"`);
      return { ...post, links: adminLinks(post.id) };
    }),
  );

  server.registerTool(
    "upload_image",
    {
      title: "Upload image",
      description:
        "Stores an image on the site's CDN and returns its URL, for covers or <img> tags in a post. Max 4MB; png, jpeg, webp, gif or avif.",
      inputSchema: {
        source: z.string().min(1).describe("An https image URL, or a base64 data URI (data:image/png;base64,...)"),
        name: z.string().max(80).default("blog-image").describe("Short file name, e.g. the post slug"),
      },
    },
    guard(async ({ source, name }: { source: string; name: string }) => ({
      url: await storeImage(source, name),
    })),
  );

  const draftFields = {
    title: z.string().trim().min(1).max(200),
    content: z.string().min(1).describe(CONTENT_FORMAT),
    excerpt: z.string().trim().max(300).optional().describe("One or two sentences for cards and SEO, ideally under 160 characters"),
    category: z.string().min(1).describe("Category name, slug or id (see list_categories)"),
    tags: z.array(z.string()).max(10).optional().describe("A few lowercase topic tags"),
    coverImage: z
      .string()
      .optional()
      .describe("Cover image: an https URL or base64 data URI, re-hosted automatically. 1200x630 landscape fits best"),
    slug: z.string().optional().describe("URL slug; derived from the title when omitted"),
  };

  type DraftInput = {
    title: string;
    content: string;
    excerpt?: string;
    category: string;
    tags?: string[];
    coverImage?: string;
    slug?: string;
  };

  server.registerTool(
    "create_draft",
    {
      title: "Create draft post",
      description:
        "Saves a new blog post as an unpublished draft for review in the admin. Returns the post id plus preview and edit links.",
      inputSchema: draftFields,
    },
    guard(async (input: DraftInput) => {
      const [authorId, categoryId] = await Promise.all([getAuthorId(), resolveCategoryId(input.category)]);
      const slug = await uniqueSlug(toSlug(input.slug || input.title));
      const coverImage = input.coverImage ? await storeImage(input.coverImage, slug) : null;

      const post = await prisma.blogPost.create({
        data: {
          title: input.title,
          slug,
          content: sanitizeRichText(input.content),
          excerpt: input.excerpt || null,
          coverImage,
          tags: cleanTags(input.tags ?? []),
          published: false,
          publishedAt: null,
          authorId,
          categoryId,
        },
        select: { id: true, slug: true },
      });

      invalidateBlog();
      return { ...post, status: "draft", links: adminLinks(post.id) };
    }),
  );

  server.registerTool(
    "update_draft",
    {
      title: "Update draft post",
      description: "Edits an unpublished draft. Only the fields you pass change. Published posts can't be edited here.",
      inputSchema: {
        id: z.string().regex(/^[0-9a-f]{24}$/i, "Use the post id from create_draft or list_posts"),
        ...Object.fromEntries(Object.entries(draftFields).map(([key, schema]) => [key, schema.optional()])),
      } as { id: z.ZodString } & { [K in keyof typeof draftFields]: z.ZodOptional<(typeof draftFields)[K]> },
    },
    guard(async ({ id, ...input }: { id: string } & Partial<DraftInput>) => {
      const existing = await prisma.blogPost.findUnique({ where: { id }, select: { published: true, slug: true } });
      if (!existing) throw new Error(`No post with id ${id}`);
      if (existing.published) throw new Error("This post is live. Edit published posts in the admin.");

      const slug = input.slug ? await uniqueSlug(toSlug(input.slug), id) : undefined;
      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          ...(input.title && { title: input.title }),
          ...(slug && { slug }),
          ...(input.content && { content: sanitizeRichText(input.content) }),
          ...(input.excerpt !== undefined && { excerpt: input.excerpt || null }),
          ...(input.tags && { tags: cleanTags(input.tags) }),
          ...(input.category && { categoryId: await resolveCategoryId(input.category) }),
          ...(input.coverImage && { coverImage: await storeImage(input.coverImage, slug ?? existing.slug) }),
        },
        select: { id: true, slug: true },
      });

      invalidateBlog();
      return { ...post, status: "draft", links: adminLinks(post.id) };
    }),
  );
}
