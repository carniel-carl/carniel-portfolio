// Server Component: sanitising, parsing and syntax highlighting all happen on
// the server, so sanitize-html / html-react-parser / lowlight never ship to
// the browser. Only CodeBlock (copy button) and the TOC are client islands.
import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import parse, {
  Element,
  Text,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import { hastToReact, highlightCode } from "@/lib/lowlight";
import CodeBlock from "@/components/blog/CodeBlock";
import TableOfContents from "@/components/blog/TableOfContents";
import AuthorHoverCard from "@/components/blog/AuthorHoverCard";
import { getAbout } from "@/lib/data/portfolio";
import { blogCoverName, blogTitleName } from "@/lib/blog/view-transitions";
import { readingMinutes, withHeadingAnchors } from "@/lib/blog/article";
import { cn } from "@/lib/utils";
import { AUTHOR_NAME } from "@/lib/site";

const ALLOWED_TAGS = [
  "b", "i", "em", "strong", "a", "p", "ul", "ol", "li",
  "img", "iframe", "h1", "h2", "h3", "h4", "h5", "h6",
  "br", "blockquote", "code", "pre", "u", "s", "sub", "sup",
  "hr", "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "width", "height",
  "allowfullscreen", "target", "rel", "class", "style", "id",
];

// Posts need a few sections before a table of contents earns its space
const TOC_MIN_HEADINGS = 3;

function getText(nodes: DOMNode[]): string {
  return nodes
    .map((node) =>
      node instanceof Text
        ? node.data
        : node instanceof Element
          ? getText(node.children as DOMNode[])
          : "",
    )
    .join("");
}

// Colour <pre><code> blocks the same way the editor does
const parserOptions: HTMLReactParserOptions = {
  replace(domNode) {
    if (!(domNode instanceof Element)) return;

    // React holds a navigation's commit until eager <img>s load, which swaps in
    // the route loader and drops the card -> post view transition. Lazy images
    // are exempt, and they're below the hero anyway.
    if (domNode.name === "img") {
      domNode.attribs.loading = "lazy";
      domNode.attribs.decoding = "async";
      return;
    }

    if (domNode.name !== "pre") return;
    const code = domNode.children.find(
      (child): child is Element =>
        child instanceof Element && child.name === "code",
    );
    if (!code) return;

    const language = code.attribs.class?.match(/language-([\w-]+)/)?.[1];
    const text = getText(code.children as DOMNode[]);
    const tree = highlightCode(text, language);

    return (
      <CodeBlock code={text} language={language}>
        {hastToReact(tree.children)}
      </CodeBlock>
    );
  },
};

interface BlogPostContentProps {
  post: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    coverImage: string | null;
    publishedAt: Date | string | null;
    tags: string[];
    category: { name: string; slug: string; color: string } | null;
    author: { name: string | null } | null;
  };
  preview?: boolean;
  // "rail": wide layout with a sticky table of contents column on xl.
  // "inline": single reading column (used beside the ad rails and in preview).
  layout?: "rail" | "inline";
  // Rendered under the article body (share bar, author card)
  footer?: ReactNode;
}

export default async function BlogPostContent({
  post,
  preview,
  layout = "inline",
  footer,
}: BlogPostContentProps) {
  const clean = sanitizeHtml(post.content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
  });
  const { html, toc } = withHeadingAnchors(clean);
  const minutes = readingMinutes(clean);
  const showToc = toc.length >= TOC_MIN_HEADINGS;
  const rail = layout === "rail" && showToc;
  const about = await getAbout();
  const authorPhoto = about?.profilePicUrl || "/images/profile-pic.jpg";

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <article
      id="post-article"
      className={cn(
        "mx-auto w-[90%] py-10 md:py-14 xl:w-full",
        rail ? "max-w-[68rem]" : "max-w-3xl",
      )}
    >
      {preview && !post.publishedAt && (
        <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          Preview mode: this post is a draft and not yet published.
        </div>
      )}

      {/* SUB: Editorial header */}
      <header className="mb-10 max-w-3xl md:mb-12">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/60">
          {post.category && (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-3 py-1 font-medium text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: post.category.color }}
                aria-hidden="true"
              />
              {post.category.name}
            </Link>
          )}
          {date && <time dateTime={new Date(post.publishedAt!).toISOString()}>{date}</time>}
          <span>{minutes} min read</span>
        </div>

        {/* Morphs from the matching BlogCard (see lib/blog/view-transitions) */}
        <ViewTransition name={blogTitleName(post.slug)} share="vt-morph-text">
          <h1 className="text-balance font-display text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
            {post.title}
          </h1>
        </ViewTransition>

        {post.excerpt?.trim() && (
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-foreground/70 md:text-xl">
            {post.excerpt}
          </p>
        )}

        <div className="mt-6 flex items-center gap-2 text-sm text-foreground/60">
          By
          <AuthorHoverCard name={AUTHOR_NAME} photo={authorPhoto} />
        </div>
      </header>

      {post.coverImage && (
        <ViewTransition name={blogCoverName(post.slug)} share="vt-morph">
          <div className="relative mb-12 aspect-[16/9] w-full overflow-hidden rounded-[1.25rem] bg-surface md:mb-16">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes={rail ? "(max-width: 1100px) 100vw, 68rem" : "(max-width: 800px) 100vw, 48rem"}
              className="object-cover"
              priority
            />
          </div>
        </ViewTransition>
      )}

      <div className={cn(rail && "xl:grid xl:grid-cols-[minmax(0,48rem)_14rem] xl:justify-between xl:gap-16")}>
        <div className="min-w-0">
          {showToc && (
            <div className={cn(rail && "xl:hidden")}>
              <TableOfContents items={toc} variant="inline" />
            </div>
          )}

          <div className="tiptap-content">{parse(html, parserOptions)}</div>

          {post.tags.length > 0 && (
            <div className="mt-14 flex flex-wrap gap-2 border-t border-foreground/10 pt-8">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-foreground/15 px-3 py-1 text-sm text-foreground/75 transition-colors hover:border-foreground/45 hover:text-foreground"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {footer}
        </div>

        {rail && (
          <aside className="hidden xl:block">
            <div className="sticky top-28">
              <TableOfContents items={toc} variant="rail" />
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
