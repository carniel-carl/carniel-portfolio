"use client";
import React, { useEffect, useState } from "react";
import Logo from "@/components/general/Logo";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks } from "@/data/navlinks";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";

import ThemeSwitch from "@/components/general/ThemeSwitcher";
import {
  containerVariant,
  menuLinkVariant,
  menuVariant,
} from "@/components/animations/navbar-animation";
import { FocusTrap } from "focus-trap-react";
import { useLenis } from "lenis/react";
import { X } from "lucide-react";
import MenuButton from "./MenuButton";
import { trackEvent } from "@/lib/mixpanel";
import { RollingLabel } from "@/components/motion/PillLink";

type SocialLink = {
  name: string;
  link: string;
};

type MenuLinkType = {
  name: string;
  link: string;
  pathName: string;
  closeMenu: () => void;
};

const Navbar = ({ socialLinks }: { socialLinks: SocialLink[] }) => {
  const pathName = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // HDR: HIDE ON SCROLL DOWN, REVEAL ON SCROLL UP
  // State only flips at thresholds, so this does not re-render per frame.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    const nextHidden = y > prev && y > 160;
    if (nextHidden !== hidden) setHidden(nextHidden);
    const nextScrolled = y > 24;
    if (nextScrolled !== scrolled) setScrolled(nextScrolled);
  });

  // HDR: PREVENT SCROLL WHEN OPEN OR VISIBLE
  // Lenis drives wheel/touch scrolling itself, so it must be paused too;
  // overflow on <html> covers keyboard and scrollbar scrolling.
  const lenis = useLenis();
  useEffect(() => {
    if (!showMenu) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    lenis?.stop();
    html.style.overflow = "hidden";
    document.body.classList.add("no-scroll");
    return () => {
      lenis?.start();
      html.style.overflow = prevOverflow;
      document.body.classList.remove("no-scroll");
    };
  }, [showMenu, lenis]);

  // HDR: CLOSE ON ESCAPE
  useEffect(() => {
    if (!showMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMenu]);

  // HDR:CLOSE DROPDOWN AND MENU
  const closeMenu = () => {
    setShowMenu(false);
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !showMenu ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        // No background, blur or border on the fixed box itself: iOS Safari
        // would tint its status bar from them (see globals.css)
        className="vt-chrome-header fixed inset-x-0 top-0 z-[100]"
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 border-b transition-[opacity,border-color] duration-500",
            scrolled && !showMenu
              ? "border-foreground/[0.06] bg-background/70 opacity-100 backdrop-blur-xl"
              : "border-transparent opacity-0",
          )}
        />
        <nav className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:h-[4.5rem] md:px-8">
          {/* SUB: LOGO */}
          <div
            className="flex items-center gap-3"
            onClick={() => {
              setShowMenu(false);
            }}
          >
            <Logo />
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-[-0.02em]"
            >
              Carniel
            </Link>
          </div>

          {/* SUB: SUB BUTTON */}
          <div className="relative flex items-center gap-2">
            <ThemeSwitch />
            <FocusTrap active={showMenu}>
              <div>
                <MenuButton
                  type="button"
                  showMenu={showMenu}
                  setShowMenu={setShowMenu}
                />
                {/* SUB: NAVLINKS */}
                <AnimatePresence>
                  {showMenu && (
                    <>
                      <motion.div
                        variants={menuVariant}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Site menu"
                        className="absolute right-0 top-0 z-[200] overflow-hidden rounded-[25px] bg-accent text-accent-on"
                      >
                        <div className="flex h-full w-full flex-col justify-between gap-20 px-6 pb-8 pt-20 md:px-8 md:pt-24">
                          <motion.ul
                            variants={containerVariant}
                            initial="initial"
                            animate="open"
                            exit="initial"
                            className="flex flex-col gap-y-4"
                          >
                            <li className="overflow-hidden">
                              <MenuLink
                                name="Home"
                                link="/"
                                closeMenu={closeMenu}
                                pathName={pathName}
                              />
                            </li>
                            {NavLinks.map(({ name, link }) => {
                              return (
                                <li key={name} className="overflow-hidden">
                                  <MenuLink
                                    name={name}
                                    link={link}
                                    closeMenu={closeMenu}
                                    pathName={pathName}
                                  />
                                </li>
                              );
                            })}
                          </motion.ul>

                          {/* SUB: Bottom content */}
                          <motion.div
                            variants={menuLinkVariant}
                            initial="initial"
                            animate={{
                              y: 0,
                              transition: {
                                duration: 0.7,
                                delay: 0.75,
                                ease: [0, 0.55, 0.45, 1],
                              },
                            }}
                            exit="initial"
                            className="mt-auto flex items-end justify-between gap-10"
                          >
                            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                              {socialLinks.map((item) => (
                                <li key={item.name}>
                                  <a
                                    href={item.link}
                                    className="text-sm font-medium capitalize underline-offset-4 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() =>
                                      trackEvent("Social Link Clicked", {
                                        platform: item.name,
                                        url: item.link,
                                        source_page: "navbar",
                                      })
                                    }
                                  >
                                    {item.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                            <button
                              className="grid size-11 place-items-center rounded-full border border-accent-on/25 transition-transform duration-300 hover:rotate-90"
                              onClick={() => setShowMenu((prev) => !prev)}
                            >
                              <span className="sr-only">Close menu</span>
                              <X className="size-5" />
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        aria-hidden="true"
                        onClick={closeMenu}
                        className="fixed inset-0 h-[100dvh] w-full bg-background/60 backdrop-blur-xl"
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </FocusTrap>
          </div>
        </nav>
      </motion.header>
    </>
  );
};

const MenuLink = ({ link, name, pathName, closeMenu }: MenuLinkType) => {
  const active = pathName === link;
  return (
    <motion.div variants={menuLinkVariant}>
      <Link
        href={link}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-3 font-display text-5xl font-semibold tracking-[-0.03em] [font-stretch:75%] md:text-6xl",
          active ? "opacity-100" : "opacity-60 hover:opacity-100",
        )}
        onClick={closeMenu}
      >
        <RollingLabel>{name}</RollingLabel>
        {active && <span className="size-2.5 rounded-full bg-accent-on" aria-hidden="true" />}
      </Link>
    </motion.div>
  );
};

export default React.memo(Navbar);
