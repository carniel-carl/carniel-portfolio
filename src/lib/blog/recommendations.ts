import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";

// How many posts the "Keep reading" section shows
export const RECOMMENDATION_LIMIT = 4;

// Upper bound on posts compared per request; plenty for a personal blog
const CORPUS_SIZE = 300;

// Blend of the three signals, each scored 0..1
const WEIGHTS = { text: 0.55, tags: 0.25, category: 0.2 };
// Title words say more about a post than excerpt words
const FIELD_WEIGHTS = { title: 3, excerpt: 1 };

const STOP_WORDS = new Set(
  (
    "a an and are as at be but by can do does for from how i if in into is it its " +
    "just me my no not of on or our so than that the their them then there these " +
    "this to up us use using was we what when where which while who why will with " +
    "you your about after all also am any been before being both did each few get " +
    "got has have he her here him his more most much new now off only other out over " +
    "same she should some such too under very way were what's you're guide practical " +
    "part intro introduction"
  ).split(" "),
);

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  tags: true,
  categoryId: true,
  category: { select: { name: true, slug: true, color: true } },
  author: { select: { name: true } },
} as const;

/**
 * Posts to read after `postId`, most similar first. Similarity blends
 * TF-IDF cosine over title + excerpt, tag overlap and a shared
 * category; newer posts win ties. Unrelated posts trail, newest first, so
 * the list only comes up short when there are no other posts.
 */
export async function getRecommendedPosts(
  postId: string,
  limit: number = RECOMMENDATION_LIMIT,
) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const posts = await prisma.blogPost.findMany({
    where: { OR: [{ published: true }, { id: postId }] },
    orderBy: { publishedAt: "desc" },
    take: CORPUS_SIZE,
    select: cardSelect,
  });

  const target = posts.find((p) => p.id === postId);
  if (!target) return [];

  const vectors = buildTfIdfVectors(posts);
  const targetVector = vectors.get(target.id)!;
  const targetTags = normalizeTags(target.tags);

  return posts
    .filter((p) => p.id !== target.id && p.publishedAt)
    .map((post) => {
      const text = cosine(targetVector, vectors.get(post.id)!);
      const tags = jaccard(targetTags, normalizeTags(post.tags));
      const category = post.categoryId === target.categoryId ? 1 : 0;
      return {
        post,
        score: WEIGHTS.text * text + WEIGHTS.tags * tags + WEIGHTS.category * category,
      };
    })
    // Posts arrive newest first and the sort is stable, so ties stay by date
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post: { categoryId: _categoryId, ...post } }) => post);
}

type Doc = { id: string; title: string; excerpt: string | null };

function buildTfIdfVectors(docs: Doc[]) {
  const termCounts = docs.map((doc) => {
    const counts = new Map<string, number>();
    const add = (text: string, weight: number) => {
      for (const term of tokenize(text)) {
        counts.set(term, (counts.get(term) ?? 0) + weight);
      }
    };
    add(doc.title, FIELD_WEIGHTS.title);
    add(doc.excerpt ?? "", FIELD_WEIGHTS.excerpt);
    return counts;
  });

  const docFrequency = new Map<string, number>();
  for (const counts of termCounts) {
    for (const term of counts.keys()) {
      docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1);
    }
  }

  // Smoothed IDF: words used everywhere on the blog count for little
  const idf = (term: string) =>
    Math.log((docs.length + 1) / ((docFrequency.get(term) ?? 0) + 1)) + 1;

  return new Map(
    docs.map((doc, i) => {
      const vector = new Map<string, number>();
      for (const [term, count] of termCounts[i]) {
        vector.set(term, (1 + Math.log(count)) * idf(term));
      }
      return [doc.id, vector];
    }),
  );
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map(stem);
}

// Light suffix stripping so "caching"/"cache" and "hooks"/"hook" match
function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  if (word.length > 4 && word.endsWith("e")) return word.slice(0, -1);
  return word;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [term, weight] of a) dot += weight * (b.get(term) ?? 0);
  if (!dot) return 0;
  return dot / (magnitude(a) * magnitude(b));
}

function magnitude(v: Map<string, number>): number {
  let sum = 0;
  for (const weight of v.values()) sum += weight * weight;
  return Math.sqrt(sum);
}

function normalizeTags(tags: string[]): Set<string> {
  return new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const tag of a) if (b.has(tag)) shared++;
  return shared / (a.size + b.size - shared);
}
