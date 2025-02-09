"use client";

import React, { useEffect, useCallback } from "react";
import { IconType } from "react-icons";

interface NavLink {
  title: string;
  to: string;
  icon: IconType;
}

interface NavLinksData {
  id: string;
  links: NavLink[];
}
const FloatNav = ({ data }: { data: NavLinksData }) => {
  // const [showFloatNav, setShowFloatNav] = useState(false);

  // TIMER FOR SHOWING FLOATING NAVIGATION
  // useEffect(() => {
  //   let timeoutid;

  //   const handleScroll = () => {
  //     clearTimeout(timeoutid);
  //     setShowFloatNav(false);

  //     timeoutid = setTimeout(() => {
  //       setShowFloatNav(true);
  //     }, 800);
  //   };

  //   window.addEventListener("scroll", handleScroll);

  //   return () => {
  //     clearTimeout(timeoutid);
  //     window.removeEventListener("scroll", handleScroll);
  //   };
  // }, []);

  //HDR: SETTING THE ACTIVE NAV LINK BASED ON SCROLLED POSITION
  useEffect(() => {
    const currentId = data.id;
    const navlinks = document.querySelectorAll(".float-nav li");
    const sections = document.querySelectorAll(currentId);
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const offset = 100;

    const inview = () => {
      const currentPosition = window.scrollY;

      //SUB: Ensure the first nav link is active at the top
      if (currentPosition < offset) {
        navlinks.forEach((link) => link.classList.remove("active"));
        navlinks[0]?.classList.add("active");
        return;
      }

      //SUB: Ensure the last nav link is active when at the bottom of the page
      if (currentPosition + windowHeight >= documentHeight - offset) {
        navlinks.forEach((link) => link.classList.remove("active"));
        navlinks[navlinks.length - 1]?.classList.add("active");
        return;
      }

      sections.forEach((section, index) => {
        if (!section) return;
        const sectionElement = section as HTMLElement;
        const sectionTop = sectionElement.offsetTop;
        const sectionHeight = sectionElement.offsetHeight;

        if (
          currentPosition >= sectionTop - sectionHeight / 2 &&
          currentPosition < sectionTop + sectionHeight / 2
        ) {
          navlinks.forEach((link) => link.classList.remove("active"));
          navlinks[index]?.classList.add("active");
        }
      });
    };

    window.addEventListener("scroll", inview);

    inview(); // Run once on mount to set initial active class

    return () => {
      window.removeEventListener("scroll", inview);
    };
  }, []);

  //   HDR: Scroll to section on click
  const scrollToSection = useCallback((elementRef: string) => {
    if (elementRef === "#") {
      window.scrollTo({
        top: 0,
      });
      return;
    }
    const sectionEL = document.querySelector(elementRef) as HTMLElement;
    const offset = 70;
    window.scrollTo({
      top: sectionEL?.offsetTop - offset,
    });
  }, []);

  return (
    <nav className="float-nav">
      <div className="navigation">
        <ul className="icons">
          {data.links.map((item) => (
            <li key={item.title}>
              <div
                className="navigate"
                onClick={() => scrollToSection(item.to)}
              >
                <span className="icon">
                  <item.icon />
                </span>

                <span className="tooltip">{item.title}</span>
              </div>
            </li>
          ))}

          <div className="indicator" />
        </ul>
      </div>
    </nav>
  );
};

export default React.memo(FloatNav);
