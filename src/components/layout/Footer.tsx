"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Magnetic from "@/components/motion/Magnetic";
import SplitText from "@/components/motion/SplitText";
import { NavLinks } from "@/data/navlinks";
import routes from "@/lib/routes";
import { trackEvent } from "@/lib/mixpanel";

type SocialLink = { name: string; link: string };

// Curtain footer: the fixed panel sits behind the page and is uncovered by a
// clip-path window as the last section scrolls away.
const Footer = ({ socialLinks }: { socialLinks: SocialLink[] }) => {
  const [year, setYear] = useState("");
  const pathname = usePathname();
  const lenis = useLenis();
  const onPortfolio = pathname === routes.public.portfolio;
  // The fixed panel is always "in view" to an observer, so watch the window
  const windowRef = useRef<HTMLDivElement>(null);
  const revealed = useInView(windowRef, { once: true, amount: 0.5 });

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
    <div
      ref={windowRef}
      className="relative h-[min(92dvh,44rem)]"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <footer className="fixed bottom-0 left-0 h-[min(92dvh,44rem)] w-full bg-accent text-accent-on">
        <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-between px-4 pb-6 pt-16 md:px-8 md:pt-20">
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
              <Link href={routes.public.privacy} className="hover:underline underline-offset-4">
                Privacy Policy
              </Link>
              <p>&copy; {year} Nmugha Chimezie (Carniel). All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
