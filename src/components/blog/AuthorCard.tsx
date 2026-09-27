import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import PillLink from "@/components/motion/PillLink";
import { getAbout } from "@/lib/data/portfolio";
import routes from "@/lib/routes";
import { AUTHOR_NAME } from "@/lib/site";

// "Written by" card at the end of a post; portrait comes from the About admin
export default async function AuthorCard() {
  const about = await getAbout();
  const photo = about?.profilePicUrl || "/images/profile-pic.jpg";

  return (
    <aside
      aria-label="About the author"
      className="mt-10 flex flex-col gap-6 rounded-[1.25rem] border border-foreground/10 bg-surface p-6 sm:flex-row sm:items-center md:p-8"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-background">
        <Image src={photo} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-sm text-foreground/60">Written by</p>
        <p className="font-display text-2xl font-semibold tracking-[-0.02em]">
          {AUTHOR_NAME}
        </p>
        <p className="max-w-[48ch] text-foreground/70">
          Web and mobile developer building fast, accessible apps with React,
          Next.js and React Native.
        </p>
      </div>
      <PillLink
        href={routes.public.portfolio}
        variant="ghost"
        icon={<ArrowUpRight />}
        className="w-fit shrink-0"
      >
        View portfolio
      </PillLink>
    </aside>
  );
}
