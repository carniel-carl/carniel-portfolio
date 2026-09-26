"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, PenLine } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import PillLink from "@/components/motion/PillLink";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { LatestPost } from "@/lib/data/portfolio";

const formatDate = (d: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

// Lead story on the left, two stacked on the right
const LatestWriting = ({ posts }: { posts: LatestPost[] }) => {
  const reduce = useReducedMotion();
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-24 md:px-8 md:pb-40">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SplitText
          as="h2"
          text="Latest writing"
          className="font-display text-[clamp(3rem,9vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] [font-stretch:75%]"
        />
        <PillLink
          href={routes.public.blog}
          variant="ghost"
          icon={<ArrowUpRight />}
          className="w-fit shrink-0"
        >
          Read the blog
        </PillLink>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-12 md:gap-6">
        {posts.map((post, i) => {
          const lead = i === 0;
          return (
            <motion.article
              key={post.id}
              initial={reduce ? false : { opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              className={cn(
                "group relative flex flex-col gap-5",
                lead ? "md:col-span-7 md:row-span-2" : "md:col-span-5",
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-[1.25rem] bg-surface",
                  lead ? "aspect-[4/3]" : "aspect-[16/9]",
                )}
              >
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt=""
                    fill
                    sizes={lead ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 40vw"}
                    className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-foreground/30">
                    <PenLine className="size-10" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-foreground/60">
                  {[post.category?.name, formatDate(post.publishedAt)]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <h3
                  className={cn(
                    "font-display font-semibold leading-[1.08] tracking-[-0.025em]",
                    lead ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl",
                  )}
                >
                  <Link
                    href={routes.public.blogPost(post.slug)}
                    className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-expo after:absolute after:inset-0 group-hover:bg-[length:100%_2px]"
                  >
                    {post.title}
                  </Link>
                </h3>
                {lead && post.excerpt && (
                  <p className="max-w-[55ch] leading-relaxed text-foreground/70 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default LatestWriting;
