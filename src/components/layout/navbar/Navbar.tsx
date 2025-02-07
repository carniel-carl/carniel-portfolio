"use client";
import React, { useEffect, useState } from "react";
import Logo from "@/components/general/Logo";

import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MaxWidth from "@/components/general/MaxWidth";
import { NavLinks } from "@/data/navlinks";
import { AnimatePresence, motion } from "framer-motion";

import ThemeSwitch from "@/components/general/ThemeSwitcher";
import {
  containerVariant,
  menuLinkVariant,
  menuVariant,
} from "./navbar-animation";

type MenuLinkType = {
  name: string;
  link: string;
  pathName: string;
  closeMenu: () => void;
};

const Navbar = () => {
  const pathName = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  // HDR: PREVENT SCROLL WHEN OPEN OR VISIBLE
  useEffect(() => {
    if (showMenu) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [showMenu]);

  // HDR:CLOSE DROPDOWN AND MENU
  const closeMenu = () => {
    setShowMenu(false);
  };

  return (
    <>
      <header className=" text-black fixed md:py-3 py-2 z-[20] w-full top-0">
        <MaxWidth>
          <nav className="flex items-center md:gap-x-8 gap-x-4">
            <div
              className={cn(
                "flex items-center justify-between gap-x-5 gap-y-10  py-2 flex-1 "
              )}
            >
              {/* SUB: LOGO */}
              <div
                onClick={() => {
                  setShowMenu(false);
                }}
                className="relative z-[12]"
              >
                {showMenu ? (
                  <span className="size-5 rounded-full bg-black block" />
                ) : (
                  <Logo />
                )}
              </div>

              {/* SUB: NAVLINKS */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    variants={menuVariant}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className=" bg-accent bg-opacity-[10%]  w-full h-[100svh]  md:px-10 px-6  md:pt-32 pt-24 z-10 fixed inset-0 origin-top"
                  >
                    <motion.ul
                      variants={containerVariant}
                      initial="initial"
                      animate="open"
                      exit="initial"
                      className="flex flex-col gap-y-6  md:items-start items-center"
                    >
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUB: SUB BUTTON */}
              <div className="flex items-center gap-2 ">
                <ThemeSwitch />

                <button
                  className="relative z-[12]"
                  onClick={() => setShowMenu((prev) => !prev)}
                >
                  {showMenu ? (
                    <span className="uppercase text-lg">Close</span>
                  ) : (
                    <Menu size={30} className="dark:text-white" />
                  )}
                </button>
              </div>
            </div>
          </nav>
        </MaxWidth>
      </header>
    </>
  );
};

const MenuLink = ({ link, name, pathName, closeMenu }: MenuLinkType) => {
  return (
    <motion.div variants={menuLinkVariant}>
      <Link
        href={link}
        className={cn(
          "text-4xl md:text-8xl uppercase",
          pathName === link && "text-white"
        )}
        onClick={closeMenu}
      >
        {name}
      </Link>
    </motion.div>
  );
};

export default React.memo(Navbar);
