"use client";

import React, { useEffect, useCallback } from "react";
import { IconType } from "react-icons";

interface NavLink {
  title: string;
  to: string;
  icon: IconType;
}

// Define the type for the navLinksData object
interface NavLinksData {
  id: string;
  links: NavLink[];
}
const FloatNav = ({ data }: { data: NavLinksData }) => {
  // const [showFloatNav, setShowFloatNav] = useState(false);

  const getCurrentSection = () => {
    const currentId = data.id;
    const sections = document.querySelectorAll(currentId);

    let currentSection = "";

    const scrollPosition = window.scrollY + window.innerHeight / 3; // Offset to detect earlier

    sections.forEach((section) => {
      const { offsetTop, offsetHeight, id } = section as HTMLElement;

      if (
        scrollPosition >= offsetTop &&
        scrollPosition < offsetTop + offsetHeight
      ) {
        currentSection = `#${id}`; // Return the section's ID prefixed with "#"
      }
    });

    return currentSection;
  };

  //   HDR: On Page load, Add active to the first li
  useEffect(() => {
    const navlink = document.querySelector(".float-nav li");
    if (navlink) {
      navlink.classList.add("active");
    }
  }, []);

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

    const inview = () => {
      const currentPosition = window.scrollY;

      // Ensure the first nav link is active at the top
      if (currentPosition < 150) {
        navlinks.forEach((link) => link.classList.remove("active"));
        navlinks[0]?.classList.add("active");
        return;
      }

      sections.forEach((section, index) => {
        if (!section) return; // Skip if section is null
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
    window.scrollTo({
      top: sectionEL?.offsetTop,
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
