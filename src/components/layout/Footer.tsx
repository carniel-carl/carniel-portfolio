"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Magnetic from "@/components/motion/Magnetic";
import SplitText from "@/components/motion/SplitText";
import { NavLinks } from "@/data/navlinks";
import routes from "@/lib/routes";
import { trackEvent } from "@/lib/mixpanel";
import { AvailabilityBadge } from "@/components/general/Availability";
import type { ContactInfo } from "@/lib/availability";

type SocialLink = { name: string; link: string };

// Inset card footer: a teal card with a page-background margin all round,
// growing to full size as it scrolls in. It stays in normal flow (never
// position: fixed) and ends on the page background, so iOS 26 Safari, which
// tints the area behind its bottom bar from fixed elements at that edge or
// else the page background, keeps that area in the theme colour.
const Footer = ({
  socialLinks,
  contact,
}: {
  socialLinks: SocialLink[];
  contact: ContactInfo;
}) => {
  const [year, setYear] = useState("");
  const pathname = usePathname();
  const lenis = useLenis();
  const onPortfolio = pathname === routes.public.portfolio;
  const windowRef = useRef<HTMLDivElement>(null);
  const revealed = useInView(windowRef, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  // Grows from slightly inset to full size over its last stretch of scroll,
  // anchored at the bottom: the arrival the old curtain reveal gave, without
  // pinning anything to the viewport edge
  const { scrollYProgress } = useScroll({
    target: windowRef,
    offset: ["start end", "end end"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  // The layout (and so this footer) survives client-side navigation, while
  // pages re-render with fresh data. Re-check availability when the footer
  // comes into view on a page other than the one it was rendered for, so it
  // matches the hero and contact section after an edit.
  const [availability, setAvailability] = useState(contact);
  useEffect(() => setAvailability(contact), [contact]);
  const inView = useInView(windowRef, { amount: 0.1 });
  const checkedPath = useRef(pathname);
  useEffect(() => {
    if (!inView || checkedPath.current === pathname) return;
    // Marked only once it succeeds, so a failed check retries next time
    const path = pathname;
    fetch("/api/availability")
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh: ContactInfo | null) => {
        if (!fresh) return;
        checkedPath.current = path;
        setAvailability(fresh);
      })
      .catch(() => {});
  }, [inView, pathname]);

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const circle =
    "grid size-36 place-items-center rounded-full bg-accent-on text-center text-base font-medium text-accent transition-transform duration-500 ease-expo hover:scale-105 active:scale-95 md:size-44 md:text-lg";

  return (
    // The page-background margin: this is what sits at the bottom edge
    <div ref={windowRef} className="bg-background p-3 md:p-4">
      <motion.footer
        style={reduce ? undefined : { scale }}
        className="min-h-[min(88dvh,42rem)] origin-bottom overflow-hidden rounded-[1.25rem] bg-accent text-accent-on"
      >
        <div className="mx-auto flex min-h-[min(88dvh,42rem)] max-w-[1400px] flex-col justify-between gap-16 px-5 pb-6 pt-14 md:px-8 md:pt-20">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <SplitText
              as="h2"
              text={onPortfolio ? "Thanks for stopping by" : "Have an idea? Let's build it"}
              play={revealed}
              className="max-w-[12ch] font-display text-[clamp(3rem,8.5vw,8rem)] font-semibold leading-[0.9] tracking-[-0.04em] [font-stretch:75%]"
            />

            <Magnetic strength={0.4}>
              {onPortfolio ? (
                <button type="button" onClick={toTop} className={circle}>
                  <span className="flex flex-col items-center gap-2">
                    <ArrowUp className="size-5" />
                    Back to top
                  </span>
                </button>
              ) : (
                <Link
                  href={`${routes.public.portfolio}#contact`}
                  className={circle}
                  onClick={() =>
                    trackEvent("Footer CTA Clicked", { cta: "get_in_touch", source_page: pathname })
                  }
                >
                  <span className="flex flex-col items-center gap-2">
                    <ArrowUpRight className="size-5" />
                    Get in touch
                  </span>
                </Link>
              )}
            </Magnetic>
          </div>

          <div className="grid grid-cols-2 gap-y-8 border-t border-accent-on/20 pt-8 md:grid-cols-12">
            <nav aria-label="Footer" className="md:col-span-3">
              <ul className="flex flex-col gap-1.5">
                <li>
                  <Link href={routes.public.home} className="hover:underline underline-offset-4">
                    Home
                  </Link>
                </li>
                {NavLinks.map((item) => (
                  <li key={item.name}>
                    <Link href={item.link} className="hover:underline underline-offset-4">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {socialLinks.length > 0 && (
              <ul className="flex flex-col gap-1.5 md:col-span-3">
                {socialLinks.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="capitalize hover:underline underline-offset-4"
                      onClick={() =>
                        trackEvent("Social Link Clicked", {
                          platform: item.name,
                          url: item.link,
                          source_page: "footer",
                        })
                      }
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="col-span-2 flex flex-col gap-1 self-end text-sm text-accent-on/75 md:col-span-6 md:items-end">
              {availability.availability && (
                <AvailabilityBadge info={availability} surface="accent" className="mb-5" />
              )}
              <div className="flex gap-4">
                <Link href={routes.public.privacy} className="hover:underline underline-offset-4">
                  Privacy Policy
                </Link>
                {/* Plain <a>: the feed is XML, not a page to navigate to */}
                <a href="/feed.xml" className="hover:underline underline-offset-4">
                  RSS
                </a>
              </div>
              <p>&copy; {year} Nmugha Chimezie (Carniel). All rights reserved.</p>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Footer;
