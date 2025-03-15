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
} from "@/components/animations/navbar-animation";
import { FocusTrap } from "focus-trap-react";
import { TfiClose } from "react-icons/tfi";
import { socialLinks } from "@/data/social-links";
import MenuButton from "./MenuButton";

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
      <header className=" text-black bg-background/10 backdrop-blur-sm fixed md:py-3 py-2 z-[20] w-full top-0">
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
              >
                <Logo />
              </div>

              {/* SUB: SUB BUTTON */}
              <div className="flex items-center gap-2 relative">
                <ThemeSwitch />
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
                        role="modal"
                        className=" bg-accent absolute top-0 right-0 rounded-[25px] overflow-hidden z-20"
                      >
                        <div className="flex flex-col pb-8 md:px-8 px-6   md:pt-28 pt-20 gap-20 w-full h-full justify-between ">
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
                            transition={{ delay: 3.5 }}
                            exit="initial"
                            className="mt-auto flex items-center justify-around gap-10"
                          >
                            <button
                              className="hover:scale-110 duration-300 transiton ease-in-out"
                              onClick={() => setShowMenu((prev) => !prev)}
                            >
                              <span className="sr-only">Close menu</span>
                              <TfiClose className="md:size-12 size-8 font-thin opacity-65" />
                            </button>
                            <ul className="grid grid-cols-2 md:gap-x-4 gap-x-2">
                              {socialLinks.map((item) => (
                                <li
                                  key={item.name}
                                  className="hover:scale-110 duration-300 transiton ease-in-out"
                                >
                                  <a
                                    href={item.link}
                                    className="capitalize font-semibold text-base "
                                  >
                                    {item.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        aria-hidden="true"
                        onClick={() => setShowMenu(false)}
                        className="bg-background/60  backdrop-blur-xl  fixed inset-0 w-full h-screen"
                      />
                    </>
                  )}
                </AnimatePresence>
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
          "text-3xl md:text-5xl uppercase hover:tracking-widest focus-within:tracking-widest duration-300 transiton ease-in-out",
          pathName === link && "text-white "
        )}
        onClick={closeMenu}
      >
        {name}
      </Link>
    </motion.div>
  );
};

export default React.memo(Navbar);
